import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Tags,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { api, saveToken, token } from "./api";
import type { User } from "./types";
import { Logo, ErrorBox, Loading } from "./ui";
import Finance from "./Finance";
import Categories from "./Categories";
export default function App() {
  const client = useQueryClient();
  const [session, setSession] = useState(token);
  const user = useQuery({
    queryKey: ["session", session],
    queryFn: () => api<{ user: User }>("session"),
    enabled: !!session,
    retry: false,
  });
  const clear = () => {
    saveToken(null);
    setSession(null);
    client.clear();
  };
  useEffect(() => {
    const expired = () => {
      saveToken(null);
      setSession(null);
      client.clear();
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [client]);
  const logout = useMutation({
    mutationFn: () => api("session", { method: "DELETE" }),
    onSuccess: clear,
  });
  if (!session)
    return (
      <Login
        done={(value) => {
          saveToken(value);
          setSession(value);
        }}
      />
    );
  if (user.isPending) return <Loading />;
  if (!user.data)
    return (
      <main className="fallback">
        <ErrorBox error={user.error} />
        <button className="button" onClick={() => void user.refetch()}>
          Tentar novamente
        </button>
        <button className="button secondary" onClick={clear}>
          Voltar ao login
        </button>
      </main>
    );
  const me = user.data.user;
  return (
    <div className="layout">
      <aside className="sidebar">
        <Logo />
        <div className="workspace">
          <span className="workspace-icon">AS</span>
          <div>
            <strong>{me.account_name}</strong>
            <small>Finanças do negócio</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-caption">SEU ESPAÇO</span>
        <nav aria-label="Navegação principal">
          <NavLink to="/overview">
            <LayoutDashboard size={18} />
            Visão geral
          </NavLink>
          <NavLink to="/transactions">
            <ArrowLeftRight size={18} />
            Transações
          </NavLink>
          <NavLink to="/budgets">
            <ChartNoAxesCombined size={18} />
            Orçamentos
          </NavLink>
          <NavLink to="/categories">
            <Tags size={18} />
            Categorias
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Lightbulb size={22} />
            <h3>
              Pequenos hábitos.
              <br />
              Grandes resultados.
            </h3>
            <p>Acompanhar suas finanças é o primeiro passo para crescer.</p>
            <span>
              Um movimento de cada vez
              <ArrowUpRight size={13} />
            </span>
          </div>
          <div className="profile">
            <span className="avatar">
              {me.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{me.name}</strong>
              <small>
                {me.role === "owner" ? "Administrador" : "Somente leitura"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Sair"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut size={17} />
            </button>
          </div>
          <ErrorBox error={logout.error} />
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace<span className="slash">/</span>
            <strong>{me.account_name}</strong>
          </span>
          <span className="private-label">
            <ShieldCheck size={14} />
            Seu controle financeiro, em um só lugar
          </span>
        </header>
        <Routes>
          <Route
            path="/overview"
            element={<Finance user={me} view="overview" />}
          />
          <Route
            path="/transactions"
            element={<Finance user={me} view="transactions" />}
          />
          <Route
            path="/budgets"
            element={<Finance user={me} view="budgets" />}
          />
          <Route path="/categories" element={<Categories user={me} />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
        <footer>
          <span>Mais clareza. Melhores decisões.</span>
          <span>Ledgerly · Feito para o seu próximo passo</span>
        </footer>
      </main>
    </div>
  );
}
function Login({ done }: { done: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () =>
      api<{ token: string }>("session", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (r) => done(r.token),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    login.mutate();
  }
  return (
    <div className="login">
      <section className="login-story">
        <Logo />
        <div>
          <span className="eyebrow">BONS NEGÓCIOS COMEÇAM COM CLAREZA</span>
          <h1>
            Um novo olhar
            <br />
            para cada
            <br />
            <em>movimento.</em>
          </h1>
          <p>
            Menos planilhas espalhadas. Mais espaço para entender suas finanças
            e planejar o que vem depois.
          </p>
          <div className="login-metrics">
            <span>
              Organize.
              <br />
              <strong>Acompanhe.</strong>
            </span>
            <span>
              Planeje.
              <br />
              <strong>Cresça.</strong>
            </span>
          </div>
        </div>
        <small>Seu negócio em perspectiva.</small>
      </section>
      <main>
        <form onSubmit={submit}>
          <span className="eyebrow">BEM-VINDO AO LEDGERLY</span>
          <h2>
            Vamos colocar tudo
            <br />
            em perspectiva?
          </h2>
          <p>Entre no seu espaço financeiro.</p>
          <label>
            E-mail
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </label>
          <label>
            Senha
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </label>
          <ErrorBox error={login.error} />
          <button className="button" disabled={login.isPending}>
            {login.isPending ? "Entrando…" : "Entrar no meu espaço"}
            <ArrowRight size={17} />
          </button>
          {import.meta.env.DEV && (
            <div className="demo-box">
              <strong>Conheça a demonstração</strong>
              <p>Um negócio fictício, com dados para explorar.</p>
              <button
                type="button"
                onClick={() => {
                  setEmail("owner@ledgerly.test");
                  setPassword("Ledgerly-demo-2026!");
                }}
              >
                Preencher acesso de demonstração
                <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <small className="login-foot">
            <ShieldCheck size={13} />
            Sessão segura · 12 horas
          </small>
        </form>
      </main>
    </div>
  );
}
