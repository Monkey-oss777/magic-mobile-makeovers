/**
 * Conversions API da Meta (server-side). Dispara Purchase quando o webhook do
 * PIX confirma o pagamento, com o mesmo event_id do navegador (deduplicação).
 */
import { META_PIXEL_ID, META_PIXEL_ID_2 } from "./meta-config";

const VERSION = "v21.0";

async function sha256(v?: string | null) {
  if (!v) return undefined;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type MetaPurchase = {
  eventName?: string;
  eventId: string;
  eventTime?: number;
  value: number;
  currency?: string;
  contents?: { id?: string; quantity?: number; item_price?: number }[];
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  pageUrl?: string | null;
  userAgent?: string | null;
  ip?: string | null;
};

export type MetaDestination = "primary" | "secondary";

export async function sendMetaEvent(
  p: MetaPurchase,
  destination: MetaDestination = "primary",
  credentials?: { pixelId: string; token: string },
) {
  const secondary = destination === "secondary";
  const token = credentials?.token ?? process.env[secondary ? "META_ACCESS_TOKEN_2" : "META_ACCESS_TOKEN"];
  const pixel = credentials?.pixelId ?? (secondary
    ? process.env["META_PIXEL_ID_2"] || META_PIXEL_ID_2
    : process.env["META_PIXEL_ID"] || META_PIXEL_ID);
  if (!token || !pixel) return { ok: false as const, error: "meta não configurado" };

  const body = {
    data: [
      {
        event_name: p.eventName ?? "Purchase",
        event_time: p.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: p.eventId,
        action_source: "website",
        event_source_url: p.pageUrl || undefined,
        user_data: {
          em: await sha256(p.email?.trim().toLowerCase()),
          ph: await sha256(p.phone ? `55${p.phone.replace(/\D/g, "")}` : null),
          fn: await sha256(p.firstName?.trim().toLowerCase().split(" ")[0]),
          zp: await sha256(p.cep?.replace(/\D/g, "")),
          ct: await sha256(p.city?.trim().toLowerCase().replace(/\s/g, "")),
          st: await sha256(p.state?.trim().toLowerCase()),
          fbp: p.fbp || undefined,
          fbc: p.fbc || undefined,
          client_ip_address: p.ip || undefined,
          client_user_agent: p.userAgent || undefined,
        },
        custom_data: {
          currency: p.currency ?? "BRL",
          value: p.value,
          content_type: "product",
          contents: p.contents ?? [],
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const json = (await res.json().catch(() => null)) as
      | { events_received?: number; error?: { message?: string } }
      | null;
    if (!res.ok || json?.error) {
      console.error(`meta capi ${credentials?.pixelId ?? destination} failed`, res.status, json?.error?.message);
      return { ok: false as const, error: json?.error?.message ?? `http ${res.status}` };
    }
    return { ok: true as const };
  } catch (error) {
    console.error(`meta capi ${credentials?.pixelId ?? destination} network error`, error);
    return { ok: false as const, error: "network" };
  }
}

export async function sendManagedMetaEvents(orderId: string, p: MetaPurchase) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { decryptMetaToken } = await import("./meta-pixels.server");
  const { data: pixels } = await supabaseAdmin
    .from("meta_pixels")
    .select("id, pixel_id, token_ciphertext, token_iv")
    .eq("is_active", true);

  for (const pixel of pixels ?? []) {
    const { data: existing } = await supabaseAdmin
      .from("meta_pixel_deliveries")
      .select("id, status")
      .eq("order_id", orderId)
      .eq("pixel_id", pixel.id)
      .eq("event_name", p.eventName ?? "Purchase")
      .maybeSingle();
    if (existing?.status === "sent") continue;

    let token: string;
    try {
      token = await decryptMetaToken(pixel.token_ciphertext, pixel.token_iv);
    } catch {
      console.error("meta token decrypt failed", pixel.pixel_id);
      continue;
    }
    const result = await sendMetaEvent(p, "primary", { pixelId: pixel.pixel_id, token });
    const now = new Date().toISOString();
    await supabaseAdmin.from("meta_pixel_deliveries").upsert(
      {
        order_id: orderId,
        pixel_id: pixel.id,
        event_name: p.eventName ?? "Purchase",
        event_id: p.eventId,
        status: result.ok ? "sent" : "failed",
        error_message: result.ok ? null : result.error,
        sent_at: result.ok ? now : null,
      },
      { onConflict: "order_id,pixel_id,event_name" },
    );
  }
}
