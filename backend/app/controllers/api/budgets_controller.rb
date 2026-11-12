module Api
  class BudgetsController < ApplicationController
    before_action :require_owner!, only: :create
    def index
      spent = current_account.entries.active.where(kind: "expense", occurred_on: period.range).group(:category_id).sum(:amount_cents)
      render json: current_account.budgets.includes(:category).where(month: period.month).order(:id).map { |b|
        { id: b.id, category_id: b.category_id, category_name: b.category.name, category_color: b.category.color,
          month: b.month, limit_cents: b.limit_cents, spent_cents: spent.fetch(b.category_id, 0) }
      }
    end
    def create
      data = params.require(:budget).permit(:category_id, :month, :limit_cents)
      category = current_account.categories.find(data[:category_id])
      month = ReportingPeriod.new(data[:month]).month
      record = current_account.budgets.find_or_initialize_by(category: category, month: month)
      record.update!(limit_cents: data[:limit_cents])
      render json: { id: record.id, category_id: record.category_id, month: record.month, limit_cents: record.limit_cents }
    end
  end
end
