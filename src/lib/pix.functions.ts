import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { createHmac, randomBytes } from "node:crypto";


const CACOFY_URL = "https://app.cacofy.com/api/external_api.php";

const itemSchema = z.object({ nome: z.string().min(1), valor: z.number().min(0) });

const createSchema = z.object({
  amount: z.number().min(0.01).max(100000),
  productName: z.string().min(1).max(120),
  items: z.array(itemSchema).max(10).default([]),
  variant: z.string().max(20).optional(),
  customer: z.object({
    name: z.string().min(3).max(120),
    email: z.string().email(),
    cpf: z.string().regex(/^\d{11}$/),
    phone: z.string().regex(/^\d{10,11}$/),
  }),
  shipping: z
    .object({
      method: z.string().max(20).optional(),
      cep: z.string().max(9).optional(),
      rua: z.string().max(160).optional(),
      num: z.string().max(20).optional(),
      compl: z.string().max(80).optional(),
      bairro: z.string().max(80).optional(),
      cidade: z.string().max(80).optional(),
      uf: z.string().max(2).optional(),
    })
    .default({}),
  tracking: z
    .object({
      ttclid: z.string().max(400).optional(),
      ttp: z.string().max(400).optional(),
      pageUrl: z.string().max(600).optional(),
      eventId: z.string().max(80).optional(),
      fbp: z.string().max(400).optional(),
      fbc: z.string().max(400).optional(),
    })
    .default({}),
});

function webhookUrl(orderId: string) {
  const signingKey = process.env["PIX_WEBHOOK_SIGNING_KEY"];
  if (!signingKey) throw new Error("PIX_WEBHOOK_SIGNING_KEY não configurada");
  const signature = createHmac("sha256", signingKey).update(orderId).digest("hex");
  const siteUrl = process.env["PUBLIC_SITE_URL"];
  if (siteUrl && siteUrl.startsWith("https://")) return `${siteUrl.replace(/\/$/, "")}/api/public/pix-webhook?order=${encodeURIComponent(orderId)}&sig=${signature}`;
  try {
    const origin = new URL(getRequest().url).origin;
    if (origin.startsWith("https://")) return `${origin}/api/public/pix-webhook?order=${encodeURIComponent(orderId)}&sig=${signature}`;
  } catch {
    /* sem request disponível */
  }
  throw new Error("Configure PUBLIC_SITE_URL para receber o webhook PIX");
}

function reqHeader(name: string): string | null {
  try {
    return getRequest().headers.get(name);
  } catch {
    return null;
  }
}

export const createPixCharge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["CACOFY_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "Pagamento indisponível no momento." };

    let callbackUrl: string;
    try {
      // Resolva antes de registrar a cobrança: não crie um pedido sem retorno autenticado.
      // #MST- + 10 caracteres = 15 na tela; 50 bits aleatórios para evitar colisões.
      const shortId = (BigInt(`0x${randomBytes(7).toString("hex")}`) & ((1n << 50n) - 1n))
        .toString(32).toUpperCase().padStart(10, "0");
      callbackUrl = webhookUrl(`MST-${shortId}`);
    } catch {
      return { ok: false as const, error: "Pagamento indisponível no momento." };
    }
    const orderId = new URL(callbackUrl).searchParams.get("order");
    if (!orderId) return { ok: false as const, error: "Pagamento indisponível no momento." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: insertError } = await supabaseAdmin.from("pix_orders").insert({
      order_id: orderId,
      product_name: data.productName,
      amount: data.amount,
      status: "created",
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_cpf: data.customer.cpf,
      customer_phone: data.customer.phone,
      items: data.items,
      shipping: data.shipping,
      ab_variant: data.variant ?? null,
      tt_ttclid: data.tracking.ttclid ?? null,
      tt_ttp: data.tracking.ttp ?? null,
      tt_page_url: data.tracking.pageUrl ?? null,
      tt_event_id: data.tracking.eventId || orderId,
      fb_fbp: data.tracking.fbp ?? null,
      fb_fbc: data.tracking.fbc ?? null,
      fb_event_id: data.tracking.eventId || orderId,
      tt_user_agent: reqHeader("user-agent"),
      tt_ip: reqHeader("cf-connecting-ip") ?? reqHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    if (insertError) {
      console.error("pix order insert failed", insertError.message);
      return { ok: false as const, error: "Não foi possível iniciar o pagamento. Tente novamente." };
    }

    let res: Response;
    try {
      res = await fetch(CACOFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({
          product_name: data.productName,
          amount: data.amount,
          order_id: orderId,
          webhook_url: callbackUrl,
          customer: {
            name: data.customer.name,
            email: data.customer.email,
            cpf: data.customer.cpf,
            phone: data.customer.phone,
          },
        }),
      });
    } catch (error) {
      console.error("pix create network error", error);
      await supabaseAdmin
        .from("pix_orders")
        .update({ status: "error" })
        .eq("order_id", orderId);
      return { ok: false as const, error: "Não foi possível gerar o PIX. Tente novamente." };
    }

    const body = (await res.json().catch(() => null)) as
      | {
          success?: boolean;
          error?: string;
          transaction_id?: string;
          qr_code?: string | null;
          qr_code_base64?: string | null;
          status?: string;
        }
      | null;

    if (!res.ok || !body?.success) {
      console.error("pix create failed", res.status, body?.error);
      await supabaseAdmin
        .from("pix_orders")
        .update({ status: "error" })
        .eq("order_id", orderId);
      return {
        ok: false as const,
        error:
          res.status === 429
            ? "Muitas tentativas. Aguarde alguns segundos e tente de novo."
            : "Não foi possível gerar o PIX. Confira seus dados e tente novamente.",
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from("pix_orders")
      .update({
        transaction_id: body.transaction_id ?? null,
        // O retorno pode chegar antes da resposta de criação; não rebaixe uma aprovação.
      })
      .eq("order_id", orderId)
      .is("transaction_id", null);
    if (updateError) console.error("pix transaction update failed", updateError.message);

    return {
      ok: true as const,
      orderId,
      transactionId: body.transaction_id ?? null,
      qrCode: body.qr_code ?? null,
      qrCodeBase64: body.qr_code_base64 ?? null,
      amount: data.amount,
    };
  });

export const getPixStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().min(4).max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("pix_orders")
      .select("status, paid_at")
      .eq("order_id", data.orderId)
      .maybeSingle();
    return { status: row?.status ?? "unknown", paidAt: row?.paid_at ?? null };
  });
