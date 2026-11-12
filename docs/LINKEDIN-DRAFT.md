# Rascunho — publicação pendente de autorização

Apresento o Ledgerly, um projeto Full Stack de controle financeiro para pequenos negócios.

A proposta é reunir receitas, despesas e orçamentos em um único espaço, com uma importação CSV que não duplica transações quando o mesmo arquivo é enviado novamente.

O projeto usa Ruby on Rails, PostgreSQL, React e TypeScript. Inclui relatórios mensais, filtros, paginação, limites por categoria e exportação CSV.

Entre as decisões técnicas estão o armazenamento de valores em centavos, agregações no banco de dados e a execução de cada importação em uma transação: se uma linha falha, nenhuma nova linha do arquivo é salva. Referências externas e índices únicos protegem a deduplicação.

A aplicação tem testes com RSpec e Playwright. Ela é um projeto de portfólio com dados fictícios, sem conexão bancária ou movimentação de dinheiro real.

GitHub: https://github.com/SamirGedeon/ledgerly

#RubyOnRails #React #TypeScript #PostgreSQL #FullStack #Portfolio #DevJunior

Revisar o texto antes de publicar. Nenhum conteúdo foi enviado ao LinkedIn. Descrever aprendizados pessoais somente após estudar e modificar o código.
