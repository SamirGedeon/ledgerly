# Verification record

Managed development environment, 12 November 2026.

| Check | Observed result |
| --- | --- |
| PostgreSQL schema/migrations and demo seed | Executed successfully |
| RSpec request/database suite | **13 examples, 0 failures** |
| Rails eager loading (`zeitwerk:check`) | Passed |
| Frontend formatting | Passed |
| TypeScript + Vite production build | Passed |
| Playwright Chromium integration suite | **3 tests passed** |
| Desktop/mobile screenshots | Captured from the running application |
| Mobile overflow at 390px | None observed |
| Browser page errors during screenshot flow | None observed |
| Compose configuration parsing | Passed |

The API/PostgreSQL ran in containers; Vite ran on the host. The full delivered Dockerfile/Compose build was not executed end-to-end because this executor has limited disk space. A parsed Compose configuration is not a verified production build.

Backend coverage: session lifecycle, exact monthly totals, void exclusion, repeated import deduplication, whole-file rollback, changed-reference rejection, void preservation on reimport, invalid/missing/oversized CSV input, workspace isolation, every viewer write restriction, budget upsert/expense-only usage, pagination/search/date validation, export formula neutralization and database uniqueness/amount constraints.

Browser coverage: category/budget creation, expense entry, over-budget state, voiding and updated budget usage; import/reimport/error rollback, filtered export download; viewer permissions, mobile width and logout.

Ruby 3.3 emitted a notice that csv leaves the default standard gems in Ruby 3.4. The declared Ruby version is 3.3; there were no failing assertions from that notice.

Not performed: production deployment, real bank/payment integrations, load tests, penetration testing or physical-device testing. Remote CI status must be checked in the repository Actions tab; local passing tests alone do not establish a passing GitHub-hosted run.
