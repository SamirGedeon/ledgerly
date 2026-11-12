ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
abort("Refusing to run tests outside test") unless Rails.env.test?
require "rspec/rails"
ActiveRecord::Migration.maintain_test_schema!
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.include ActiveSupport::Testing::TimeHelpers
end
