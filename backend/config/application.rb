require_relative "boot"
require "rails"
require "active_record/railtie"
require "action_controller/railtie"
Bundler.require(*Rails.groups)
module Ledgerly
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true
    config.secret_key_base = ENV.fetch("SECRET_KEY_BASE") { Rails.env.production? ? raise("Set SECRET_KEY_BASE") : "development-only-" * 8 }
    config.active_record.schema_format = :ruby
    config.cache_store = :memory_store
    config.hosts = ["localhost", "127.0.0.1", "api"]
    config.hosts << ENV["APP_HOST"] if ENV["APP_HOST"].present?
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5174")
        resource "/api/*", headers: :any, methods: %i[get post patch delete options]
      end
    end
  end
end
