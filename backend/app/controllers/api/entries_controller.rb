module Api
  class EntriesController < ApplicationController
    before_action :require_owner!, except: :index
    def index
      page = Integer(params.fetch(:page, 1), exception: false)
      raise InvalidInput, "page must be between 1 and 10000" unless page && (1..10_000).cover?(page)
      scope = filtered_entries
      render json: { entries: scope.limit(20).offset((page - 1) * 20), total: scope.count, page: page, per_page: 20 }
    end
    def create
      data = params.require(:entry).permit(:description, :kind, :amount_cents, :occurred_on, :category_id)
      category = current_account.categories.find(data.delete(:category_id))
      record = current_account.entries.create!(data.merge(category: category))
      render json: record, status: :created
    end
    def void
      record = current_account.entries.find(params[:id])
      record.with_lock { record.update!(voided_at: Time.current) unless record.voided_at }
      render json: record
    end
  end
end
