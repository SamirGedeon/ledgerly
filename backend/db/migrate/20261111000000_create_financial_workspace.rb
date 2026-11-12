class CreateFinancialWorkspace < ActiveRecord::Migration[7.2]
  def change
    create_table :accounts do |t|
      t.string :name, null: false
      t.string :time_zone, null: false, default: "America/Sao_Paulo"
      t.timestamps
    end
    create_table :users do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "viewer"
      t.timestamps
    end
    add_index :users, :email, unique: true
    add_check_constraint :users, "role IN ('owner','viewer')", name: "valid_user_role"
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :sessions, :token_digest, unique: true
    create_table :categories do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.string :color, null: false, default: "#8b7ee3"
      t.timestamps
    end
    add_index :categories, [:account_id, :name], unique: true
    create_table :entries do |t|
      t.references :account, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.string :external_id, null: false
      t.string :description, null: false
      t.string :kind, null: false
      t.bigint :amount_cents, null: false
      t.date :occurred_on, null: false
      t.datetime :voided_at
      t.timestamps
    end
    add_index :entries, [:account_id, :external_id], unique: true
    add_index :entries, [:account_id, :occurred_on, :id]
    add_check_constraint :entries, "kind IN ('income','expense')", name: "valid_entry_kind"
    add_check_constraint :entries, "amount_cents > 0 AND amount_cents <= 1000000000", name: "valid_entry_amount"
    create_table :budgets do |t|
      t.references :account, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.date :month, null: false
      t.bigint :limit_cents, null: false
      t.timestamps
    end
    add_index :budgets, [:account_id, :category_id, :month], unique: true
    add_check_constraint :budgets, "EXTRACT(DAY FROM month) = 1 AND limit_cents > 0 AND limit_cents <= 1000000000", name: "valid_budget"
  end
end
