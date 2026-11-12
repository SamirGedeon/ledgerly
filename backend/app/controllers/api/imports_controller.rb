module Api
  class ImportsController < ApplicationController
    before_action :require_owner!
    def create
      render json: CsvImport.new(current_account, params.require(:csv)).call
    end
  end
end
