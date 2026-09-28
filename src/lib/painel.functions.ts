import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PAINEL_SENHA = "Lula2026";

export type PainelSource = "tiktok" | "meta" | "direto";
export type PainelGender = "homem" | "mulher" | "indefinido";

export type PainelOrder = {
  orderId: string;
  amount: number;
  productName: string;
  customerName: string;
  createdAt: string;
  paidAt: string | null;
  source: PainelSource;
  gender: PainelGender;
  campaign: string | null;
  kind: "pedido" | "frete";
  shipMethod: string;
};

// Heurística de gênero pelo primeiro nome (padrões do português brasileiro).
const NOMES_HOMEM = new Set([
  "luca","luka","nicolas","tomas","thomas","joshua","noah","elias","josue","jonas","jeremias","isaias","ezequiel",
  "andre","dante","vicente","felipe","filipe","henrique","enrique","jose","joao","joao pedro","matheus","matias",
  "ricardo","eduardo","carlos","paulo","pedro","lucas","marcos","rafael","gabriel","daniel","samuel","miguel",
  "arthur","artur","davi","david","bernardo","benicio","caio","cauã","caua","erick","erik","yuri","iuri","levi",
  "otavio","octavio","murilo","gustavo","leonardo","leandro","fabio","flavio","sergio","silvio","claudio","julio",
  "cassio","marcio","mauricio","patricio","tarcisio","anisio","alicio","aurelio","emilio","cicero","valdo",
]);
const NOMES_MULHER = new Set([
  "beatriz","raquel","rachel","ester","esther","abigail","abigail","ruth","judith","dilene","irene","ines","isis",
  "iris","lais","lais","tais","thais","mercedes","carmen","carmem","soledad","dulce","alice","elis","eliz",
  "eloa","noemi","naomi","miriam","mirian","sarah","sara","rebeca","raissa","jasmin","jasmim","yasmin","yasmim",
  "kelly","kelli","shirley","cristiane","adriane","liliane","juliane","luane","ivone","yvone","simone","alderi",
]);

function generoDoNome(nome: string): PainelGender {
  const primeiro = nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)[0];
  if (!primeiro || primeiro.length < 3) return "indefinido";
  if (NOMES_HOMEM.has(primeiro)) return "homem";
  if (NOMES_MULHER.has(primeiro)) return "mulher";
  if (/(a|ia|ana|ina|ela|isa|ice|elle|ette)$/.test(primeiro)) return "mulher";
  if (/(o|os|or|on|son|ton|el|il|iel|ael|im|um|us|ur|ir|ar|er|ard|aldo|ilson)$/.test(primeiro)) return "homem";
  return "indefinido";
}


function paramsOf(url?: string | null): URLSearchParams {
  if (!url) return new URLSearchParams();
  try {
    return new URL(url).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

export const getPaidSales = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ password: z.string().max(80) }).parse(input))
  .handler(async ({ data }) => {
    if (data.password !== PAINEL_SENHA) return { ok: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("pix_orders")
      .select(
        "order_id, amount, product_name, customer_name, created_at, paid_at, status, tt_ttclid, fb_fbc, tt_page_url, shipping",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1000);

    const list = rows ?? [];

    // Origem de cada pedido principal, para herdar nos pagamentos de diferença de frete.
    const sourceByOrder = new Map<string, { source: PainelSource; campaign: string | null }>();
    for (const r of list) {
      const p = paramsOf(r.tt_page_url);
      const utm = (p.get("utm_source") ?? "").toLowerCase();
      let source: PainelSource = "direto";
      if (p.get("ttclid") || utm === "tiktok" || utm === "tt") source = "tiktok";
      else if (p.get("fbclid") || r.fb_fbc || utm === "fb" || utm === "ig" || utm === "facebook" || utm === "instagram")
        source = "meta";
      sourceByOrder.set(r.order_id, { source, campaign: p.get("utm_campaign") });
    }

    const orders: PainelOrder[] = list.map((r) => {
      const p = paramsOf(r.tt_page_url);
      const parent = p.get("order");
      const own = sourceByOrder.get(r.order_id)!;
      const inherited = parent ? sourceByOrder.get(parent) : undefined;
      const attr = own.source === "direto" && inherited ? inherited : own;
      const shipping = (r.shipping ?? {}) as Record<string, string | undefined>;
      return {
        orderId: r.order_id,
        amount: Number(r.amount),
        productName: r.product_name,
        customerName: r.customer_name,
        createdAt: r.created_at,
        paidAt: r.paid_at,
        source: attr.source,
        gender: generoDoNome(r.customer_name ?? ""),
        campaign: attr.campaign,
        kind: parent ? ("frete" as const) : ("pedido" as const),
        shipMethod: (shipping["method"] ?? "").toUpperCase(),
      };
    });

    return { ok: true as const, orders };
  });
