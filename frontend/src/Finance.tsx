import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Upload,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { api, money, download, cents } from "./api";
import type { User, Entry, Category, Budget, Report } from "./types";
import { Modal, Loading, Empty, ErrorBox } from "./ui";
export default function Finance({
  user,
  view,
}: {
  user: User;
  view: "overview" | "transactions" | "budgets";
}) {
  const client = useQueryClient();
  const [month, setMonth] = useState(
    DateTime.now().setZone(user.time_zone).toFormat("yyyy-MM"),
  );
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<"entry" | "import" | "budget" | null>(null);
  const [voiding, setVoiding] = useState<Entry | null>(null);
  const report = useQuery({
    queryKey: ["summary", month],
    queryFn: () => api<Report>(`summary?month=${month}`),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("categories"),
  });
  const budget = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => api<Budget[]>(`budgets?month=${month}`),
  });
  const filters = new URLSearchParams({
    month,
    q: search,
    ...(kind ? { kind } : {}),
    ...(category ? { category_id: category } : {}),
  });
  const entries = useQuery({
    queryKey: ["entries", month, search, kind, category, page],
    queryFn: () =>
      api<{ entries: Entry[]; total: number; page: number; per_page: number }>(
        `entries?${filters}&page=${page}`,
      ),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["summary"] });
    void client.invalidateQueries({ queryKey: ["entries"] });
    void client.invalidateQueries({ queryKey: ["budgets"] });
  };
  const cancel = useMutation({
    mutationFn: (id: number) => api(`entries/${id}/void`, { method: "PATCH" }),
    onSuccess: () => {
      refresh();
      setVoiding(null);
    },
  });
  const exporter = useMutation({
    mutationFn: () => download(`export?${filters}`, `ledgerly-${month}.csv`),
  });
  const owner = user.role === "owner";
  const title =
    view === "overview"
      ? "Seu negócio, em perspectiva."
      : view === "transactions"
        ? "Cada movimento importa."
        : "Planos que viram progresso.";
  return (
    <div className="page">
      <div className="heading">
        <div>
          <span className="eyebrow">
            {view === "overview"
              ? "CLAREZA PARA O SEU PRÓXIMO PASSO"
              : view === "transactions"
                ? "HISTÓRICO FINANCEIRO"
                : "GASTE COM INTENÇÃO"}
          </span>
          <h1>{title}</h1>
          <p>
            {view === "overview"
              ? "Uma visão simples do que entra, do que sai e do que fica."
              : view === "transactions"
                ? "Organize suas receitas e despesas, sem perder nenhum detalhe."
                : "Defina limites por categoria e acompanhe seu mês."}
          </p>
        </div>
        <div className="heading-actions">
          <label className="month-input">
            <input
              aria-label="Mês de referência"
              type="month"
              min="2000-01"
              max="2100-12"
              value={month}
              onChange={(e) => {
                if (e.target.value) {
                  setMonth(e.target.value);
                  setPage(1);
                }
              }}
            />
          </label>
          {owner && (
            <button
              className="button"
              onClick={() => setForm(view === "budgets" ? "budget" : "entry")}
            >
              <Plus size={16} />
              {view === "budgets" ? "Definir orçamento" : "Nova transação"}
            </button>
          )}
        </div>
      </div>
      <ErrorBox
        error={
          report.error ||
          entries.error ||
          categories.error ||
          budget.error ||
          exporter.error
        }
      />
      {report.isPending ? (
        <Loading />
      ) : report.isError ? (
        <button
          className="button secondary"
          onClick={() => void report.refetch()}
        >
          Tentar novamente
        </button>
      ) : (
        report.data && (
          <>
            {view !== "budgets" && (
              <section className="stats" aria-label="Resumo financeiro">
                <Stat
                  title="Saldo do período"
                  value={money(report.data.balance_cents)}
                  icon={<Wallet size={19} />}
                  primary
                  detail="Receitas menos despesas"
                />
                <Stat
                  title="Receitas"
                  value={money(report.data.income_cents)}
                  icon={<TrendingUp size={19} />}
                  detail="Entradas no mês selecionado"
                />
                <Stat
                  title="Despesas"
                  value={money(report.data.expense_cents)}
                  icon={<TrendingDown size={19} />}
                  detail="Saídas no mês selecionado"
                />
                <Stat
                  title="Margem do período"
                  value={
                    report.data.income_cents
                      ? `${Math.round((report.data.balance_cents / report.data.income_cents) * 100)}%`
                      : "—"
                  }
                  icon={<ArrowUpRight size={19} />}
                  detail={
                    report.data.income_cents
                      ? "Saldo como proporção das receitas"
                      : "Registre receitas para calcular"
                  }
                />
              </section>
            )}
            {view === "overview" && (
              <section className="charts">
                <div className="card cashflow">
                  <div className="card-title">
                    <div>
                      <h2>Fluxo do mês</h2>
                      <p>Entradas e saídas, dia após dia.</p>
                    </div>
                    <div className="legend">
                      <span>
                        <i className="income-dot" />
                        Receitas
                      </span>
                      <span>
                        <i className="expense-dot" />
                        Despesas
                      </span>
                    </div>
                  </div>
                  <CashChart report={report.data} />
                </div>
                <div className="card breakdown">
                  <div className="card-title">
                    <div>
                      <h2>Para onde foi?</h2>
                      <p>Despesas por categoria</p>
                    </div>
                    <span className="soft-icon">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                  <Breakdown report={report.data} />
                </div>
              </section>
            )}
            {view === "budgets" ? (
              <div className="budget-page">
                <div className="budget-guide">
                  <span className="soft-icon">
                    <CheckCircle2 size={24} />
                  </span>
                  <h2>Seu mês começa com um plano.</h2>
                  <p>
                    Os limites são acompanhados usando apenas despesas ativas.
                    Receitas e lançamentos anulados ficam fora do cálculo.
                  </p>
                </div>
                <div className="budget-grid">
                  {budget.isPending ? (
                    <Loading />
                  ) : budget.data?.length ? (
                    budget.data.map((b) => (
                      <BudgetCard
                        key={b.id}
                        budget={b}
                        edit={owner ? () => setForm("budget") : undefined}
                      />
                    ))
                  ) : (
                    <Empty text="Defina um orçamento para acompanhar suas metas do mês." />
                  )}
                </div>
              </div>
            ) : (
              <section className="lower-grid">
                <div className="card transactions">
                  <div className="card-title">
                    <div>
                      <h2>
                        {view === "overview"
                          ? "Últimos movimentos"
                          : "Suas transações"}
                        <span className="count">
                          {entries.data?.total || 0}
                        </span>
                      </h2>
                      <p>Seu histórico, com tudo no lugar.</p>
                    </div>
                    <div className="table-actions">
                      {owner && (
                        <button
                          className="text-button"
                          onClick={() => setForm("import")}
                        >
                          <Upload size={14} />
                          Importar
                        </button>
                      )}
                      <button
                        className="text-button"
                        onClick={() => exporter.mutate()}
                        disabled={exporter.isPending}
                      >
                        <Download size={14} />
                        Exportar
                      </button>
                    </div>
                  </div>
                  <div className="filters">
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Buscar transações"
                        placeholder="Buscar uma transação…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                      />
                    </label>
                    <select
                      aria-label="Filtrar tipo"
                      value={kind}
                      onChange={(e) => {
                        setKind(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Todos os tipos</option>
                      <option value="income">Receitas</option>
                      <option value="expense">Despesas</option>
                    </select>
                    <select
                      aria-label="Filtrar categoria"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Todas as categorias</option>
                      {categories.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {entries.isPending ? (
                    <Loading />
                  ) : entries.isError ? (
                    <button
                      className="button secondary"
                      onClick={() => void entries.refetch()}
                    >
                      Tentar novamente
                    </button>
                  ) : entries.data?.entries.length ? (
                    <div className="entry-table">
                      <div className="table-head">
                        <span>DESCRIÇÃO</span>
                        <span>CATEGORIA</span>
                        <span>DATA</span>
                        <span>VALOR</span>
                        <span />
                      </div>
                      {entries.data.entries.map((e) => (
                        <article
                          className={`entry-row ${e.voided_at ? "voided" : ""}`}
                          key={e.id}
                        >
                          <div className="description">
                            <span className={`entry-icon ${e.kind}`}>
                              {e.kind === "income" ? (
                                <ArrowDownLeft size={16} />
                              ) : (
                                <ArrowUpRight size={16} />
                              )}
                            </span>
                            <div>
                              <strong>{e.description}</strong>
                              <small>
                                {e.voided_at
                                  ? "Anulado"
                                  : e.kind === "income"
                                    ? "Receita"
                                    : "Despesa"}
                              </small>
                            </div>
                          </div>
                          <span className="category-tag">
                            <i style={{ background: e.category_color }} />
                            {e.category_name}
                          </span>
                          <span className="entry-date">
                            {DateTime.fromISO(e.occurred_on).toFormat(
                              "dd MMM",
                              { locale: "pt-BR" },
                            )}
                          </span>
                          <strong className={`amount ${e.kind}`}>
                            {e.kind === "income" ? "+" : "−"}{" "}
                            {money(e.amount_cents)}
                          </strong>
                          <div>
                            {owner && !e.voided_at && (
                              <button
                                className="icon-button void-button"
                                aria-label={`Anular ${e.description}`}
                                onClick={() => {
                                  cancel.reset();
                                  setVoiding(e);
                                }}
                              >
                                <Ban size={14} />
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Empty text="Ajuste os filtros ou registre uma nova transação." />
                  )}
                  <div className="pagination">
                    <span>
                      {entries.data?.total || 0} transações · página {page}
                    </span>
                    <div>
                      <button
                        className="icon-button"
                        aria-label="Página anterior"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Próxima página"
                        disabled={page * 20 >= (entries.data?.total || 0)}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                {view === "overview" && (
                  <aside className="budget-sidebar">
                    <div className="card-title">
                      <h2>De olho nos limites</h2>
                      <span className="soft-icon">
                        <ChartIcon />
                      </span>
                    </div>
                    <p className="budget-subtitle">
                      Seus orçamentos para este mês.
                    </p>
                    {budget.data?.length ? (
                      budget.data
                        .slice(0, 4)
                        .map((b) => <BudgetCard budget={b} key={b.id} />)
                    ) : (
                      <p className="hint">
                        Nenhum limite definido para este mês.
                      </p>
                    )}
                    <div className="budget-foot">
                      <span>Planejar é cuidar do futuro.</span>
                      <ArrowRight size={15} />
                    </div>
                  </aside>
                )}
              </section>
            )}
          </>
        )
      )}
      {form === "entry" && (
        <EntryForm
          categories={categories.data || []}
          month={month}
          saved={() => {
            refresh();
            setForm(null);
          }}
          close={() => setForm(null)}
        />
      )}
      {form === "import" && (
        <ImportForm close={() => setForm(null)} saved={refresh} />
      )}
      {form === "budget" && (
        <BudgetForm
          month={month}
          categories={categories.data || []}
          close={() => setForm(null)}
          saved={() => {
            refresh();
            setForm(null);
          }}
        />
      )}
      {voiding && (
        <Modal title="Anular esta transação?" close={() => setVoiding(null)}>
          <p className="hint">
            {voiding.description} deixará de compor os totais. O registro será
            preservado no histórico.
          </p>
          <ErrorBox error={cancel.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setVoiding(null)}
            >
              Voltar
            </button>
            <button
              className="button danger"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(voiding.id)}
            >
              Confirmar anulação
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Stat({
  title,
  value,
  detail,
  icon,
  primary = false,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <article className={`stat ${primary ? "primary" : ""}`}>
      <div>
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
function ChartIcon() {
  return <TrendingUp size={17} />;
}
function CashChart({ report }: { report: Report }) {
  const max = Math.max(
    ...report.daily.map((d) => Math.max(d.income_cents, d.expense_cents)),
    1,
  );
  return (
    <div className="chart-wrap">
      <div className="chart-y">
        <span>{money(max)}</span>
        <span>{money(Math.round(max / 2))}</span>
        <span>R$ 0</span>
      </div>
      <div className="chart-plot">
        <div className="chart-grid" />
        <div
          className="bars"
          role="img"
          aria-label="Gráfico diário de receitas e despesas; os totais e valores detalhados estão nos cartões e nas transações."
        >
          {report.daily.map((d, i) => (
            <div
              className="bar-pair"
              key={d.date}
              title={`${d.date}: receitas ${money(d.income_cents)}, despesas ${money(d.expense_cents)}`}
            >
              <div
                className="bar-income"
                style={{ height: `${(d.income_cents / max) * 100}%` }}
              />
              <div
                className="bar-expense"
                style={{ height: `${(d.expense_cents / max) * 100}%` }}
              />
              {i % 5 === 0 && <span>{i + 1}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Breakdown({ report }: { report: Report }) {
  const total = report.expense_cents;
  let cursor = 0;
  const stops = report.by_category
    .map((c) => {
      const start = cursor;
      cursor += (c.amount_cents / (total || 1)) * 100;
      return `${c.color} ${start}% ${cursor}%`;
    })
    .join(",");
  return (
    <>
      <div
        className="donut"
        style={{ background: total ? `conic-gradient(${stops})` : "#eeeaf7" }}
        role="img"
        aria-label={`Despesas totais ${money(total)}`}
      >
        <div>
          <small>Total de despesas</small>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <div className="category-legend">
        {report.by_category.length ? (
          report.by_category.map((c) => (
            <div key={c.name}>
              <span>
                <i style={{ background: c.color }} />
                {c.name}
              </span>
              <strong>
                {Math.round((c.amount_cents / (total || 1)) * 100)}%
              </strong>
            </div>
          ))
        ) : (
          <p className="hint">Sem despesas no período.</p>
        )}
      </div>
    </>
  );
}
function BudgetCard({
  budget: b,
  edit,
}: {
  budget: Budget;
  edit?: () => void;
}) {
  const pct = Math.round((b.spent_cents / b.limit_cents) * 100);
  return (
    <article className="budget-card">
      <div>
        <span>
          <i style={{ background: b.category_color }} />
          {b.category_name}
        </span>
        <strong className={pct > 100 ? "over-budget" : ""}>{pct}%</strong>
      </div>
      <div className="progress">
        <span
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: pct > 100 ? "#d98383" : b.category_color,
          }}
        />
      </div>
      <p>
        <strong>{money(b.spent_cents)}</strong>
        <span>de {money(b.limit_cents)}</span>
      </p>
      {pct > 100 && (
        <small className="over-budget">
          Limite excedido em {money(b.spent_cents - b.limit_cents)}
        </small>
      )}
      {edit && (
        <button className="text-button" onClick={edit}>
          Ajustar orçamento
          <ArrowUpRight size={13} />
        </button>
      )}
    </article>
  );
}
function EntryForm({
  categories,
  month,
  close,
  saved,
}: {
  categories: Category[];
  month: string;
  close: () => void;
  saved: () => void;
}) {
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(String(categories[0]?.id || ""));
  const [date, setDate] = useState(`${month}-01`);
  const mutation = useMutation({
    mutationFn: () =>
      api("entries", {
        method: "POST",
        body: JSON.stringify({
          entry: {
            description,
            kind,
            amount_cents: cents(amount),
            category_id: category,
            occurred_on: date,
          },
        }),
      }),
    onSuccess: saved,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }
  return (
    <Modal title="Nova transação" close={close}>
      {!categories.length ? (
        <Empty text="Cadastre uma categoria antes de registrar transações." />
      ) : (
        <form className="stack-form" onSubmit={submit}>
          <label>
            Descrição
            <input
              autoFocus
              required
              maxLength={160}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: assinatura de software"
            />
          </label>
          <div className="form-grid">
            <label>
              Tipo
              <select
                aria-label="Tipo"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>
            <label>
              Valor (R$)
              <input
                required
                type="number"
                min="0.01"
                max="10000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </label>
          </div>
          <label>
            Categoria
            <select
              aria-label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <ErrorBox error={mutation.error} />
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={close}>
              Voltar
            </button>
            <button className="button" disabled={mutation.isPending}>
              Salvar transação
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
function ImportForm({
  close,
  saved,
}: {
  close: () => void;
  saved: () => void;
}) {
  const [content, setContent] = useState("");
  const [fileError, setFileError] = useState<Error | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      api<{ created: number; skipped: number }>("imports", {
        method: "POST",
        body: JSON.stringify({ csv: content }),
      }),
    onSuccess: saved,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }
  return (
    <Modal title="Importar transações" close={close}>
      <form className="stack-form" onSubmit={submit}>
        <p className="hint">
          CSV UTF-8, até 200 KB e 500 linhas. Use uma referência externa única
          por transação. Repetir o mesmo arquivo não duplica registros.
        </p>
        <a className="template-link" href="/example-import.csv" download>
          <Download size={15} />
          Baixar modelo CSV
        </a>
        <label>
          Arquivo CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              mutation.reset();
              const f = e.target.files?.[0];
              setContent("");
              if (!f) return;
              if (f.size > 200000) {
                setFileError(new Error("O arquivo deve ter até 200 KB."));
                return;
              }
              try {
                setFileError(null);
                setContent(await f.text());
              } catch {
                setFileError(new Error("Não foi possível ler o arquivo."));
              }
            }}
          />
        </label>
        <label>
          Conteúdo CSV
          <textarea
            aria-label="Conteúdo CSV"
            required
            rows={7}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              mutation.reset();
            }}
            placeholder="external_id,date,description,kind,amount,category"
          />
        </label>
        <p className="hint">
          Datas: YYYY-MM-DD · Valores com ponto decimal · Tipo: income ou
          expense · A categoria precisa existir. Se uma linha falhar, nenhuma
          será salva.
        </p>
        <ErrorBox error={fileError || mutation.error} />
        {mutation.data && (
          <div className="success" role="status">
            {mutation.data.created} importadas · {mutation.data.skipped} já
            existentes
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            Fechar importação
          </button>
          <button className="button" disabled={!content || mutation.isPending}>
            {mutation.isPending ? "Importando…" : "Importar arquivo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function BudgetForm({
  month,
  categories,
  close,
  saved,
}: {
  month: string;
  categories: Category[];
  close: () => void;
  saved: () => void;
}) {
  const [category, setCategory] = useState(String(categories[0]?.id || ""));
  const [amount, setAmount] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      api("budgets", {
        method: "POST",
        body: JSON.stringify({
          budget: { month, category_id: category, limit_cents: cents(amount) },
        }),
      }),
    onSuccess: saved,
  });
  return (
    <Modal title="Definir orçamento" close={close}>
      {!categories.length ? (
        <Empty text="Cadastre uma categoria primeiro." />
      ) : (
        <form
          className="stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <p className="hint">
            Limite de despesas para{" "}
            {DateTime.fromISO(`${month}-01`)
              .setLocale("pt-BR")
              .toFormat("LLLL yyyy")}
            . Salvar novamente a mesma categoria atualiza o limite existente.
          </p>
          <label>
            Categoria
            <select
              aria-label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Limite (R$)
            <input
              autoFocus
              type="number"
              min="0.01"
              max="10000000"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <ErrorBox error={mutation.error} />
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={close}>
              Voltar
            </button>
            <button className="button" disabled={mutation.isPending}>
              Salvar orçamento
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
