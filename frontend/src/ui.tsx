import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  X,
  AlertCircle,
  WalletCards,
} from "lucide-react";
export function Logo() {
  return (
    <span className="logo">
      <span>
        <WalletCards size={23} />
      </span>
      ledgerly<span className="logo-dot">.</span>
    </span>
  );
}
export function ErrorBox({ error }: { error: Error | null }) {
  return error ? (
    <div className="error" role="alert">
      <AlertCircle size={17} />
      {error.message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      Carregando seus dados…
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <WalletCards size={30} />
      <h3>Nenhum movimento por aqui</h3>
      <p>{text}</p>
    </div>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-head">
        <div>
          <span className="eyebrow">CADA DETALHE CONTA</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button className="icon-button" aria-label="Fechar" onClick={close}>
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function LinkMark() {
  return <ArrowUpRight size={15} />;
}
