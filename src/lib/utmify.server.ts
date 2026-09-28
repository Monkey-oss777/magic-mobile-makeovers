// Envio server-side de vendas pagas para a Utmify.
// Documentação: POST https://api.utmify.com.br/api-credentials/orders (header x-api-token)

const UTMIFY_URL = "https://api.utmify.com.br/api-credentials/orders";

type UtmifyProduct = {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  quantity: number;
  priceInCents: number;
};

export type UtmifyOrderInput = {
  orderId: string;
  amount: number; // em reais
  productName: string;
  extraItems?: { nome?: string; valor?: number }[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerDocument?: string | null;
  createdAt?: string | null; // ISO
  approvedAt?: string | null; // ISO
  pageUrl?: string | null;
};

function utcStamp(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toISOString().replace("T", " ").substring(0, 19);
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "produto";
}

function trackingFrom(pageUrl?: string | null) {
  const empty = {
    src: null as string | null,
    sck: null as string | null,
    utm_source: null as string | null,
    utm_campaign: null as string | null,
    utm_medium: null as string | null,
    utm_content: null as string | null,
    utm_term: null as string | null,
  };
  if (!pageUrl) return empty;
  try {
    const p = new URL(pageUrl).searchParams;
    return {
      src: p.get("src"),
      sck: p.get("sck"),
      utm_source: p.get("utm_source"),
      utm_campaign: p.get("utm_campaign"),
      utm_medium: p.get("utm_medium"),
      utm_content: p.get("utm_content"),
      utm_term: p.get("utm_term"),
    };
  } catch {
    return empty;
  }
}

export async function sendUtmifyOrder(
  input: UtmifyOrderInput,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const token = process.env["UTMIFY_API_TOKEN"];
  if (!token) return { ok: false, error: "UTMIFY_API_TOKEN ausente" };

  const totalInCents = Math.round(Number(input.amount || 0) * 100);
  const products: UtmifyProduct[] = [
    {
      id: slug(input.productName),
      name: input.productName,
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: totalInCents,
    },
  ];
  for (const item of input.extraItems ?? []) {
    if (!item?.nome) continue;
    products.push({
      id: slug(item.nome),
      name: item.nome,
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: Math.round(Number(item.valor || 0) * 100),
    });
  }

  const createdAt = utcStamp(input.createdAt);
  const approvedDate = utcStamp(input.approvedAt ?? input.createdAt);

  const payload = {
    orderId: input.orderId,
    platform: "Cacofy",
    paymentMethod: "pix",
    status: "paid",
    createdAt,
    approvedDate,
    refundedAt: null,
    customer: {
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone ?? null,
      document: input.customerDocument ?? null,
      country: "BR",
    },
    products,
    trackingParameters: trackingFrom(input.pageUrl),
    commission: {
      totalPriceInCents: totalInCents,
      gatewayFeeInCents: Math.round(totalInCents * 0.03),
      userCommissionInCents: Math.round(totalInCents * 0.97),
      currency: "BRL",
    },
    isTest: false,
  };

  try {
    const res = await fetch(UTMIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": token },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("utmify order failed", res.status, text.slice(0, 300));
      return { ok: false, status: res.status, error: text.slice(0, 300) };
    }
    return { ok: true, status: res.status };
  } catch (error) {
    console.error("utmify network error", error);
    return { ok: false, error: (error as Error).message };
  }
}
