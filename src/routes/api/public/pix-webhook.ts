import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const webhookSchema = z.object({
  event: z.string().max(40).optional(),
  data: z.object({
    transacao_id: z.string().max(150).optional(),
    status_pagamento: z.string().max(40).optional(),
    order_id: z.string().max(80).optional(),
  }).optional(),
  order_id: z.string().max(80).optional(),
}).passthrough();

const STATUS_MAP: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  paid: "approved",
  refused: "refused",
  canceled: "canceled",
  refunded: "refunded",
  chargeback: "chargeback",
};

export const Route = createFileRoute("/api/public/pix-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("order");
        const signature = url.searchParams.get("sig");
        const signingKey = process.env["PIX_WEBHOOK_SIGNING_KEY"];
        // Aceita os códigos curtos novos e os UUIDs antigos ainda aguardando retorno.
        if (!signingKey || !orderId || !/^(?:MST-[0-9A-V]{11}|MST-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/.test(orderId) || !signature || !/^[0-9a-f]{64}$/.test(signature)) {
          return new Response("unauthorized", { status: 401 });
        }
        const expected = createHmac("sha256", signingKey).update(orderId).digest("hex");
        if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
          return new Response("unauthorized", { status: 401 });
        }

        let body: z.infer<typeof webhookSchema>;
        try {
          body = webhookSchema.parse(await request.json());
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const event = (body?.event ?? body?.data?.status_pagamento ?? "").toLowerCase();
        const status = STATUS_MAP[event];
        const transactionId = body?.data?.transacao_id;
        if (!status || (body.order_id && body.order_id !== orderId) || (body.data?.order_id && body.data.order_id !== orderId)) {
          return new Response("invalid event", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: current, error: lookupError } = await supabaseAdmin.from("pix_orders")
          .select("status, transaction_id, paid_at").eq("order_id", orderId).maybeSingle();
        if (lookupError) return new Response("retry", { status: 500 });
        if (!current) return new Response("unknown order", { status: 404 });
        if (transactionId && current.transaction_id && current.transaction_id !== transactionId) {
          return new Response("invalid transaction", { status: 400 });
        }
        // Evite rebaixar uma compra já aprovada por notificações atrasadas.
        const effectiveStatus = current.status === "approved" && status !== "refunded" && status !== "chargeback" ? "approved" : status;
        const patch = {
          status: effectiveStatus,
          last_webhook: JSON.parse(JSON.stringify(body)) as Record<string, string | number | boolean | null>,
          ...(transactionId && !current.transaction_id ? { transaction_id: transactionId } : {}),
          ...(effectiveStatus === "approved" && !current.paid_at ? { paid_at: new Date().toISOString() } : {}),
        };

        const { data: rows, error } = await supabaseAdmin.from("pix_orders").update(patch).eq("order_id", orderId).select("*");

        if (error) {
          console.error("pix webhook update failed", error.message);
          return new Response("retry", { status: 500 });
        }

        // Conversão server-side no TikTok, só quando o pagamento é aprovado.
        const order = rows?.[0];
        if (effectiveStatus === "approved" && order && !order.tt_sent_at) {
          const { sendTikTokEvent } = await import("@/lib/tiktok.server");
          const items = Array.isArray(order.items)
            ? (order.items as { nome?: string; valor?: number }[])
            : [];
          const sent = await sendTikTokEvent({
            eventId: order.tt_event_id ?? order.order_id,
            value: Number(order.amount ?? 0),
            contents: [
              { content_name: order.product_name ?? "Conjunto iChef Shark", price: Number(order.amount ?? 0), quantity: 1 },
              ...items.map((i) => ({ content_name: i.nome, price: i.valor, quantity: 1 })),
            ],
            email: order.customer_email,
            phone: order.customer_phone,
            ttclid: order.tt_ttclid,
            ttp: order.tt_ttp,
            pageUrl: order.tt_page_url,
            userAgent: order.tt_user_agent,
            ip: order.tt_ip,
          });
          if (sent.ok) {
            await supabaseAdmin
              .from("pix_orders")
              .update({ tt_sent_at: new Date().toISOString() })
              .eq("order_id", order.order_id);
          }
        }

        // Conversões server-side nos dois Pixels da Meta, com controle independente.
        if (effectiveStatus === "approved" && order && (!order.fb_sent_at || !order.fb2_sent_at)) {
          const { sendMetaEvent } = await import("@/lib/meta.server");
          const ship = (order.shipping ?? {}) as {
            cep?: string;
            cidade?: string;
            uf?: string;
          };
          const purchase = {
            eventId: order.fb_event_id ?? order.order_id,
            value: Number(order.amount ?? 0),
            contents: [
              {
                id: "ichef-shark-7-pecas",
                quantity: 1,
                item_price: Number(order.amount ?? 0),
              },
            ],
            email: order.customer_email,
            phone: order.customer_phone,
            firstName: order.customer_name,
            cep: ship.cep ?? null,
            city: ship.cidade ?? null,
            state: ship.uf ?? null,
            fbp: order.fb_fbp,
            fbc: order.fb_fbc,
            pageUrl: order.tt_page_url,
            userAgent: order.tt_user_agent,
            ip: order.tt_ip,
          };
          if (!order.fb_sent_at) {
            const sent = await sendMetaEvent(purchase, "primary");
            if (sent.ok) {
              await supabaseAdmin
                .from("pix_orders")
                .update({ fb_sent_at: new Date().toISOString() })
                .eq("order_id", order.order_id);
            }
          }
          if (!order.fb2_sent_at) {
            const sent = await sendMetaEvent(purchase, "secondary");
            if (sent.ok) {
            await supabaseAdmin
              .from("pix_orders")
                .update({ fb2_sent_at: new Date().toISOString() })
              .eq("order_id", order.order_id);
            }
          }
        }

        // Pixels adicionais cadastrados no painel, com deduplicação individual.
        if (effectiveStatus === "approved" && order) {
          const { sendManagedMetaEvents } = await import("@/lib/meta.server");
          const ship = (order.shipping ?? {}) as { cep?: string; cidade?: string; uf?: string };
          await sendManagedMetaEvents(order.order_id, {
            eventId: order.fb_event_id ?? order.order_id,
            value: Number(order.amount ?? 0),
            contents: [{ id: "ichef-shark-7-pecas", quantity: 1, item_price: Number(order.amount ?? 0) }],
            email: order.customer_email,
            phone: order.customer_phone,
            firstName: order.customer_name,
            cep: ship.cep ?? null,
            city: ship.cidade ?? null,
            state: ship.uf ?? null,
            fbp: order.fb_fbp,
            fbc: order.fb_fbc,
            pageUrl: order.tt_page_url,
            userAgent: order.tt_user_agent,
            ip: order.tt_ip,
          });
        }

        // Envio da venda paga para o painel da Utmify.
        if (effectiveStatus === "approved" && order && !order.utmify_sent_at) {
          const { sendUtmifyOrder } = await import("@/lib/utmify.server");
          const sent = await sendUtmifyOrder({
            orderId: order.order_id,
            amount: Number(order.amount ?? 0),
            productName: order.product_name ?? "Conjunto iChef Shark",
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            customerDocument: order.customer_cpf,
            createdAt: order.created_at,
            approvedAt: order.paid_at ?? new Date().toISOString(),
            pageUrl: order.tt_page_url,
          });
          if (sent.ok) {
            await supabaseAdmin
              .from("pix_orders")
              .update({ utmify_sent_at: new Date().toISOString() })
              .eq("order_id", order.order_id);
          }
        }

        return Response.json({ received: true });

      },
    },
  },
});
