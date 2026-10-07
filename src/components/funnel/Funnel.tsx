import FunnelButton from "@/components/funnel/FunnelButton";
import { useEffect, useRef, useState } from "react";
import { QUESTIONS, type QuizOption } from "@/lib/quiz-data";
import { getPayVariant, track, type PayVariant } from "@/lib/ab";
import { ttPageView, ttParams, ttTrack } from "@/lib/tiktok";
import { fbPageView, fbParams, fbTrack, fbTrackCustom } from "@/lib/meta";
import AfterSections from "./AfterSections";
import { GTA_IMAGES as IMG } from "@/lib/gta-assets";
import { PRIZE_PRODUCTS, hasSelectedModel, selectModel } from "@/lib/prize-products";
import Checkout from "./Checkout";

type Screen = "intro" | "quiz" | "analise" | "premio";


export default function Funnel() {
  const [variant, setVariant] = useState<PayVariant>("pix");
  const [screen, setScreen] = useState<Screen>("intro");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [loadPct, setLoadPct] = useState(0);
  const [doneSteps, setDoneSteps] = useState(0);
  const [hold, setHold] = useState(600);
  const [checkout, setCheckout] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const answers = useRef<{ pergunta: string; resposta: string }[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const v = getPayVariant();
    setVariant(v);
    track("funnel_view", v);
    ttPageView({ content_name: "Quiz Controle PS5 GTA VI + Jogo" });
    fbPageView({ content_name: "Quiz Controle PS5 GTA VI + Jogo" });
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (screen !== "premio") return;
    const t = window.setInterval(() => setHold((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [screen]);

  useEffect(() => {
    document.body.style.overflow = checkout ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [checkout]);

  const q = QUESTIONS[idx];
  const progress = (idx / QUESTIONS.length) * 100;
  const holdTxt =
    String(Math.floor(hold / 60)).padStart(2, "0") + ":" + String(hold % 60).padStart(2, "0");

  function toScreen(s: Screen) {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function start() {
    track("quiz_start", variant);
    ttTrack("ClickButton", ttParams(0, { content_name: "Iniciar quiz" }));
    fbTrackCustom("QuizStart", fbParams(0, { content_name: "Iniciar quiz" }));
    toScreen("quiz");
  }

  function answer(i: number) {
    if (picked !== null || !q) return;
    const op = q.o[i];
    if (!op) return;
    setPicked(i);
    answers.current.push({ pergunta: q.p, resposta: op.t });
    track("quiz_answer", variant, { step: idx + 1, question_key: q.k, answer: op.t });
    fbTrackCustom("QuizAnswer", fbParams(0, { step: idx + 1, question_key: q.k, answer: op.t }));
    timers.current.push(
      window.setTimeout(() => {
        setPicked(null);
        if (idx + 1 < QUESTIONS.length) {
          setIdx(idx + 1);
        } else {
          setIdx(QUESTIONS.length);
          runAnalise();
        }
      }, 330),
    );
  }

  function runAnalise() {
    toScreen("analise");
    setLoadPct(0);
    setDoneSteps(0);
    const seq: [number, number, number][] = [
      [220, 38, 1],
      [1100, 72, 2],
      [2000, 100, 3],
    ];
    seq.forEach(([ms, pct, st]) => {
      timers.current.push(
        window.setTimeout(() => {
          setLoadPct(pct);
          setDoneSteps(st);
        }, ms),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        track("quiz_complete", variant, { answers: answers.current.length });
        ttTrack("SubmitForm", ttParams(0, { content_name: "Quiz concluído" }));
        fbTrack("Lead", fbParams(0, { content_name: "Quiz concluído" }));
        toScreen("premio");
      }, 2800),
    );
  }

  function openCheckout() {
    if (!hasSelectedModel(picks)) {
      document.getElementById("mst-escolha")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    track("checkout_click", variant, { picks: picks.join(",") });
    ttTrack("AddToCart", ttParams(0, { content_name: "Resgatar prêmio" }));
    fbTrack("AddToCart", fbParams(0, { content_name: "Resgatar prêmio" }));
    setCheckout(true);
  }

  function togglePick(id: string) {
    setPicks((current) => selectModel(current, id));
  }

  function renderOption(op: QuizOption, i: number) {
    const isPicked = picked === i;
    const base = "mst-opt" + (isPicked ? " is-picked" : "");
    if (q?.kind === "duo") {
      return (
        <FunnelButton
          key={op.t}
          type="button"
          className={`${base} ${op.tone === "no" ? "is-no" : ""}`}
          onClick={() => answer(i)}
        >
          <span className="mst-opt-ico">{op.icon}</span>
          <span className="mst-opt-txt">
            {op.t}
            {op.s && <small>{op.s}</small>}
          </span>
        </FunnelButton>
      );
    }
    return (
      <FunnelButton
        key={op.t}
        type="button"
        className={`${base} mst-opt-col`}
        onClick={() => answer(i)}
      >
        {op.img ? (
          <span className="mst-opt-img">
            <img src={op.img} alt="" loading="lazy" />
          </span>
        ) : (
          <span className="mst-opt-ico">{op.icon}</span>
        )}
        <span className="mst-opt-txt">{op.t}</span>
      </FunnelButton>
    );
  }

  const falta = QUESTIONS.length - idx;

  return (
    <div className="mst">
      <header className="mst-top">
        <div className="mst-top-in">
          <span>Desafio GTA VI · Controle PS5 + Jogo</span>
        </div>
        <div className="mst-top-bar" style={{ width: `${progress}%` }} />
      </header>

      <section className="mst-stage">
        <div className="mst-wrap">
          {/* ══ INTRO ══ */}
          <div className={"mst-screen" + (screen === "intro" ? " is-on" : "")}>
            <img src={IMG.logo} alt="Sony PlayStation" className="mst-logo" />
            <div className="mst-kicker">O desafio de hoje</div>
            <h1 className="mst-h1">
              Controle PS5 GTA VI
              <br />
              + Jogo GTA VI
              <br />
              <span className="mst-lime">grátis</span>
            </h1>
            <p className="mst-sub">
              9 perguntas rápidas sobre o universo GTA. Ao final, descubra se ganhou seu modelo de controle PS5 GTA VI + Jogo GTA VI por R$ 0,00.
            </p>

            <div className="mst-hero-ph">
              <img
                src={IMG.neon}
                alt="Controle PS5 GTA VI Preto + Jogo GTA VI"
              />
              <span className="mst-tag">R$ 0,00</span>
              <img src={IMG.white} alt="Controle PS5 GTA VI Branco + Jogo GTA VI" />
            </div>

            <FunnelButton type="button" className="mst-cta" onClick={start}>
              Começar o desafio
            </FunnelButton>

            <div className="mst-facts">
              <span>9 perguntas</span>
              <i>/</i>
              <span>1 minuto</span>
              <i>/</i>
              <span>Controle + jogo</span>
            </div>
          </div>

          {/* ══ QUIZ ══ */}
          <div className={"mst-screen" + (screen === "quiz" ? " is-on" : "")}>
            {q && (
              <>
                <div className="mst-hud">
                  <div className="mst-hud-top">
                    <span>
                      Pergunta <b>{idx + 1}</b> de {QUESTIONS.length}
                    </span>
                    <span className="mst-lock">
                      {falta > 1 ? `Faltam ${falta} respostas` : "Falta 1 resposta"}
                    </span>
                  </div>
                  <div className="mst-bar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mst-card">
                  <div className="mst-kicker">{q.k}</div>
                  <h2 className="mst-q">{q.p}</h2>
                  <div className={`mst-opts is-${q.kind}${q.k === "SEU GTA FAVORITO" ? " mst-game-grid" : ""}`}>{q.o.map(renderOption)}</div>
                </div>

                <p className="mst-foot">
                  Não existe resposta errada — só precisa responder todas.
                </p>
              </>
            )}
          </div>

          {/* ══ ANÁLISE ══ */}
          <div className={"mst-screen" + (screen === "analise" ? " is-on" : "")}>
            <div className="mst-kicker">Conferindo</div>
            <h2 className="mst-h1">
              Validando
              <br />
              <span className="mst-lime">suas respostas</span>
            </h2>
            <div className="mst-load">
              <span style={{ width: `${loadPct}%` }} />
            </div>
            <ul className="mst-steps">
              {[
                "Conferindo suas 9 respostas",
                "Conferindo suas preferências de jogo",
                "Preparando a escolha do seu modelo",
              ].map((s, i) => (
                <li key={s} className={doneSteps > i ? "is-done" : ""}>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* ══ PRÊMIO ══ */}
          <div className={"mst-screen" + (screen === "premio" ? " is-on" : "")}>
            <div className="mst-win">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Desafio completo
            </div>

            <h2 className="mst-h1">
              Desafio concluído
              <br />
              Controle + GTA VI
              <br />
              <span className="mst-lime">grátis</span>
            </h2>

            <div className="mst-palco">
              <img
                src={IMG.neon}
                alt="Controle PS5 GTA VI Preto com jogo"
              />
              <div className="mst-selo">
                <span>Controle + jogo</span>
                <b>R$ 0</b>
              </div>
            </div>

            <div className="mst-prize-name">
              Escolha seu controle + GTA VI
              <span>Escolha a edição Preta ou Branca. Cada kit inclui um controle e o jogo para PS5.</span>
            </div>

            <div className="mst-pick" id="mst-escolha">
              <div className="mst-kicker">Escolha seu modelo</div>
              <div className="mst-pick-grid">
                {PRIZE_PRODUCTS.map((product) => {
                  const selected = picks.includes(product.id);
                  return (
                    <FunnelButton
                      key={product.id}
                      type="button"
                      className={"mst-pick-card" + (selected ? " is-on" : "")}
                      aria-pressed={selected}
                      onClick={() => togglePick(product.id)}
                    >
                      <span className="mst-pick-img"><img src={product.img} alt="" loading="lazy" /></span>
                      <span className="mst-pick-t">{product.name}</span>
                      <span className="mst-pick-chk" aria-hidden="true">{selected ? "✓" : ""}</span>
                    </FunnelButton>
                  );
                })}
              </div>
              <p className="mst-pick-hint" aria-live="polite">
                {hasSelectedModel(picks) ? "Modelo escolhido — controle e jogo no seu kit." : "Selecione um dos dois modelos para continuar."}
              </p>
            </div>

            <ul className="mst-mini">
              <li>
                <b>PS5</b>
                <span>plataforma</span>
              </li>
              <li>
                <b>2</b>
                <span>modelos</span>
              </li>
              <li>
                <b>GTA VI</b>
                <span>jogo incluído</span>
              </li>
            </ul>

            <div className="mst-reserva">
              <span>Reservado no seu nome por</span>
              <b>{holdTxt}</b>
            </div>

            <FunnelButton type="button" className="mst-cta" disabled={!hasSelectedModel(picks)} onClick={openCheckout}>
              {hasSelectedModel(picks) ? "Resgatar meu kit" : "Escolha seu modelo"}
            </FunnelButton>
          </div>
        </div>
      </section>

      {screen === "premio" && <AfterSections onCta={openCheckout} />}

      {checkout && <Checkout variant={variant} picks={picks} onClose={() => setCheckout(false)} />}
    </div>
  );
}
