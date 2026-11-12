class ApplicationController < ActionController::API
  before_action :authenticate!
  rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { errors: ["Resource not found"] }, status: :not_found }
  rescue_from ActiveRecord::RecordInvalid, with: ->(e) { render json: { errors: e.record.errors.full_messages }, status: 422 }
  rescue_from ActionController::ParameterMissing, with: ->(e) { render json: { errors: [e.message] }, status: :bad_request }
  rescue_from InvalidInput, with: ->(e) { render json: { errors: [e.message] }, status: 422 }
  rescue_from ActiveRecord::RecordNotUnique, with: -> { render json: { errors: ["This record already exists. Refresh and try again."] }, status: :conflict }
  private
  def authenticate!
    token = request.authorization.to_s.delete_prefix("Bearer ")
    @session = Session.includes(:user).where("expires_at > ?", Time.current).find_by(token_digest: Digest::SHA256.hexdigest(token)) if token.present?
    render json: { errors: ["Please sign in again"] }, status: :unauthorized unless @session
  end
  def current_user = @session.user
  def current_account = current_user.account
  def require_owner!
    render json: { errors: ["Only workspace owners can change financial records"] }, status: :forbidden unless current_user.role == "owner"
  end
  def period
    @period ||= ReportingPeriod.new(params[:month])
  end
  def filtered_entries
    scope = current_account.entries.includes(:category).where(occurred_on: period.range)
    if params[:category_id].present?
      category = current_account.categories.find(params[:category_id])
      scope = scope.where(category: category)
    end
    if params[:kind].present?
      raise InvalidInput, "kind must be income or expense" unless %w[income expense].include?(params[:kind])
      scope = scope.where(kind: params[:kind])
    end
    scope = scope.where("description ILIKE ?", "%#{Entry.sanitize_sql_like(params[:q].to_s[0,100])}%") if params[:q].present?
    scope.order(occurred_on: :desc, id: :desc)
  end
end
