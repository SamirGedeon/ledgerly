require "rails_helper"
require "csv"
RSpec.describe "Financial workspace", type: :request do
  let!(:account) { Account.create!(name: "Studio") }
  let!(:owner) { account.users.create!(name: "Owner", email: "owner@example.test", password: "long-enough-password", role: "owner") }
  let!(:category) { account.categories.create!(name: "Software", color: "#8273d3") }
  let(:auth) { { "Authorization" => "Bearer #{Session.issue!(owner)}" } }
  let(:row) { { category: category, description: "License", kind: "expense", amount_cents: 12550, occurred_on: "2026-11-10" } }
  let(:csv) { "external_id,date,description,kind,amount,category\ninvoice-1,2026-11-10,License,expense,125.50,Software\n" }
  def import(content)
    post "/api/imports", params: { csv: content }, headers: auth
  end
  it "authenticates and revokes logout sessions" do
    get "/api/summary"
    expect(response.status).to eq(401)
    post "/api/session", params: { email: owner.email, password: "long-enough-password" }
    expect(response.status).to eq(201)
    h = { "Authorization" => "Bearer #{response.parsed_body.fetch('token')}" }
    delete "/api/session", headers: h
    get "/api/session", headers: h
    expect(response.status).to eq(401)
  end
  it "aggregates exact cents and excludes voided and other-month entries" do
    account.entries.create!(row.merge(kind: "income", amount_cents: 50000))
    expense = account.entries.create!(row)
    account.entries.create!(row.merge(occurred_on: "2026-10-10"))
    get "/api/summary", params: { month: "2026-11" }, headers: auth
    expect(response.parsed_body).to include("income_cents" => 50000, "expense_cents" => 12550, "balance_cents" => 37450)
    expect(response.parsed_body.fetch("daily").sum { |d| d["expense_cents"] }).to eq(12550)
    patch "/api/entries/#{expense.id}/void", headers: auth
    expect(response.status).to eq(200)
    get "/api/summary", params: { month: "2026-11" }, headers: auth
    expect(response.parsed_body.fetch("expense_cents")).to eq(0)
  end
  it "imports exact decimals and skips identical references on repeat" do
    import(csv)
    expect(response.parsed_body).to eq("created" => 1, "skipped" => 0)
    expect(account.entries.last.amount_cents).to eq(12550)
    import(csv)
    expect(response.parsed_body).to eq("created" => 0, "skipped" => 1)
    expect(account.entries.count).to eq(1)
  end
  it "rolls back the entire file when a later row fails" do
    import(csv + "invoice-2,2026-11-11,Wrong,expense,12.345,Software\n")
    expect(response.status).to eq(422)
    expect(response.parsed_body.fetch("errors").join).to include("Row 3")
    expect(account.entries.count).to eq(0)
  end
  it "rejects changed data for an existing reference without overwriting it" do
    import(csv)
    import(csv.sub("125.50", "135.50"))
    expect(response.status).to eq(422)
    expect(account.entries.last.amount_cents).to eq(12550)
  end
  it "does not restore voided records on repeated imports" do
    import(csv)
    record = account.entries.last
    patch "/api/entries/#{record.id}/void", headers: auth
    import(csv)
    expect(response.parsed_body).to eq("created" => 0, "skipped" => 1)
    expect(record.reload.voided_at).not_to be_nil
  end
  it "rejects missing IDs, bad dates, malformed and oversized files" do
    [csv.sub("invoice-1", ""), csv.sub("2026-11-10", "2026-02-31"), "broken\n", '"unterminated', "x" * 200001].each do |content|
      import(content)
      expect(response.status).to eq(422)
      expect(account.entries.count).to eq(0)
    end
  end
  it "isolates reports, lists, writes and category IDs by workspace" do
    other = Account.create!(name: "Private")
    foreign = other.categories.create!(name: "Secret", color: "#000000")
    record = other.entries.create!(row.merge(category: foreign))
    get "/api/summary", params: { month: "2026-11" }, headers: auth
    expect(response.parsed_body.fetch("expense_cents")).to eq(0)
    get "/api/categories", headers: auth
    expect(response.parsed_body.map { |c| c["name"] }).to eq(["Software"])
    post "/api/entries", params: { entry: row.except(:category).merge(category_id: foreign.id) }, headers: auth
    expect(response.status).to eq(404)
    patch "/api/entries/#{record.id}/void", headers: auth
    expect(response.status).to eq(404)
    get "/api/entries", params: { month: "2026-11", category_id: foreign.id }, headers: auth
    expect(response.status).to eq(404)
  end
  it "enforces viewer permissions on every write path" do
    owner.update!(role: "viewer")
    ["/api/categories", "/api/entries", "/api/budgets", "/api/imports"].each do |path|
      post path, params: { csv: csv }, headers: auth
      expect(response.status).to eq(403)
    end
    record = account.entries.create!(row)
    patch "/api/entries/#{record.id}/void", headers: auth
    expect(response.status).to eq(403)
    get "/api/summary", headers: auth
    expect(response.status).to eq(200)
  end
  it "upserts budgets and measures expense-only usage" do
    account.entries.create!(row)
    account.entries.create!(row.merge(kind: "income"))
    2.times do
      post "/api/budgets", params: { budget: { category_id: category.id, month: "2026-11", limit_cents: 20000 } }, headers: auth
      expect(response.status).to eq(200)
    end
    expect(account.budgets.count).to eq(1)
    get "/api/budgets", params: { month: "2026-11" }, headers: auth
    expect(response.parsed_body.first).to include("limit_cents" => 20000, "spent_cents" => 12550)
  end
  it "paginates and filters, and rejects invalid periods and pages" do
    21.times { |i| account.entries.create!(row.merge(description: "Expense #{i}")) }
    get "/api/entries", params: { month: "2026-11", page: 2 }, headers: auth
    expect(response.parsed_body.fetch("entries").size).to eq(1)
    expect(response.parsed_body.fetch("total")).to eq(21)
    get "/api/entries", params: { month: "2026-11", q: "Expense 20" }, headers: auth
    expect(response.parsed_body.fetch("entries").size).to eq(1)
    get "/api/summary", params: { month: "2026-99" }, headers: auth
    expect(response.status).to eq(422)
    get "/api/entries", params: { month: "2026-11", page: "bad" }, headers: auth
    expect(response.status).to eq(422)
  end
  it "exports the selected month and neutralizes spreadsheet formulas" do
    account.entries.create!(row.merge(description: "=HYPERLINK(\"unsafe\")"))
    account.entries.create!(row.merge(occurred_on: "2026-10-10"))
    get "/api/export", params: { month: "2026-11" }, headers: auth
    expect(response.status).to eq(200)
    table = CSV.parse(response.body, headers: true)
    expect(table.size).to eq(1)
    expect(table.first["description"]).to start_with("'=")
    expect(table.first["amount"]).to eq("125.50")
  end
  it "enforces uniqueness and positive amounts in PostgreSQL" do
    first = account.entries.create!(row.merge(external_id: "invoice-1"))
    attrs = first.attributes.except("id", "created_at", "updated_at")
    expect { Entry.transaction(requires_new: true) { Entry.insert_all!([attrs]) } }.to raise_error(ActiveRecord::RecordNotUnique)
    expect { Entry.transaction(requires_new: true) { Entry.insert_all!([attrs.merge("external_id" => "bad", "amount_cents" => 0)]) } }.to raise_error(ActiveRecord::StatementInvalid)
  end
end
