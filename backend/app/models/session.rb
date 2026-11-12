class Session < ApplicationRecord
  belongs_to :user
  def self.issue!(user)
    token = SecureRandom.hex(32)
    create!(user: user, token_digest: Digest::SHA256.hexdigest(token), expires_at: 12.hours.from_now)
    token
  end
end
