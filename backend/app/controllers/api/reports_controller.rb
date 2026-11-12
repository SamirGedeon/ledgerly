require "csv"
module Api
  class ReportsController < ApplicationController
    def summary
      render json: FinancialReport.new(current_account, period).call
    end
    def export
      records = filtered_entries.active.limit(5001).to_a
      raise InvalidInput, "Export exceeds 5000 rows. Narrow your filters." if records.size > 5000
      csv = CSV.generate do |out|
        out << CsvImport::HEADERS
        records.each do |entry|
          out << [entry.external_id, entry.occurred_on.iso8601, safe_cell(entry.description), entry.kind,
                  "#{entry.amount_cents / 100}.#{(entry.amount_cents % 100).to_s.rjust(2, '0')}", safe_cell(entry.category.name)]
        end
      end
      send_data csv, type: "text/csv; charset=utf-8", disposition: "attachment", filename: "ledgerly-#{period.month.strftime('%Y-%m')}.csv"
    end
    private
    def safe_cell(value)
      value.match?(/\A[\s]*[=+@-]/) || value.start_with?("\t", "\r", "\n") ? "'#{value}" : value
    end
  end
end
