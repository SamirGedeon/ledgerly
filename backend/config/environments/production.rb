Rails.application.configure do
  config.eager_load = true
  config.consider_all_requests_local = false
  config.log_level = :info
  config.force_ssl = ENV.fetch("FORCE_SSL", "true") == "true"
  config.assume_ssl = config.force_ssl
  config.logger = ActiveSupport::Logger.new(STDOUT)
end
