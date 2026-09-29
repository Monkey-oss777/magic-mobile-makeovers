/**
 * Pixel do TikTok (browser) + captura de atribuição de campanha.
 *
 * O evento de compra confirmada é enviado pelo servidor (Events API) usando o
 * mesmo event_id do navegador, então o TikTok deduplica e credita a campanha
 * correta mesmo se o cliente fechar a página antes do PIX cair.
 */
import { TIKTOK_PIXEL_ID } from "./tiktok-config";

const TTCLID_KEY = "mst_ttclid";

type Ttq = {
  page: () => void;
  track: (event: string, params?: Record<string, unknown>, opts?: { event_id?: string }) => void;
  identify: (params: Record<string, unknown>) => void;
  load?: (id: string) => void;
};

function ttq(): Ttq | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ttq?: Ttq }).ttq ?? null;
}

/** Salva o ttclid da URL (clique no anúncio) para usar no fim do funil. */
export function captureTikTokClick() {
  if (typeof window === "undefined") return;
  try {
    const id = new URLSearchParams(window.location.search).get("ttclid");
    if (id) window.localStorage.setItem(TTCLID_KEY, id);
  } catch {
    /* storage bloqueado */
  }
}

function cookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

export type TikTokAttribution = {
  ttclid: string;
  ttp: string;
  pageUrl: string;
  eventId: string;
};

export function getTikTokAttribution(eventId: string): TikTokAttribution {
  let stored = "";
  try {
    stored = window.localStorage.getItem(TTCLID_KEY) ?? "";
  } catch {
    /* storage bloqueado */
  }
  return {
    ttclid: stored || cookie("ttclid"),
    ttp: cookie("_ttp"),
    pageUrl: window.location.href,
    eventId,
  };
}

/** Dispara evento no pixel do navegador. */
export function ttTrack(
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string,
) {
  const q = ttq();
  if (!q) return;
  try {
    q.track(event, params, eventId ? { event_id: eventId } : undefined);
  } catch {
    /* pixel ausente */
  }
}

/** Associa o contato ao evento (o TikTok exige valores com hash sha256). */
export async function ttIdentify(email: string, phone: string) {
  const q = ttq();
  if (!q) return;
  try {
    q.identify({
      email: await sha256(email.trim().toLowerCase()),
      phone_number: await sha256(`+55${phone.replace(/\D/g, "")}`),
    });
  } catch {
    /* pixel ausente */
  }
}

async function sha256(v: string) {
  if (!v || !globalThis.crypto?.subtle) return "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Produto principal do funil — usado nos parâmetros padrão dos eventos. */
export const TT_CONTENT = {
  content_id: "ichef-shark-7-pecas",
  content_type: "product",
  content_name: "Conjunto iChef Shark 7 peças",
  content_category: "Bebidas / Brindes",
  currency: "BRL",
};

/** Monta os parâmetros básicos que o TikTok espera em todos os eventos. */
export function ttParams(value = 0, extra: Record<string, unknown> = {}) {
  return {
    ...TT_CONTENT,
    value: Number(value.toFixed(2)),
    quantity: 1,
    contents: [
      {
        content_id: TT_CONTENT.content_id,
        content_type: TT_CONTENT.content_type,
        content_name: TT_CONTENT.content_name,
        quantity: 1,
        price: Number(value.toFixed(2)),
      },
    ],
    ...extra,
  };
}

/** PageView com parâmetros (o snippet já dispara o page() automático). */
export function ttPageView(params: Record<string, unknown> = {}) {
  const q = ttq();
  if (!q) return;
  try {
    q.page();
  } catch {
    /* pixel ausente */
  }
  ttTrack("ViewContent", ttParams(0, params));
}

/** Script oficial do pixel, carregado só quando o ID está configurado. */
export const tiktokPixelSnippet = TIKTOK_PIXEL_ID
  ? `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');`
  : "";
