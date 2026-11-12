abort "Demo seed is disabled in production" if Rails.env.production?
a = Account.find_or_create_by!(name: "Aurora Studio")
[["owner", "Samir Gedeon"], ["viewer", "Leitor Demo"]].each do |role, name|
  User.find_or_create_by!(email: "#{role}@ledgerly.test") { |u| u.assign_attributes(account: a, name: name, role: role, password: ENV.fetch("DEMO_PASSWORD", "Ledgerly-demo-2026!")) }
end
colors = { "Projetos" => "#6f63d9", "Software" => "#9b88e6", "Marketing" => "#e9b16d", "Operação" => "#70ada1", "Equipe" => "#db849b" }
colors.each { |name, color| a.categories.find_or_create_by!(name: name) { |c| c.color = color } }
month = Time.current.in_time_zone("America/Sao_Paulo").to_date.beginning_of_month
[[2,"Projeto identidade visual","income",850000,"Projetos"],[3,"Assinatura Figma","expense",9500,"Software"],[5,"Campanha de lançamento","expense",85000,"Marketing"],[6,"Projeto website","income",620000,"Projetos"],[8,"Coworking","expense",120000,"Operação"],[10,"Designer freelancer","expense",180000,"Equipe"],[11,"Hospedagem e domínio","expense",12000,"Software"],[14,"Consultoria de marca","income",350000,"Projetos"],[18,"Anúncios de novembro","expense",45000,"Marketing"],[21,"Ilustração editorial","income",240000,"Projetos"]].each_with_index do |(day, desc, kind, cents, cat), i|
  a.entries.find_or_create_by!(external_id: "seed:#{month}:#{i}") { |e| e.assign_attributes(category: a.categories.find_by!(name: cat), occurred_on: month.change(day: day), description: desc, kind: kind, amount_cents: cents) }
end
{"Software"=>40000,"Marketing"=>150000,"Operação"=>160000,"Equipe"=>200000}.each do |cat, cents|
  a.budgets.find_or_create_by!(category: a.categories.find_by!(name: cat), month: month) { |b| b.limit_cents = cents }
end
