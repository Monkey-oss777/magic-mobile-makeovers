import { useState } from "react";
import { ICHEF_IMAGES as IMG } from "@/lib/ichef-assets";

const SPECS = [
  { img: IMG.panelaGrande, alt: "Panela grande iChef Shark", t: "Escolha suas peças", d: "Selecione três entre frigideiras, panelas e caçarola para compor seu pedido." },
  { img: IMG.frigideiraGrande, alt: "Frigideira Shark", t: "Frigideiras para cada receita", d: "Escolha o tamanho mais adequado para grelhar, dourar ou preparar uma porção rápida." },
  { img: IMG.cacarola, alt: "Caçarola Shark com tampa", t: "Tampas de vidro", d: "Acompanhe o preparo sem abrir a panela a todo momento." },
  { img: IMG.panelaPequena, alt: "Panela pequena Shark", t: "Acabamento azul e preto", d: "O visual da linha Shark em peças que combinam na cozinha." },
];

const FAQ = [
  { q: "As três peças saem por R$ 0 mesmo?", a: "Nesta oferta do desafio, você escolhe três peças por R$ 0. Você paga o envio na próxima etapa. Extras são opcionais e têm preço indicado antes de pagar." },
  { q: "Quais peças posso escolher?", a: "Você pode escolher três entre frigideira pequena, frigideira grande, panela pequena, panela grande e caçarola." },
  { q: "Tem mensalidade ou assinatura?", a: "Não. O pagamento mostrado na próxima etapa é único, sem assinatura." },
  { q: "Quais são as opções de entrega?", a: "Você pode escolher PAC ou SEDEX. Os valores e prazos estimados aparecem antes da geração do PIX." },
  { q: "Posso adicionar acessórios?", a: "Sim. Os acessórios opcionais aparecem no pagamento com seus preços individuais." },
];

export default function AfterSections({ onCta }: { onCta: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <section className="mst-sec"><div className="mst-wrap">
        <div className="mst-sec-label">// O que você ganhou</div>
        <h2 className="mst-h2">Uma cozinha<br />mais completa.</h2>
        <div className="mst-specs">{SPECS.map((s) => (
          <figure className="mst-spec" key={s.t}><span className="mst-spec-ph"><img src={s.img} alt={s.alt} loading="lazy" /></span><figcaption><b>{s.t}</b><span>{s.d}</span></figcaption></figure>
        ))}</div>
      </div></section>
      <section className="mst-sec"><div className="mst-wrap">
        <div className="mst-sec-label">// Para sua rotina</div>
        <h2 className="mst-h2">Do café ao jantar.</h2>
        <div className="mst-specs">
          {[{ img: IMG.frigideiraPequena, alt: "Frigideira pequena", t: "Porções rápidas", d: "Para preparar ovos, tapiocas e refeições menores." }, { img: IMG.cacarola, alt: "Caçarola com tampa", t: "Receitas para compartilhar", d: "Mais espaço para refogados, molhos e refeições em família." }].map((s) => (
            <figure className="mst-spec" key={s.t}><span className="mst-spec-ph"><img src={s.img} alt={s.alt} loading="lazy" /></span><figcaption><b>{s.t}</b><span>{s.d}</span></figcaption></figure>
          ))}
        </div>
      </div></section>
      <section className="mst-sec"><div className="mst-wrap">
        <div className="mst-sec-label">// Dúvidas do desafio</div><h2 className="mst-h2">Antes de resgatar.</h2>
        <div className="mst-faq">{FAQ.map((item, i) => (
          <div className="mst-faq-item" key={item.q}><button type="button" className="mst-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{item.q}<i>{open === i ? "−" : "+"}</i></button>{open === i && <div className="mst-faq-a">{item.a}</div>}</div>
        ))}</div>
      </div></section>
      <section className="mst-sec"><div className="mst-wrap" style={{ textAlign: "center" }}>
        <div className="mst-sec-label">// Última chamada</div><h2 className="mst-h2">Suas peças estão<br /><span className="mst-lime">reservadas.</span></h2>
        <p className="mst-sub">Suas três peças saem por R$ 0. Você paga apenas a entrega escolhida e os acessórios que adicionar.</p>
        <button type="button" className="mst-cta" onClick={onCta}>Resgatar minhas peças</button>
      </div></section>
    </>
  );
}
