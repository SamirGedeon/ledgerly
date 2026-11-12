class FinancialReport
  def initialize(account, period)
    @account, @period = account, period
  end
  def call
    entries = @account.entries.active.where(occurred_on: @period.range)
    totals = entries.group(:kind).sum(:amount_cents)
    income, expense = totals.fetch("income", 0), totals.fetch("expense", 0)
    daily = entries.group(:occurred_on, :kind).sum(:amount_cents)
    grouped = entries.where(kind: "expense").group(:category_id).sum(:amount_cents)
    categories = @account.categories.where(id: grouped.keys).index_by(&:id)
    { income_cents: income, expense_cents: expense, balance_cents: income - expense,
      transaction_count: entries.count,
      daily: @period.range.map { |day| { date: day, income_cents: daily.fetch([day, "income"], 0), expense_cents: daily.fetch([day, "expense"], 0) } },
      by_category: grouped.map { |id, total| { name: categories.fetch(id).name, color: categories.fetch(id).color, amount_cents: total } }.sort_by { |c| -c[:amount_cents] } }
  end
end
