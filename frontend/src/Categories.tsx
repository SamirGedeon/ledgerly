import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tags } from "lucide-react";
import { api } from "./api";
import type { Category, User } from "./types";
import { Empty, Loading, ErrorBox, Modal } from "./ui";
export default function Categories({ user }: { user: User }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b7ee3");
  const data = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("categories"),
  });
  const mutation = useMutation({
    mutationFn: () =>
      api("categories", {
        method: "POST",
        body: JSON.stringify({ category: { name, color } }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
      setName("");
    },
  });
  return (
    <div className="page">
      <div className="heading">
        <div>
          <span className="eyebrow">CADA COISA NO SEU LUGAR</span>
          <h1>Organização que faz sentido.</h1>
          <p>Suas categorias conectam transações, relatórios e orçamentos.</p>
        </div>
        {user.role === "owner" && (
          <button
            className="button"
            onClick={() => {
              mutation.reset();
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Nova categoria
          </button>
        )}
      </div>
      <ErrorBox error={data.error} />
      {data.isPending ? (
        <Loading />
      ) : data.isError ? (
        <button
          className="button secondary"
          onClick={() => void data.refetch()}
        >
          Tentar novamente
        </button>
      ) : data.data?.length ? (
        <div className="category-grid">
          {data.data.map((c) => (
            <article className="category-card" key={c.id}>
              <span style={{ background: c.color + "20", color: c.color }}>
                <Tags size={25} />
              </span>
              <small>CATEGORIA</small>
              <h2>{c.name}</h2>
              <p>Organize os movimentos do seu negócio.</p>
            </article>
          ))}
        </div>
      ) : (
        <Empty text="Crie sua primeira categoria para começar." />
      )}
      {user.role === "viewer" && (
        <p className="hint">
          Seu acesso permite consultar os dados. Alterações são feitas pelo
          administrador.
        </p>
      )}
      {open && (
        <Modal title="Nova categoria" close={() => setOpen(false)}>
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <label>
              Nome
              <input
                autoFocus
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Cor
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <ErrorBox error={mutation.error} />
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setOpen(false)}
              >
                Voltar
              </button>
              <button className="button" disabled={mutation.isPending}>
                Salvar categoria
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
