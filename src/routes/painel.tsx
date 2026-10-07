import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPaidSales, type PainelGender, type PainelOrder, type PainelSource } from "@/lib/painel.functions";
import {
  addManagedMetaPixel,
  getManagedMetaPixels,
  removeManagedMetaPixel,
  setManagedMetaPixelActive,
  type ManagedMetaPixel,
} from "@/lib/meta-pixels.functions";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel de Vendas Pagas | GTA VI" },
      { name: "description", content: "Painel interno do desafio GTA VI: vendas pagas por origem de anúncio e gestão de Pixels." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel de Vendas GTA VI" },
      { property: "og:description", content: "Vendas do desafio GTA VI confirmadas por origem de anúncio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPage,
});

const SRC_LABEL: Record<PainelSource, string> = {
  tiktok: "TikTok Ads",
  meta: "Facebook / Instagram",
  direto: "Sem origem de anúncio",
};
const SRC_COLOR: Record<PainelSource, string> = {
  tiktok: "#25f4ee",
  meta: "#1877f2",
  direto: "#9aa392",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function PainelPage() {
  const carregar = useServerFn(getPaidSales);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [orders, setOrders] = useState<PainelOrder[] | null>(null);
  const [filtro, setFiltro] = useState<"todas" | PainelSource>("todas");
  const [filtroGenero, setFiltroGenero] = useState<"todos" | PainelGender>("todos");
  const [pagina, setPagina] = useState(1);
  const [aba, setAba] = useState<"vendas" | "pixels">("vendas");

  const mutation = useMutation({
    mutationFn: (password: string) => carregar({ data: { password } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setErro("Senha incorreta.");
        return;
      }
      setErro("");
      setOrders(res.orders);
      try {
        sessionStorage.setItem("mst_painel", senha);
      } catch {
        /* ignorar */
      }
    },
    onError: () => setErro("Não foi possível carregar agora. Tente novamente."),
  });

  useEffect(() => {
    let salvo = "";
    try {
      salvo = sessionStorage.getItem("mst_painel") ?? "";
    } catch {
      /* ignorar */
    }
    if (salvo) {
      setSenha(salvo);
      mutation.mutate(salvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!orders) {
    return (
      <div className="pnl pnl-gate">
        <form
          className="pnl-card pnl-gate-box"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(senha);
          }}
        >
          <h1 className="pnl-title">
            Painel <span>de vendas</span>
          </h1>
          <p className="pnl-sub">Digite a senha de acesso para ver as vendas pagas.</p>
          <input
            className="pnl-input"
            type="password"
            autoComplete="current-password"
            placeholder="Senha de acesso"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro ? <p className="pnl-err">{erro}</p> : null}
          <button className="pnl-btn" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <PainelConteudo
      orders={orders}
      filtro={filtro}
      setFiltro={setFiltro}
      filtroGenero={filtroGenero}
      setFiltroGenero={setFiltroGenero}
      pagina={pagina}
      setPagina={setPagina}
      onRefresh={() => mutation.mutate(senha)}
      loading={mutation.isPending}
      senha={senha}
      aba={aba}
      setAba={setAba}
    />
  );
}

function PainelConteudo({
  orders,
  filtro,
  setFiltro,
  filtroGenero,
  setFiltroGenero,
  pagina,
  setPagina,
  onRefresh,
  loading,
  senha,
  aba,
  setAba,
}: {
  orders: PainelOrder[];
  filtro: "todas" | PainelSource;
  setFiltro: (v: "todas" | PainelSource) => void;
  filtroGenero: "todos" | PainelGender;
  setFiltroGenero: (v: "todos" | PainelGender) => void;
  pagina: number;
  setPagina: (v: number | ((p: number) => number)) => void;
  onRefresh: () => void;
  loading: boolean;
  senha: string;
  aba: "vendas" | "pixels";
  setAba: (value: "vendas" | "pixels") => void;
}) {
  const resumo = useMemo(() => {
    const base: Record<PainelSource, { qtd: number; total: number }> = {
      tiktok: { qtd: 0, total: 0 },
      meta: { qtd: 0, total: 0 },
      direto: { qtd: 0, total: 0 },
    };
    for (const o of orders) {
      base[o.source].qtd += 1;
      base[o.source].total += o.amount;
    }
    return base;
  }, [orders]);

  const total = orders.reduce((s, o) => s + o.amount, 0);
  const ticket = orders.length ? total / orders.length : 0;

  const pizza = (Object.keys(resumo) as PainelSource[])
    .filter((s) => resumo[s].qtd > 0)
    .map((s) => ({ name: SRC_LABEL[s], value: resumo[s].total, src: s }));

  const porDia = useMemo(() => {
    const map = new Map<string, { dia: string; tiktok: number; meta: number; direto: number }>();
    for (const o of [...orders].reverse()) {
      const k = dia(o.paidAt ?? o.createdAt);
      const cur = map.get(k) ?? { dia: k, tiktok: 0, meta: 0, direto: 0 };
      cur[o.source] += o.amount;
      map.set(k, cur);
    }
    return [...map.values()].slice(-10);
  }, [orders]);

  const lista = useMemo(() => {
    let l = filtro === "todas" ? orders : orders.filter((o) => o.source === filtro);
    if (filtroGenero !== "todos") l = l.filter((o) => o.gender === filtroGenero);
    return l;
  }, [orders, filtro, filtroGenero]);

  const POR_PAGINA = 10;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itensPagina = lista.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const listaRef = useRef<HTMLElement | null>(null);

  const mudarPagina = (p: number) => {
    setPagina(p);
    listaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (aba === "pixels") {
    return (
      <div className="pnl">
        <div className="pnl-wrap">
          <PainelNav aba={aba} setAba={setAba} />
          <PixelManager password={senha} />
        </div>
      </div>
    );
  }

  return (
    <div className="pnl">
      <div className="pnl-wrap">
        <PainelNav aba={aba} setAba={setAba} />
        <header className="pnl-head">
          <div>
            <h1 className="pnl-title">
              Vendas <span>pagas</span>
            </h1>
            <p className="pnl-sub">Somente pedidos confirmados, separados por origem do anúncio.</p>
          </div>
          <button className="pnl-tab" onClick={onRefresh} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </header>

        <section className="pnl-kpis">
          <div className="pnl-card">
            <p className="pnl-kpi-label">Faturamento pago</p>
            <p className="pnl-kpi-value lime">{brl(total)}</p>
            <p className="pnl-kpi-hint">{orders.length} pagamentos confirmados</p>
          </div>
          <div className="pnl-card">
            <p className="pnl-kpi-label">TikTok</p>
            <p className="pnl-kpi-value">{brl(resumo.tiktok.total)}</p>
            <p className="pnl-kpi-hint">{resumo.tiktok.qtd} vendas</p>
          </div>
          <div className="pnl-card">
            <p className="pnl-kpi-label">Facebook / Instagram</p>
            <p className="pnl-kpi-value">{brl(resumo.meta.total)}</p>
            <p className="pnl-kpi-hint">{resumo.meta.qtd} vendas</p>
          </div>
          <div className="pnl-card">
            <p className="pnl-kpi-label">Ticket médio</p>
            <p className="pnl-kpi-value">{brl(ticket)}</p>
            <p className="pnl-kpi-hint">{resumo.direto.qtd} sem origem identificada</p>
          </div>
        </section>

        <PerfilPorRede orders={orders} />



        <section className="pnl-grid2">
          <div className="pnl-card">
            <h2 className="pnl-sec-title">Participação por origem</h2>
            <div className="pnl-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pizza} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {pizza.map((p) => (
                      <Cell key={p.src} fill={SRC_COLOR[p.src]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => brl(Number(v))}
                    contentStyle={{ background: "#10131a", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, color: "#f4f7ef" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pnl-legend">
              {pizza.map((p) => (
                <div className="pnl-legend-row" key={p.src}>
                  <span className="pnl-dot" style={{ background: SRC_COLOR[p.src] }} />
                  {p.name}
                  <strong>
                    {brl(p.value)} · {total ? Math.round((p.value / total) * 100) : 0}%
                  </strong>
                </div>
              ))}
              {!pizza.length ? <p className="pnl-empty">Nenhuma venda paga ainda.</p> : null}
            </div>
          </div>

          <div className="pnl-card">
            <h2 className="pnl-sec-title">Faturamento por dia</h2>
            <div className="pnl-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porDia}>
                  <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: "#9aa392", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9aa392", fontSize: 12 }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip
                    formatter={(v: number, n: string) => [brl(Number(v)), n === "tiktok" ? "TikTok" : n === "meta" ? "Facebook/Instagram" : "Sem origem"]}
                    contentStyle={{ background: "#10131a", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, color: "#f4f7ef" }}
                  />
                  <Bar dataKey="tiktok" stackId="a" fill={SRC_COLOR.tiktok} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="meta" stackId="a" fill={SRC_COLOR.meta} />
                  <Bar dataKey="direto" stackId="a" fill={SRC_COLOR.direto} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="pnl-card" ref={listaRef as React.RefObject<HTMLElement>}>
          <h2 className="pnl-sec-title">Pedidos pagos ({lista.length})</h2>
          <div className="pnl-tabs">
            {(["todas", "tiktok", "meta", "direto"] as const).map((f) => (
              <button
                key={f}
                className="pnl-tab"
                data-on={filtro === f ? "1" : "0"}
                onClick={() => {
                  setFiltro(f);
                  setPagina(1);
                }}
              >
                {f === "todas" ? "Todas" : SRC_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="pnl-tabs pnl-tabs-gen">
            {(["todos", "homem", "mulher", "indefinido"] as const).map((g) => (
              <button
                key={g}
                className="pnl-tab"
                data-on={filtroGenero === g ? "1" : "0"}
                data-gen={g}
                onClick={() => {
                  setFiltroGenero(g);
                  setPagina(1);
                }}
              >
                {g === "todos" ? "Todos os compradores" : GEN_LABEL[g]}
              </button>
            ))}
          </div>
          <div className="pnl-list">
            {itensPagina.map((o) => (
              <article className="pnl-row" key={o.orderId}>
                <div className="pnl-row-top">
                  <span className="pnl-row-name">{o.customerName}</span>
                  <span className="pnl-tag" data-src={o.source}>
                    {SRC_LABEL[o.source]}
                  </span>
                  {o.kind === "frete" ? (
                    <span className="pnl-tag" data-kind="frete">
                      Diferença de frete
                    </span>
                  ) : null}
                  <span className="pnl-tag" data-gen={o.gender}>
                    {GEN_LABEL[o.gender]}
                  </span>
                  <span className="pnl-row-amount">{brl(o.amount)}</span>
                </div>
                <div className="pnl-row-meta">
                  <span>Pago em {dataHora(o.paidAt ?? o.createdAt)}</span>
                  <span>{o.orderId}</span>
                  {o.shipMethod ? <span>Envio {o.shipMethod}</span> : null}
                  {o.campaign ? <span>Campanha {o.campaign}</span> : null}
                </div>
              </article>
            ))}
            {!lista.length ? <p className="pnl-empty">Nenhuma venda paga nesta combinação de filtros.</p> : null}
          </div>
          {totalPaginas > 1 ? (
            <div className="pnl-pager">
              <button className="pnl-tab" disabled={paginaAtual <= 1} onClick={() => mudarPagina(paginaAtual - 1)}>
                Anterior
              </button>
              <span className="pnl-pager-info">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                className="pnl-tab"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => mudarPagina(paginaAtual + 1)}
              >
                Próxima
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function PainelNav({ aba, setAba }: { aba: "vendas" | "pixels"; setAba: (value: "vendas" | "pixels") => void }) {
  return (
    <nav className="pnl-main-tabs" aria-label="Seções do painel">
      <button className="pnl-main-tab" data-on={aba === "vendas" ? "1" : "0"} onClick={() => setAba("vendas")}>Vendas</button>
      <button className="pnl-main-tab" data-on={aba === "pixels" ? "1" : "0"} onClick={() => setAba("pixels")}>Pixels Meta</button>
    </nav>
  );
}

function PixelManager({ password }: { password: string }) {
  const listPixels = useServerFn(getManagedMetaPixels);
  const addPixel = useServerFn(addManagedMetaPixel);
  const setActive = useServerFn(setManagedMetaPixelActive);
  const removePixel = useServerFn(removeManagedMetaPixel);
  const [pixels, setPixels] = useState<ManagedMetaPixel[]>([]);
  const [name, setName] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const result = await listPixels({ data: { password } });
    if (result.ok) setPixels(result.pixels);
  };

  useEffect(() => { void refresh(); }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await addPixel({ data: { password, name, pixelId, token } });
      if (!result.ok) {
        setMessage(result.reason === "duplicate" ? "Este Pixel já está configurado." : "Não foi possível validar o acesso.");
      } else {
        setName(""); setPixelId(""); setToken("");
        setMessage("Pixel salvo e ativado.");
        await refresh();
      }
    } catch { setMessage("Confira os dados e tente novamente."); }
    finally { setBusy(false); }
  };

  return (
    <>
      <header className="pnl-head">
        <div><h1 className="pnl-title">Pixels <span>Meta</span></h1><p className="pnl-sub">Gerencie os Pixels que recebem eventos e compras confirmadas.</p></div>
      </header>
      <section className="pnl-card">
        <h2 className="pnl-sec-title">Adicionar novo Pixel</h2>
        <form className="pnl-pixel-form" onSubmit={submit}>
          <label>Nome<input className="pnl-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Campanha principal" required /></label>
          <label>Pixel ID<input className="pnl-input" inputMode="numeric" value={pixelId} onChange={(event) => setPixelId(event.target.value.replace(/\D/g, ""))} placeholder="Somente números" required /></label>
          <label>Token da API<input className="pnl-input" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Token de acesso da Meta" required /></label>
          <button className="pnl-btn" type="submit" disabled={busy}>{busy ? "Salvando..." : "Adicionar Pixel"}</button>
        </form>
        {message ? <p className="pnl-pixel-message">{message}</p> : null}
      </section>
      <section className="pnl-card">
        <h2 className="pnl-sec-title">Pixels adicionais ({pixels.length})</h2>
        <div className="pnl-pixel-list">
          {pixels.map((pixel) => (
            <article className="pnl-pixel-row" key={pixel.id}>
              <div><strong>{pixel.name}</strong><span>{pixel.pixelId} · token protegido</span></div>
              <span className="pnl-pixel-status" data-active={pixel.isActive ? "1" : "0"}>{pixel.isActive ? "Ativo" : "Pausado"}</span>
              <button className="pnl-tab" onClick={async () => { await setActive({ data: { password, id: pixel.id, isActive: !pixel.isActive } }); await refresh(); }}>{pixel.isActive ? "Pausar" : "Ativar"}</button>
              <button className="pnl-tab pnl-danger-btn" onClick={async () => { if (!window.confirm(`Remover ${pixel.name}?`)) return; await removePixel({ data: { password, id: pixel.id } }); await refresh(); }}>Remover</button>
            </article>
          ))}
          {!pixels.length ? <p className="pnl-empty">Nenhum Pixel adicional cadastrado. Os dois Pixels atuais continuam ativos.</p> : null}
        </div>
      </section>
    </>
  );
}

const GEN_LABEL: Record<PainelGender, string> = {
  homem: "Homens",
  mulher: "Mulheres",
  indefinido: "Não identificado",
};
const GEN_COLOR: Record<PainelGender, string> = {
  homem: "#4aa8ff",
  mulher: "#ff5fa2",
  indefinido: "#9aa392",
};
const REDES: PainelSource[] = ["tiktok", "meta", "direto"];

function PerfilPorRede({ orders }: { orders: PainelOrder[] }) {
  const dados = useMemo(() => {
    return REDES.map((src) => {
      const lista = orders.filter((o) => o.source === src);
      const generos = (["mulher", "homem", "indefinido"] as PainelGender[]).map((g) => {
        const itens = lista.filter((o) => o.gender === g);
        return {
          gender: g,
          qtd: itens.length,
          total: itens.reduce((s, o) => s + o.amount, 0),
          pct: lista.length ? (itens.length / lista.length) * 100 : 0,
        };
      });
      return { src, qtd: lista.length, total: lista.reduce((s, o) => s + o.amount, 0), generos };
    }).filter((d) => d.qtd > 0);
  }, [orders]);

  if (!dados.length) return null;

  return (
    <section className="pnl-card">
      <h2 className="pnl-sec-title">Perfil dos compradores por rede</h2>
      <p className="pnl-sub pnl-gen-note">Estimativa pelo primeiro nome do comprador.</p>
      <div className="pnl-gen-grid">
        {dados.map((d) => (
          <div className="pnl-gen-card" key={d.src}>
            <div className="pnl-gen-head">
              <span className="pnl-dot" style={{ background: SRC_COLOR[d.src] }} />
              <strong>{SRC_LABEL[d.src]}</strong>
              <span className="pnl-gen-count">{d.qtd} vendas</span>
            </div>
            <div className="pnl-gen-bar">
              {d.generos
                .filter((g) => g.qtd > 0)
                .map((g) => (
                  <span
                    key={g.gender}
                    className="pnl-gen-seg"
                    style={{ width: `${g.pct}%`, background: GEN_COLOR[g.gender] }}
                    title={`${GEN_LABEL[g.gender]}: ${g.qtd}`}
                  />
                ))}
            </div>
            <div className="pnl-gen-rows">
              {d.generos.map((g) => (
                <div className="pnl-gen-row" key={g.gender}>
                  <span className="pnl-dot" style={{ background: GEN_COLOR[g.gender] }} />
                  <span className="pnl-gen-name">{GEN_LABEL[g.gender]}</span>
                  <span className="pnl-gen-pct">{Math.round(g.pct)}%</span>
                  <span className="pnl-gen-qtd">{g.qtd}</span>
                  <span className="pnl-gen-val">{brl(g.total)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
