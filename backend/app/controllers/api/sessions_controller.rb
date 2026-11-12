module Api
  class SessionsController < ApplicationController
    skip_before_action :authenticate!, only: :create
    rate_limit to: 10, within: 3.minutes, only: :create,
      with: -> { render json: { errors: ["Too many attempts. Try again in three minutes."] }, status: :too_many_requests }
    def create
      user = User.find_by(email: params.require(:email).to_s.strip.downcase)
      if user&.authenticate(params.require(:password))
        render json: { token: Session.issue!(user), user: user_json(user) }, status: :created
      else
        BCrypt::Password.create("invalid-password", cost: BCrypt::Engine.cost) unless user
        render json: { errors: ["Invalid email or password"] }, status: :unauthorized
      end
    end
    def show
      render json: { user: user_json(current_user) }
    end
    def destroy
      @session.destroy!
      head :no_content
    end
    private
    def user_json(user)
      user.as_json(only: %i[id name email role]).merge(account_name: user.account.name, time_zone: user.account.time_zone)
    end
  end
end
