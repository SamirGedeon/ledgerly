# Research and project selection

Research started on 11 November 2026 and sources were checked again on 12 November 2026. This is a small qualitative sample, not a census of the hiring market.

## Why a financial workspace

Slotwise demonstrates scheduling constraints. Ledgerly adds different evidence: SQL aggregation, precision in financial values, pagination, file validation, idempotency and transaction rollback. A dashboard alone would not provide those domain guarantees; the CSV workflow and its tests are central to this project.

| Candidate | Professional relevance | Relative MVP complexity | Decision |
| --- | --- | --- | --- |
| Financial workspace | SQL reports, imports, money precision and API integration | Medium | Build now |
| Banking integration platform | Integration/error handling | High, requires external credentials/providers | Defer |
| Investment portfolio | Valuation and currency/data APIs | High, adds market-data dependencies | Defer |

These are scope judgments, not product popularity rankings or hiring guarantees.

## Job requirements checked

- [Shopra — Junior Full Stack Developer](https://jobs.polymer.co/shopra/38374): Rails API, React/TypeScript, PostgreSQL, RSpec and Docker; Canada preferred, with 1–3 years requested. Accessible with application link when checked; eligibility and hiring status require independent confirmation.
- [Sylision — Rails Júnior](https://www.sylision.com/vagas/desenvolvedor-rails-junior-401): relational data integrity, SQL, Active Record, Git and tests; posted 26 September 2026, displayed as open, confidential contracting company. Ledgerly addresses those skills with constraints and tests proving invalid/duplicate data is rejected.
- [Ferreri — Fullstack](https://github.com/backend-br/vagas/issues/12220): previously inspected Rails/React/PostgreSQL/Docker/test requirements; issue was closed. Historical reference only.

No application was submitted and no employment outcome is implied. Aggregator search results were used for discovery; primary job pages provide the requirements above.

## Product and community references

| Platform | Observation on 12 November 2026 | Use/limitation |
| --- | --- | --- |
| GitHub | [actualbudget/actual](https://github.com/actualbudget/actual): 30,197 stars, 3,291 forks | Product reference for budgets/imports; stars measure attention, not code quality. |
| GitHub | [ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio): 9,699 stars, 1,418 forks | Contrasts investment/wealth scope with the smaller cash-flow scope chosen here. |
| Actual documentation | [Transaction imports](https://actualbudget.org/docs/transactions/importing/) describes financial-file imports and duplicate detection | Supports treating repeated imports as a real product concern. Ledgerly uses a simpler explicit external-ID contract. |
| GitLab | [Budget project search](https://gitlab.com/api/v4/projects?search=budget&simple=true&per_page=2) accessible | Examples exist; no repository quality audit or code reuse claimed. |
| Hacker News | [Budget tracker discussions](https://hn.algolia.com/api/v1/search?query=budget%20tracker&tags=story&hitsPerPage=2) accessible | Relevance search can return old stories; not a current trend measurement. |
| Dev.to | [Rails articles](https://dev.to/api/articles?tag=rails&per_page=2) accessible | Community engineering context, not hiring-demand evidence. |
| Stack Overflow | [Rails tag API](https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=ruby-on-rails&site=stackoverflow) accessible | Historical question volume is not professional demand. |
| Product Hunt | Attempted Actual Budget product URL returned 404 | No popularity/ranking claim made. |
| Reddit | Direct selfhosted budget search returned 403; web indexing found budget-tracker discussions | Anecdotal, incomplete evidence; no market conclusions inferred. |

Ledgerly is a separate implementation with its own domain, not a copy of Actual or Ghostfolio. Those projects use different stacks and substantially different scope. Popularity did not determine the feature list; finishable business rules and sampled job requirements did.
