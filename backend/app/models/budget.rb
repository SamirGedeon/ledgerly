class Budget < ApplicationRecord
  belongs_to :account
  belongs_to :category
  validates :limit_cents, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000_000 }
  validates :month, presence: true, uniqueness: { scope: [:account_id, :category_id] }
  validate do
    errors.add(:month, "must be the first day of a month") if month && month.day != 1
    errors.add(:category, "must belong to this workspace") unless category&.account_id == account_id
  end
end
