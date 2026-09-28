import { createFileRoute } from "@tanstack/react-router";

type WebhookBody = {
  event?: string;
  data?: {
    transacao_id?: string;
    status_pagamento?: string;
    order_id?: string;
  };
  order_id?: string;
};

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
        let body: WebhookBody | null = null;
        try {
          body = (await request.json()) as WebhookBody;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const event = (body?.event ?? body?.data?.status_pagamento ?? "").toLowerCase();
        const status = STATUS_MAP[event] ?? "pending";
        const transactionId = body?.data?.transacao_id;
        const orderId = body?.order_id ?? body?.data?.order_id;

        if (!transactionId && !orderId) {
          return new Response("missing identifier", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const patch = {
          status,
          last_webhook: body as unknown as Record<string, never>,
          ...(status === "approved" ? { paid_at: new Date().toISOString() } : {}),
        };


        let query = supabaseAdmin.from("pix_orders").update(patch).select("*");
        query = orderId
          ? query.eq("order_id", orderId)
          : query.eq("transaction_id", transactionId!);
        const { data: rows, error } = await query;

        if (error) {
          console.error("pix webhook update failed", error.message);
          return new Response("ok", { status: 200 });
        }

        // Conversão server-side no TikTok, só quando o pagamento é aprovado.
        const order = rows?.[0];
        if (status === "approved" && order && !order.tt_sent_at) {
          const { sendTikTokEvent } = await import("@/lib/tiktok.server");
          const items = Array.isArray(order.items)
            ? (order.items as { nome?: string; valor?: number }[])
            : [];
          const sent = await sendTikTokEvent({
            eventId: order.tt_event_id ?? order.order_id,
            value: Number(order.amount ?? 0),
            contents: [
              { content_name: order.product_name ?? "Copo Monster", price: Number(order.amount ?? 0), quantity: 1 },
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
        if (status === "approved" && order && (!order.fb_sent_at || !order.fb2_sent_at)) {
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
                id: "copo-monster-115",
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
        if (status === "approved" && order) {
          const { sendManagedMetaEvents } = await import("@/lib/meta.server");
          const ship = (order.shipping ?? {}) as { cep?: string; cidade?: string; uf?: string };
          await sendManagedMetaEvents(order.order_id, {
            eventId: order.fb_event_id ?? order.order_id,
            value: Number(order.amount ?? 0),
            contents: [{ id: "copo-monster-115", quantity: 1, item_price: Number(order.amount ?? 0) }],
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
        if (status === "approved" && order && !order.utmify_sent_at) {
          const { sendUtmifyOrder } = await import("@/lib/utmify.server");
          const sent = await sendUtmifyOrder({
            orderId: order.order_id,
            amount: Number(order.amount ?? 0),
            productName: order.product_name ?? "Copo Monster",
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
