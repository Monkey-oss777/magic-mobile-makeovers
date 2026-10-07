import { useState } from "react";
import { GTA_IMAGES as IMG } from "@/lib/gta-assets";

const SPECS = [
  { img: IMG.neon, alt: "Controle GTA VI Preto com jogo para PS5", t: "Edição Preta", d: "Palmeiras em relevo e acabamento que muda de cor, inspirado nas noites de Vice City." },
  { img: IMG.white, alt: "Controle GTA VI Branco com jogo para PS5", t: "Edição Branca", d: "O mesmo acabamento inspirado em Vice City, com detalhes claros e a identidade de GTA VI." },
  { img: IMG.neon, alt: "DualSense GTA VI", t: "Sinta a ação", d: "Resposta tátil e gatilhos adaptáveis do DualSense para acompanhar a ação de GTA VI no PS5." },
  { img: IMG.white, alt: "Controle PS5 com GTA VI", t: "Controle + jogo", d: "Um controle no modelo escolhido e uma cópia de GTA VI para PlayStation 5. Console não incluído." },
];

const FAQ = [
  { q: "O que vem no kit?", a: "Um controle DualSense GTA VI, na edição Preta ou Branca escolhida, mais o jogo GTA VI para PS5. Console não incluído. Nesta oferta, o kit sai por R$ 0; você paga o envio e os extras que selecionar." },
  { q: "Quando será enviado?", a: "O lançamento de GTA VI e dos controles está previsto para 19 de novembro de 2026. O envio desta oferta será após o lançamento, sujeito à disponibilidade na região. Não há entrega imediata." },
  { q: "Quais modelos posso escolher?", a: "Escolha um dos dois modelos apresentados: edição Preta ou edição Branca. Cada opção já inclui o jogo GTA VI para PS5." },
  { q: "O jogo funciona no PS4?", a: "Não. GTA VI foi anunciado para PlayStation 5 e Xbox Series X|S. O jogo deste kit é a versão para PS5." },
  { q: "Esta é uma promoção da Sony ou Rockstar?", a: "Não. Esta oferta é independente. Sony, PlayStation, DualSense e Grand Theft Auto são marcas de seus respectivos proprietários." },
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
        <h2 className="mst-h2">Vice City<br />nas suas mãos.</h2>
        <div className="mst-specs">{SPECS.map((s) => (
          <figure className="mst-spec" key={s.t}><span className="mst-spec-ph"><img src={s.img} alt={s.alt} loading="lazy" /></span><figcaption><b>{s.t}</b><span>{s.d}</span></figcaption></figure>
        ))}</div>
      </div></section>
      <section className="mst-sec"><div className="mst-wrap">
        <div className="mst-sec-label">// Grand Theft Auto VI</div>
        <h2 className="mst-h2">Bem-vindo<br />a Leonida.</h2>
        <div className="mst-specs">
          {[{ img: IMG.neon, alt: "Kit GTA VI Preto", t: "Jason e Lucia", d: "Uma dupla envolvida em uma conspiração que atravessa o estado de Leonida." }, { img: IMG.white, alt: "Kit GTA VI Branco", t: "De volta a Vice City", d: "A cidade retorna em uma nova história. Lançamento anunciado para 19/11/2026." }].map((s) => (
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
        <div className="mst-sec-label">// Seu próximo jogo</div><h2 className="mst-h2">Escolha o modelo.<br /><span className="mst-lime">Prepare seu PS5.</span></h2>
        <p className="mst-sub">Controle + jogo por R$ 0 nesta oferta. Você paga a entrega e os extras que adicionar. Envio após o lançamento previsto para 19/11/2026.</p>
        <button type="button" className="mst-cta" onClick={onCta}>Resgatar meu kit</button>
      </div></section>
    </>
  );
}
