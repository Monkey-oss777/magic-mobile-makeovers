import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Resumo do pedido para o funil de diferença de frete (sem expor dados sensíveis extras).
export const getOrderSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().min(4).max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("pix_orders")
      .select(
        "order_id, amount, status, customer_name, customer_email, customer_cpf, customer_phone, shipping, items, paid_at",
      )
      .eq("order_id", data.orderId)
      .maybeSingle();

    if (!row) return { ok: false as const };

    const shipping = (row.shipping ?? {}) as Record<string, string | undefined>;
    return {
      ok: true as const,
      orderId: row.order_id,
      amount: Number(row.amount),
      status: row.status,
      paidAt: row.paid_at,
      items: Array.isArray(row.items)
        ? row.items.filter((item): item is { nome: string; valor: number } =>
            typeof item === "object" && item !== null && !Array.isArray(item) &&
            typeof item.nome === "string" && typeof item.valor === "number",
          )
        : [],
      customer: {
        name: row.customer_name,
        email: row.customer_email,
        cpf: row.customer_cpf,
        phone: row.customer_phone,
      },
      shipping: {
        method: shipping["method"] ?? "",
        cep: shipping["cep"] ?? "",
        rua: shipping["rua"] ?? "",
        num: shipping["num"] ?? "",
        compl: shipping["compl"] ?? "",
        bairro: shipping["bairro"] ?? "",
        cidade: shipping["cidade"] ?? "",
        uf: shipping["uf"] ?? "",
      },
    };
  });
