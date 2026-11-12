# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_11_11_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "accounts", force: :cascade do |t|
    t.string "name", null: false
    t.string "time_zone", default: "America/Sao_Paulo", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "budgets", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "category_id", null: false
    t.date "month", null: false
    t.bigint "limit_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "category_id", "month"], name: "index_budgets_on_account_id_and_category_id_and_month", unique: true
    t.index ["account_id"], name: "index_budgets_on_account_id"
    t.index ["category_id"], name: "index_budgets_on_category_id"
    t.check_constraint "EXTRACT(day FROM month) = 1::numeric AND limit_cents > 0 AND limit_cents <= 1000000000", name: "valid_budget"
  end

  create_table "categories", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.string "color", default: "#8b7ee3", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "name"], name: "index_categories_on_account_id_and_name", unique: true
    t.index ["account_id"], name: "index_categories_on_account_id"
  end

  create_table "entries", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "category_id", null: false
    t.string "external_id", null: false
    t.string "description", null: false
    t.string "kind", null: false
    t.bigint "amount_cents", null: false
    t.date "occurred_on", null: false
    t.datetime "voided_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "external_id"], name: "index_entries_on_account_id_and_external_id", unique: true
    t.index ["account_id", "occurred_on", "id"], name: "index_entries_on_account_id_and_occurred_on_and_id"
    t.index ["account_id"], name: "index_entries_on_account_id"
    t.index ["category_id"], name: "index_entries_on_category_id"
    t.check_constraint "amount_cents > 0 AND amount_cents <= 1000000000", name: "valid_entry_amount"
    t.check_constraint "kind::text = ANY (ARRAY['income'::character varying, 'expense'::character varying]::text[])", name: "valid_entry_kind"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "viewer", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_users_on_account_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.check_constraint "role::text = ANY (ARRAY['owner'::character varying, 'viewer'::character varying]::text[])", name: "valid_user_role"
  end

  add_foreign_key "budgets", "accounts"
  add_foreign_key "budgets", "categories"
  add_foreign_key "categories", "accounts"
  add_foreign_key "entries", "accounts"
  add_foreign_key "entries", "categories"
  add_foreign_key "sessions", "users"
  add_foreign_key "users", "accounts"
end
