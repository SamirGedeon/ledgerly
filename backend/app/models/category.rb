class Category < ApplicationRecord
  belongs_to :account
  has_many :entries, dependent: :restrict_with_error
  has_many :budgets, dependent: :restrict_with_error
  normalizes :name, with: ->(value) { value.strip }
  validates :name, presence: true, length: { maximum: 80 }, uniqueness: { scope: :account_id }
  validates :color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }
end
