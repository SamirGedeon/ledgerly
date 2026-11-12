const key = "ledgerly.session";
export const token = () => sessionStorage.getItem(key);
export const saveToken = (value: string | null) =>
  value ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key);
export async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ errors: ["Servidor indisponível. Tente novamente."] }));
    if (response.status === 401 && token())
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(body.errors?.join(" · ") || "Não foi possível concluir.");
  }
  return response;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await request(path, init);
  return response.status === 204 ? (undefined as T) : response.json();
}
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export function cents(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error("Informe um valor com até duas casas decimais.");
  const [whole, decimal = ""] = value.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}
export async function download(path: string, filename: string) {
  const response = await request(path);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
