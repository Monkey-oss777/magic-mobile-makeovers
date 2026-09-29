/**
 * Teste A/B da forma de pagamento.
 *
 * Variante "pix"  -> checkout finaliza no PIX (copia e cola + QR)
 * Variante "card" -> checkout finaliza no cartão de crédito
 *
 * Cartão permanece indisponível até existir um processador de cartões real.
 */

export type PayVariant = "pix" | "card";

export function getPayVariant(): PayVariant {
  // O checkout de cartão herdado do original simulava aprovação sem cobrar.
  // Não disponibilize esse caminho enquanto não houver processador de cartões.
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
