import type { ReactNode } from "react";

export type OptionKind = "duo" | "arte" | "sabor" | "grid";

export interface QuizOption {
  t: string;
  s?: string;
  img?: string;
  icon?: ReactNode;
  tone?: "ok" | "no";
}

export interface QuizQuestion {
  k: string;
  kind: OptionKind;
  p: string;
  o: QuizOption[];
}

const svg = (children: ReactNode) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const ICO = {
  sim: svg(<polyline points="8 21 17 29 32 12" />),
  nao: svg(
    <>
      <line x1="11" y1="11" x2="29" y2="29" />
      <line x1="29" y1="11" x2="11" y2="29" />
    </>,
  ),
  halter: svg(
    <>
      <line x1="6" y1="20" x2="34" y2="20" />
      <rect x="9" y="13" width="5" height="14" rx="1.6" />
      <rect x="26" y="13" width="5" height="14" rx="1.6" />
    </>,
  ),
  mesa: svg(
    <>
      <rect x="5" y="9" width="30" height="18" rx="2.5" />
      <line x1="14" y1="33" x2="26" y2="33" />
      <line x1="20" y1="27" x2="20" y2="33" />
    </>,
  ),
  carro: svg(
    <>
      <path d="M6 25v-5l3-7h22l3 7v5" />
      <line x1="6" y1="25" x2="34" y2="25" />
      <circle cx="12" cy="28" r="3" />
      <circle cx="28" cy="28" r="3" />
    </>,
  ),
  mochila: svg(
    <>
      <path d="M11 15a9 9 0 0 1 18 0v18a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2z" />
      <path d="M16 23h8v6h-8z" />
    </>,
  ),
  gota: svg(<path d="M20 5C20 5 9 17.5 9 24a11 11 0 0 0 22 0C31 17.5 20 5 20 5z" />),
  relogio: svg(
    <>
      <circle cx="20" cy="21" r="14" />
      <polyline points="20 13 20 21 26 24" />
      <line x1="15" y1="4" x2="25" y2="4" />
    </>,
  ),
  sol: svg(
    <>
      <circle cx="20" cy="20" r="7" />
      <line x1="20" y1="3" x2="20" y2="8" />
      <line x1="20" y1="32" x2="20" y2="37" />
      <line x1="3" y1="20" x2="8" y2="20" />
      <line x1="32" y1="20" x2="37" y2="20" />
      <line x1="8" y1="8" x2="11.5" y2="11.5" />
      <line x1="28.5" y1="28.5" x2="32" y2="32" />
      <line x1="8" y1="32" x2="11.5" y2="28.5" />
      <line x1="28.5" y1="11.5" x2="32" y2="8" />
    </>,
  ),
  cubo: svg(
    <>
      <rect x="6" y="6" width="17" height="17" rx="3" />
      <rect x="17" y="17" width="17" height="17" rx="3" />
    </>,
  ),
  proibido: svg(
    <>
      <circle cx="20" cy="20" r="14" />
      <line x1="10" y1="30" x2="30" y2="10" />
    </>,
  ),
  copoP: svg(
    <>
      <path d="M15 14h10l-1.4 18a2 2 0 0 1-2 1.8h-3.2a2 2 0 0 1-2-1.8z" />
      <line x1="14" y1="14" x2="26" y2="14" />
    </>,
  ),
  copoM: svg(
    <>
      <path d="M13 10h14l-1.7 22.2a2 2 0 0 1-2 1.8h-6.6a2 2 0 0 1-2-1.8z" />
      <line x1="12" y1="10" x2="28" y2="10" />
      <line x1="14" y1="20" x2="26" y2="20" />
    </>,
  ),
  copoG: svg(
    <>
      <path d="M11 7h18l-2 26.2a2 2 0 0 1-2 1.8H15a2 2 0 0 1-2-1.8z" />
      <line x1="10" y1="7" x2="30" y2="7" />
      <path d="M29 13h4a3 3 0 0 1 0 6h-3.6" />
    </>,
  ),
  infinito: svg(
    <path d="M14 14a6 6 0 1 0 0 12c4 0 6-4 6-6s2-6 6-6a6 6 0 1 1 0 12c-4 0-6-4-6-6" />,
  ),
  cafe: svg(
    <>
      <path d="M8 15h20v10a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" />
      <path d="M28 18h3a4 4 0 0 1 0 8h-3" />
      <line x1="14" y1="6" x2="14" y2="10" />
      <line x1="21" y1="5" x2="21" y2="10" />
    </>,
  ),
  garrafa: svg(
    <>
      <path d="M17 5h6v6l3.5 5.5V33a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V16.5L17 11z" />
      <line x1="13.5" y1="22" x2="26.5" y2="22" />
    </>,
  ),
};

