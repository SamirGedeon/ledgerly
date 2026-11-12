class Entry < ApplicationRecord
  belongs_to :account
  belongs_to :category
  before_validation -> { self.external_id ||= "manual:#{SecureRandom.uuid}" }, on: :create
  validates :description, presence: true, length: { maximum: 160 }
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000_000 }
  validates :kind, inclusion: { in: %w[income expense] }
  validates :occurred_on, presence: true
  validates :external_id, format: { with: /\A[A-Za-z0-9][A-Za-z0-9._:-]{0,99}\z/ }, uniqueness: { scope: :account_id }
  validate :workspace_category
  scope :active, -> { where(voided_at: nil) }
  def as_json(options = {})
    super(only: %i[id external_id description kind amount_cents occurred_on voided_at category_id])
      .merge(category_name: category.name, category_color: category.color)
  end
  private
  def workspace_category
    errors.add(:category, "must belong to this workspace") unless category&.account_id == account_id
  end
end
