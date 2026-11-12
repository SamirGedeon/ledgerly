namespace :workspace do
  desc "Provision a workspace and owner using protected runtime environment variables"
  task bootstrap: :environment do
    Account.transaction do
      account = Account.create!(name: ENV.fetch("WORKSPACE_NAME"))
      account.users.create!(name: ENV.fetch("OWNER_NAME"), email: ENV.fetch("OWNER_EMAIL"), password: ENV.fetch("OWNER_PASSWORD"), role: "owner")
    end
    puts "Workspace created."
  end
end
