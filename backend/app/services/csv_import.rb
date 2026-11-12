require "csv"
require "bigdecimal"
class CsvImport
  HEADERS = %w[external_id date description kind amount category].freeze
  MAX_BYTES = 200_000
  MAX_ROWS = 500
  def initialize(account, content)
    @account, @content = account, content
  end
  def call
    raise InvalidInput, "CSV must be a UTF-8 string under 200 KB" unless @content.is_a?(String) && @content.bytesize <= MAX_BYTES && @content.valid_encoding?
    rows = CSV.parse(@content.delete_prefix("\uFEFF"), headers: true)
    raise InvalidInput, "CSV headers must be: #{HEADERS.join(',')}" unless rows.headers.compact.sort == HEADERS.sort && rows.headers.length == HEADERS.length
    raise InvalidInput, "CSV must contain 1 to 500 rows" unless (1..MAX_ROWS).cover?(rows.size)
    created = skipped = 0
    # Serializes imports in a workspace; the unique index is the final duplicate guard.
    @account.with_lock do
      rows.each_with_index do |row, index|
        raise InvalidInput, "Row #{index + 2}: wrong number of columns" unless row.fields.length == HEADERS.length
        begin
          raise InvalidInput, "external_id is required and must be a stable reference" unless row["external_id"].to_s.match?(/\A[A-Za-z0-9][A-Za-z0-9._:-]{0,99}\z/)
          category = @account.categories.find_by(name: row["category"].to_s.strip)
          raise InvalidInput, "unknown category" unless category
          amount = row["amount"].to_s
          raise InvalidInput, "amount must be positive decimal BRL, e.g. 125.50" unless amount.match?(/\A(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?\z/)
          date = row["date"].to_s
          raise InvalidInput, "date must use YYYY-MM-DD" unless date.match?(/\A\d{4}-\d{2}-\d{2}\z/)
          attrs = { category_id: category.id, occurred_on: Date.iso8601(date), description: row["description"], kind: row["kind"], amount_cents: (BigDecimal(amount) * 100).to_i }
          record = @account.entries.find_or_initialize_by(external_id: row["external_id"])
          if record.persisted?
            raise InvalidInput, "external_id already exists with different data" unless attrs.all? { |key, value| record.public_send(key) == value }
            skipped += 1
          else
            record.assign_attributes(attrs)
            record.save!
            created += 1
          end
        rescue ActiveRecord::RecordInvalid, Date::Error, InvalidInput => e
          raise InvalidInput, "Row #{index + 2}: #{e.message}"
        end
      end
    end
    { created: created, skipped: skipped }
  rescue CSV::MalformedCSVError, Encoding::InvalidByteSequenceError, ArgumentError => e
    raise InvalidInput, "Invalid CSV: #{e.message}"
  end
end
