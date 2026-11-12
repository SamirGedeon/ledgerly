class Account < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :entries, dependent: :restrict_with_error
  has_many :categories, dependent: :restrict_with_error
  has_many :budgets, dependent: :restrict_with_error
  validates :name, presence: true
end
