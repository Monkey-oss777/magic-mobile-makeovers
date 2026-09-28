import { useState } from "react";

const A = "/copo-quiz/assets";

const SPECS = [
  {
    img: `${A}/copo-corte.png`,
    alt: "Corte do copo Monster mostrando as camadas da parede",
    t: "24 horas de gelo",
    d: "Parede dupla a vácuo com blindagem cor de cobre. Enche de manhã, o gelo continua lá à noite.",
  },
  {
    img: `${A}/copo-tampa.png`,
    alt: "Tampa do copo Monster com canudo de aço e trava de silicone",
    t: "Tampa que trava",
    d: "Canudo de aço removível e trava de silicone. Deita na mochila sem molhar nada.",
  },
  {
    img: `${A}/copo-alca.png`,
    alt: "Alça do copo Monster com chaveiro duplo",
    t: "Chaveiro na alça",
    d: "Latinha de metal e a garra na corrente escurecida, já presas na alça — não é brinde solto na caixa.",
  },
  {
    img: `${A}/copo-aberto.png`,
    alt: "Copo térmico Monster 1,15L visto de frente",
    t: "1,15 litro",
    d: "Base de 7 cm que entra no porta-copos do carro e alça pra carregar com uma mão só.",
  },
];

const REVS = [
  {
    img: `${A}/rev-beatriz.jpg`,
    alt: "Beatriz com o copo térmico Monster",
    p: "Fiz o desafio achando que era pegadinha. Chegou em 9 dias, com nota fiscal e tudo. Botei gelo às 7h, às 22h ainda tinha pedra.",
    n: "Beatriz M. · Curitiba, PR",
  },
  {
    img: `${A}/rev-rafael.jpg`,
    alt: "Rafael com o copo térmico Monster",
    p: "Levo pra academia todo dia pendurado no dedo pela alça. O chaveiro da latinha é o detalhe que todo mundo pergunta onde eu comprei.",
    n: "Rafael S. · Guarulhos, SP",
  },
  {
    img: `${A}/rev-diegos.jpg`,
    alt: "Diego com o copo térmico Monster",
    p: "Trabalho na rua o dia inteiro. Encho de água gelada às 6h e às 18h ainda está gelada. E cabe no porta-copos da caminhonete.",
    n: "Diego A. · Belo Horizonte, MG",
  },
];

const FAQ = [
  {
    q: "O copo é grátis mesmo?",
    a: "É. Quem completa as 9 perguntas libera o copo sem pagar nada pelo produto: R$ 0 por um copo que sai R$ 197 no varejo. O lote do desafio é limitado e cada pessoa leva uma unidade.",
  },
  {
    q: "Por que vocês dão o copo?",
    a: "É um lote promocional pra colocar o copo na mão de quem bebe energético todo dia. Sai mais barato pra gente do que anúncio: quem anda com o copo por aí divulga sozinho.",
  },
  {
    q: "Tem mensalidade ou assinatura?",
    a: "Não. É pagamento único, sem assinatura e sem cobrança recorrente.",
  },
  {
    q: "Em quanto tempo chega?",
    a: "Sai do estoque em até 24 horas úteis. A entrega padrão leva de 7 a 12 dias úteis e a expressa de 2 a 5. O código de rastreio vai pro seu e-mail.",
  },
  {
    q: "Posso resgatar mais de um?",
    a: "O prêmio é um por pessoa. No checkout aparece a opção de levar um segundo copo por um valor simbólico, na mesma caixa.",
  },
  {
    q: "E se eu não gostar?",
    a: "Você tem 30 dias. Se chegar com defeito ou não for o que você esperava, resolvemos na hora e a coleta fica por nossa conta.",
  },
];

export default function AfterSections({ onCta }: { onCta: () => void }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <section className="mst-sec">
        <div className="mst-wrap">
          <div className="mst-sec-label">// O que você ganhou</div>
          <h2 className="mst-h2">
            Não é brinde
            <br />
            de plástico.
          </h2>
          <div className="mst-specs">
            {SPECS.map((s) => (
              <figure className="mst-spec" key={s.t}>
                <span className="mst-spec-ph">
                  <img src={s.img} alt={s.alt} loading="lazy" />
                </span>
                <figcaption>
                  <b>{s.t}</b>
                  <span>{s.d}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mst-sec">
        <div className="mst-wrap">
          <div className="mst-sec-label">// Quem já resgatou</div>
          <h2 className="mst-h2">
            Chegou, e é
            <br />
            o copo mesmo.
          </h2>
          <div className="mst-revs">
            {REVS.map((r) => (
              <figure className="mst-rev" key={r.n}>
                <img src={r.img} alt={r.alt} loading="lazy" />
                <figcaption>
                  <div className="mst-rev-stars" aria-label="5 de 5 estrelas">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p>{r.p}</p>
                  <b>{r.n}</b>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mst-sec">
        <div className="mst-wrap">
          <div className="mst-sec-label">// Dúvidas do desafio</div>
          <h2 className="mst-h2">Antes de resgatar.</h2>
          <div className="mst-faq">
            {FAQ.map((item, i) => (
              <div className="mst-faq-item" key={item.q}>
                <button
                  type="button"
                  className="mst-faq-q"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  {item.q}
                  <i>{open === i ? "−" : "+"}</i>
                </button>
                {open === i && <div className="mst-faq-a">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mst-sec">
        <div className="mst-wrap" style={{ textAlign: "center" }}>
          <div className="mst-sec-label">// Última chamada</div>
          <h2 className="mst-h2">
            Seu copo está
            <br />
            <span className="mst-lime">reservado.</span>
          </h2>
          <p className="mst-sub">
            O produto sai por R$ 0. Você paga apenas a entrega rastreada até a sua casa.
          </p>
          <button type="button" className="mst-cta" onClick={onCta}>
            Resgatar meu copo
          </button>
          <p className="mst-company">
            <strong>Monster Energy Brasil Comércio de Bebidas Ltda.</strong>
            CNPJ 10.905.379/0001-32
          </p>
        </div>
      </section>
    </>
  );
}
