/**
 * TikTok Events API (server-side). Envia a compra confirmada no momento em que
 * o webhook do PIX confirma o pagamento — assim a conversão é creditada à
 * campanha correta mesmo sem o navegador do cliente aberto.
 */
import { TIKTOK_PIXEL_ID } from "./tiktok-config";

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

async function sha256(v?: string | null) {
  if (!v) return undefined;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type TikTokPurchase = {
  eventName?: string;
  eventId: string;
  eventTime?: number;
  value: number;
  currency?: string;
  contents?: { content_name?: string | undefined; price?: number | undefined; quantity?: number | undefined }[];
  email?: string | null;
  phone?: string | null;
  ttclid?: string | null;
  ttp?: string | null;
  pageUrl?: string | null;
  userAgent?: string | null;
  ip?: string | null;
};

export async function sendTikTokEvent(p: TikTokPurchase) {
  const token = process.env["TIKTOK_ACCESS_TOKEN"];
  const pixel = process.env["TIKTOK_PIXEL_ID"] || TIKTOK_PIXEL_ID;
  if (!token || !pixel) return { ok: false as const, error: "tiktok não configurado" };

  const body = {
    event_source: "web",
    event_source_id: pixel,
    data: [
      {
        event: p.eventName ?? "CompletePayment",
        event_time: p.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: p.eventId,
        user: {
          email: await sha256(p.email?.trim().toLowerCase()),
          phone: await sha256(p.phone ? `+55${p.phone.replace(/\D/g, "")}` : null),
          ttclid: p.ttclid || undefined,
          ttp: p.ttp || undefined,
          ip: p.ip || undefined,
          user_agent: p.userAgent || undefined,
        },
        properties: {
          currency: p.currency ?? "BRL",
          value: p.value,
          content_type: "product",
          contents: p.contents ?? [],
        },
        page: p.pageUrl ? { url: p.pageUrl } : undefined,
      },
    ],
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": token },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (!res.ok || (json?.code ?? 0) !== 0) {
      console.error("tiktok event failed", res.status, json?.code, json?.message);
      return { ok: false as const, error: json?.message ?? `http ${res.status}` };
    }
    return { ok: true as const };
  } catch (error) {
    console.error("tiktok event network error", error);
    return { ok: false as const, error: "network" };
  }
}
