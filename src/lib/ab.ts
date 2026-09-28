/**
 * Teste A/B da forma de pagamento.
 *
 * Variante "pix"  -> checkout finaliza no PIX (copia e cola + QR)
 * Variante "card" -> checkout finaliza no cartão de crédito
 *
 * Sorteio 50/50 no primeiro acesso, persistido no navegador.
 * Override manual pela URL: ?pay=pix | ?pay=card (ou ?v=a | ?v=b)
 */

export type PayVariant = "pix" | "card";

const STORAGE_KEY = "mst_ab_pay";

function fromUrl(): PayVariant | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const pay = (p.get("pay") || "").toLowerCase();
  if (pay === "pix" || pay === "card") return pay;
  const v = (p.get("v") || "").toLowerCase();
  if (v === "a") return "pix";
  if (v === "b") return "card";
  return null;
}

export function getPayVariant(): PayVariant {
  if (typeof window === "undefined") return "pix";
  const forced = fromUrl();
  if (forced) {
    try {
      window.localStorage.setItem(STORAGE_KEY, forced);
    } catch {
      /* storage bloqueado */
    }
    return forced;
  }
  // Padrao atual: PIX (integracao real). O cartao fica disponivel apenas
  // por override manual na URL (?pay=card) para futuros testes A/B.
  return "pix";
}

/** Envia o evento para dataLayer / Pixel, sempre com a variante anexada. */
export function track(
  event: string,
  variant: PayVariant,
  data: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const payload = { event, ab_pay: variant, ...data };
  const w = window as unknown as {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
  try {
    w.fbq?.("trackCustom", event, payload);
  } catch {
    /* pixel ausente */
  }
}
