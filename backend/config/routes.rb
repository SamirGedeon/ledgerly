Rails.application.routes.draw do
  get "/up", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']] }
  namespace :api do
    post "session", to: "sessions#create"
    get "session", to: "sessions#show"
    delete "session", to: "sessions#destroy"
    resources :categories, only: %i[index create]
    resources :entries, only: %i[index create] do
      patch :void, on: :member
    end
    resources :budgets, only: %i[index create]
    get "summary", to: "reports#summary"
    get "export", to: "reports#export"
    post "imports", to: "imports#create"
  end
end
