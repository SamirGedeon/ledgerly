class User < ApplicationRecord
  belongs_to :account
  has_many :sessions, dependent: :destroy
  has_secure_password
  normalizes :email, with: ->(email) { email.strip.downcase }
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 12 }, allow_nil: true
  validates :role, inclusion: { in: %w[owner viewer] }
end