const A = "/copo-quiz/assets";

export const QUESTIONS: QuizQuestion[] = [
  {
    k: "ROTINA",
    kind: "duo",
    p: "Sua bebida esquenta antes de você terminar?",
    o: [
      { t: "Sim, sempre", s: "no fim já está morna", icon: ICO.sim, tone: "ok" },
      { t: "Não", s: "eu bebo rápido", icon: ICO.nao, tone: "no" },
    ],
  },
  {
    k: "DIA A DIA",
    kind: "arte",
    p: "Onde o copo ia te salvar mais?",
    o: [
      { t: "Na academia", icon: ICO.halter },
      { t: "No trabalho", icon: ICO.mesa },
      { t: "No carro", icon: ICO.carro },
      { t: "Na faculdade", icon: ICO.mochila },
    ],
  },
  {
    k: "CONSUMO",
    kind: "sabor",
    p: "Quantas latas você toma por semana?",
    o: [
      { t: "1 a 2", img: `${A}/latas-1.png` },
      { t: "3 a 5", img: `${A}/latas-2.png` },
      { t: "6 a 10", img: `${A}/latas-3.png` },
      { t: "Mais de 10", img: `${A}/latas-4.png` },
    ],
  },
  {
    k: "SABOR",
    kind: "sabor",
    p: "Qual é o seu sabor favorito?",
    o: [
      { t: "Original", img: `${A}/lata-original.png` },
      { t: "Mango Loco", img: `${A}/lata-mango.png` },
      { t: "Ultra", img: `${A}/lata-ultra.png` },
      { t: "Pacific Punch", img: `${A}/lata-pacific.png` },
    ],
  },
  {
    k: "HOJE",
    kind: "arte",
    p: "Quanto tempo o gelo dura no copo que você usa hoje?",
    o: [
      { t: "Menos de 1 hora", icon: ICO.gota },
      { t: "Uma manhã", icon: ICO.relogio },
      { t: "O dia todo", icon: ICO.sol },
      { t: "Não uso copo térmico", icon: ICO.proibido },
    ],
  },
  {
    k: "O PRÊMIO",
    kind: "grid",
    p: "Qual detalhe do copo te ganhou?",
    o: [
      { t: "Tampa com canudo", img: `${A}/copo-tampa.png` },
      { t: "Inox por dentro", img: `${A}/copo-corte.png` },
      { t: "Chaveiro na alça", img: `${A}/copo-alca.png` },
      { t: "O copo inteiro", img: `${A}/copo-frente.png` },
    ],
  },
  {
    k: "JÁ ACONTECEU",
    kind: "duo",
    p: "Já vazou bebida dentro da sua mochila?",
    o: [
      { t: "Já", s: "mais de uma vez", icon: ICO.sim, tone: "ok" },
      { t: "Nunca", s: "e não quero começar", icon: ICO.nao, tone: "no" },
    ],
  },
  {
    k: "TAMANHO",
    kind: "arte",
    p: "Qual tamanho combina com o seu dia?",
    o: [
      { t: "500 ml", icon: ICO.copoP },
      { t: "1 litro", icon: ICO.copoM },
      { t: "1,15 litro", icon: ICO.copoG },
      { t: "Quanto maior, melhor", icon: ICO.infinito },
    ],
  },
  {
    k: "ÚLTIMA",
    kind: "arte",
    p: "Com o que você encheria o copo no primeiro dia?",
    o: [
      { t: "Energético gelado", icon: ICO.cubo },
      { t: "Água com gelo", icon: ICO.gota },
      { t: "Café gelado", icon: ICO.cafe },
      { t: "Suco ou isotônico", icon: ICO.garrafa },
    ],
  },
];

export const SHIPPING = [
  {
    id: "pac",
    name: "Entrega padrão · PAC",
    eta: "7 a 12 dias úteis · com rastreio",
    cost: 9.9,
    was: 18.9,
  },
  {
    id: "sedex",
    name: "Expresso · SEDEX",
    eta: "2 a 5 dias úteis · com rastreio",
    cost: 18.94,
  },
] as const;

export const BUMP_COPO = 19.9;
export const BUMP_FARDO = 9.9;
