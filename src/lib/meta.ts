/**
 * Pixel do Facebook (browser) + atribuição de campanha (fbclid / _fbp / _fbc).
 *
 * A compra confirmada é enviada também pelo servidor (Conversions API) com o
 * mesmo event_id, então a Meta deduplica e credita a campanha correta mesmo se
 * o cliente fechar a página antes do PIX cair.
 */
import { META_PIXEL_IDS } from "./meta-config";

const FBCLID_KEY = "mst_fbclid";

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { fbq?: Fbq }).fbq ?? null;
}

function cookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

/** Salva o fbclid da URL (clique no anúncio) para usar no fim do funil. */
export function captureMetaClick() {
  if (typeof window === "undefined") return;
  try {
    const id = new URLSearchParams(window.location.search).get("fbclid");
    if (id) window.localStorage.setItem(FBCLID_KEY, id);
  } catch {
    /* storage bloqueado */
  }
}

export type MetaAttribution = { fbp: string; fbc: string };

/** _fbp e _fbc (montado do fbclid quando o cookie ainda não existe). */
export function getMetaAttribution(): MetaAttribution {
  let stored = "";
  try {
    stored = window.localStorage.getItem(FBCLID_KEY) ?? "";
  } catch {
    /* storage bloqueado */
  }
  const fbc = cookie("_fbc") || (stored ? `fb.1.${Date.now()}.${stored}` : "");
  return { fbp: cookie("_fbp"), fbc };
}

/** Produto principal do funil — parâmetros padrão dos eventos. */
export const FB_CONTENT = {
  content_ids: ["copo-monster-115"],
  content_name: "Copo Térmico Monster 1,15L",
  content_type: "product",
  content_category: "Bebidas / Brindes",
  currency: "BRL",
};

export function fbParams(value = 0, extra: Record<string, unknown> = {}) {
  return {
    ...FB_CONTENT,
    value: Number(value.toFixed(2)),
    num_items: 1,
    contents: [{ id: FB_CONTENT.content_ids[0], quantity: 1, item_price: Number(value.toFixed(2)) }],
    ...extra,
  };
}

/** Evento padrão da Meta (track). */
export function fbTrack(
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string,
) {
  const q = fbq();
  if (!q) return;
  try {
    q("track", event, params, eventId ? { eventID: eventId } : undefined);
  } catch {
    /* pixel ausente */
  }
}

/** Evento personalizado (trackCustom) — usado nas etapas do quiz. */
export function fbTrackCustom(
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string,
) {
  const q = fbq();
  if (!q) return;
  try {
    q("trackCustom", event, params, eventId ? { eventID: eventId } : undefined);
  } catch {
    /* pixel ausente */
  }
}

/** PageView + ViewContent na entrada do funil. */
export function fbPageView(params: Record<string, unknown> = {}) {
  const q = fbq();
  if (!q) return;
  try {
    q("track", "PageView");
  } catch {
    /* pixel ausente */
  }
  fbTrack("ViewContent", fbParams(0, params));
}

/** Advanced matching: envia email/telefone para melhorar a atribuição. */
export function fbIdentify(email: string, phone: string) {
  const q = fbq();
  if (!q) return;
  try {
    for (const pixelId of META_PIXEL_IDS) {
      q("init", pixelId, {
        em: email.trim().toLowerCase(),
        ph: `55${phone.replace(/\D/g, "")}`,
      } as unknown as Record<string, unknown>);
    }
  } catch {
    /* pixel ausente */
  }
}

/** Inicializa Pixels cadastrados no painel sem recarregar o site. */
export function initializeManagedMetaPixels(pixelIds: string[]) {
  const q = fbq();
  if (!q) return;
  for (const pixelId of pixelIds) {
    if (META_PIXEL_IDS.some((current) => current === pixelId)) continue;
    try {
      q("init", pixelId);
      q("trackSingle", pixelId, "PageView");
    } catch {
      /* pixel inválido ou script bloqueado */
    }
  }
}

/** Script oficial do Pixel, carregado só quando o ID está configurado. */
export function createMetaPixelSnippet(managedPixelIds: string[] = []) {
  const pixelIds = [...new Set([...META_PIXEL_IDS, ...managedPixelIds])].filter((pixelId) => /^\d{8,25}$/.test(pixelId));
  return pixelIds.length
    ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
${pixelIds.map((pixelId) => `fbq('init','${pixelId}');`).join("\n")}
fbq('track','PageView');`
    : "";
}

export const metaPixelSnippet = createMetaPixelSnippet();
