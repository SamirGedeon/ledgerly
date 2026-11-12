module Api
  class CategoriesController < ApplicationController
    before_action :require_owner!, only: :create
    def index
      render json: current_account.categories.order(:name).as_json(only: %i[id name color])
    end
    def create
      record = current_account.categories.create!(params.require(:category).permit(:name, :color))
      render json: record.as_json(only: %i[id name color]), status: :created
    end
  end
end
