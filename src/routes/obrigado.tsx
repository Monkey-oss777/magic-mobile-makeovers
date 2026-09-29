import { ICHEF_IMAGES as IMG } from "@/lib/ichef-assets";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getOrderSummary } from "@/lib/order.functions";
import { PRIZE_PRODUCTS } from "@/lib/prize-products";

const brl = (v: number) => v.toFixed(2).replace(".", ",");

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado · Peças iChef Shark a caminho" },
      {
        name: "description",
        content:
          "Diferença de frete paga e pedido liberado para envio. Suas três peças iChef Shark serão postadas com código de rastreio.",
      },
      { property: "og:title", content: "Pedido confirmado · Peças iChef Shark a caminho" },
      {
        property: "og:description",
        content: "Pagamento confirmado. Suas três peças iChef Shark estão liberadas para postagem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s["order"] === "string" ? s["order"] : "",
    base: typeof s["base"] === "string" ? s["base"] : "",
    ship: s["ship"] === "sedex" ? "sedex" : "pac",
  }),
  component: Obrigado,
});

function Obrigado() {
  const { order, base, ship } = Route.useSearch();
  const buscar = useServerFn(getOrderSummary);
  const [dados, setDados] = useState<Awaited<ReturnType<typeof getOrderSummary>> | null>(null);
  const [pedidoOriginal, setPedidoOriginal] = useState<Awaited<ReturnType<typeof getOrderSummary>> | null>(null);

  useEffect(() => {
    if (!order) return;
    void buscar({ data: { orderId: order } })
      .then(setDados)
      .catch(() => setDados(null));
  }, [order, buscar]);

  useEffect(() => {
    if (!base) return;
    void buscar({ data: { orderId: base } })
      .then(setPedidoOriginal)
      .catch(() => setPedidoOriginal(null));
  }, [base, buscar]);

  const info = dados?.ok ? dados : null;
  const s = info?.shipping;
  const prazo = ship === "sedex" ? "2 a 5 dias úteis" : "7 a 12 dias úteis";
  const selectedPieces = pedidoOriginal?.ok
    ? pedidoOriginal.items.filter((item) => PRIZE_PRODUCTS.some((piece) => piece.name === item.nome))
    : [];

  return (
    <main className="mst-co" role="main">
      <div className="mst-co-head">
        <span className="mst-co-brand">
          <img src={IMG.logo} alt="iChef" />
          <span>Shark Series</span>
        </span>
        <span className="mst-co-secure">Ambiente seguro</span>
      </div>

      <div className="mst-co-body">
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div className="mst-success-ico">
            <svg viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mst-h2" style={{ margin: 0 }}>
            Pagamento confirmado!
          </h1>
          <p className="mst-sub" style={{ marginBottom: 6 }}>
            Tudo certo com a diferença do frete. Seu pedido saiu da fila e já está liberado para
            postagem.
          </p>
        </div>

        <div className="mst-totals">
          {base && (
            <div className="mst-total-row">
              <span>Pedido</span>
              <b>#{base}</b>
            </div>
          )}
          {selectedPieces.length > 0 ? selectedPieces.map((item) => (
            <div className="mst-total-row" key={item.nome}>
              <span>{item.nome}</span>
              <b className="green">GRÁTIS</b>
            </div>
          )) : (
            <div className="mst-total-row">
              <span>Três peças iChef Shark escolhidas</span>
              <b className="green">GRÁTIS</b>
            </div>
          )}
          <div className="mst-total-row">
            <span>Envio {ship.toUpperCase()}</span>
            <b>{prazo}</b>
          </div>
          {info && (
            <div className="mst-total-final">
              <span>Diferença paga</span>
              <b>R$ {brl(info.amount)}</b>
            </div>
          )}
        </div>

        {s?.rua && (
          <div className="mst-note-ok">
            <b>Endereço de entrega</b>
            <br />
            {s.rua}, {s.num}
            {s.compl ? ` - ${s.compl}` : ""}
            <br />
            {s.bairro} · {s.cidade}/{s.uf} · CEP {s.cep}
          </div>
        )}

        <ol className="mst-pix-steps">
          <li>Etiqueta dos Correios emitida em até 12h</li>
          <li>Código de rastreio enviado para {info?.customer.email || "o seu e-mail"}</li>
          <li>Entrega prevista em {prazo} após a postagem</li>
        </ol>

        <div className="mst-watch">Guarde o número do pedido para acompanhar a entrega</div>

        <Link to="/" className="mst-cta" style={{ display: "block", textAlign: "center" }}>
          Voltar ao início
        </Link>

        <p className="mst-company">
          <strong>Oferta iChef Shark</strong>
          Guarde o número do pedido.
        </p>
      </div>
    </main>
  );
}
