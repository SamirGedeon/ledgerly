class ReportingPeriod
  attr_reader :month
  def initialize(value)
    value = Time.current.in_time_zone("America/Sao_Paulo").strftime("%Y-%m") if value.blank?
    raise InvalidInput, "month must use YYYY-MM" unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}\z/)
    @month = Date.strptime(value, "%Y-%m").beginning_of_month
    raise InvalidInput, "month must be between 2000 and 2100" unless (2000..2100).cover?(@month.year)
  rescue Date::Error
    raise InvalidInput, "month must use a valid YYYY-MM"
  end
  def range = month..month.end_of_month
end
