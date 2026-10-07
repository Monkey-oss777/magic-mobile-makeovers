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
  porcaoP: svg(
    <>
      <path d="M15 14h10l-1.4 18a2 2 0 0 1-2 1.8h-3.2a2 2 0 0 1-2-1.8z" />
      <line x1="14" y1="14" x2="26" y2="14" />
    </>,
  ),
  porcaoM: svg(
    <>
      <path d="M13 10h14l-1.7 22.2a2 2 0 0 1-2 1.8h-6.6a2 2 0 0 1-2-1.8z" />
      <line x1="12" y1="10" x2="28" y2="10" />
      <line x1="14" y1="20" x2="26" y2="20" />
    </>,
  ),
  porcaoG: svg(
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

import { GTA_IMAGES as IMG } from "./gta-assets";
import { GTA_GAMES } from "./gta-games";

export const QUESTIONS: QuizQuestion[] = [
  { k: "SEU PERFIL", kind: "duo", p: "Você já jogou algum GTA?", o: [
    { t: "Sim, sou fã da série", s: "já tenho minhas histórias favoritas", icon: ICO.sim, tone: "ok" },
    { t: "Ainda não", s: "quero conhecer esse universo", icon: ICO.nao, tone: "no" },
  ] },
  { k: "NA SUA ROTINA", kind: "arte", p: "Em que momento você costuma jogar?", o: [
    { t: "Durante o dia", icon: ICO.sol }, { t: "À noite", icon: ICO.relogio },
    { t: "No fim de semana", icon: ICO.mesa }, { t: "Quando sobra tempo", icon: ICO.cafe },
  ] },
  { k: "TEMPO DE JOGO", kind: "arte", p: "Quanto tempo você joga em um dia típico?", o: [
    { t: "Até 1 hora", icon: ICO.porcaoP }, { t: "1 a 2 horas", icon: ICO.porcaoM },
    { t: "2 a 4 horas", icon: ICO.porcaoG }, { t: "Mais de 4 horas", icon: ICO.infinito },
  ] },
  { k: "SEU GTA FAVORITO", kind: "sabor", p: "Qual GTA é o seu favorito?", o: [
    ...GTA_GAMES.map((game) => ({ t: game.name, img: game.img })),
    { t: "Ainda não tenho favorito", icon: ICO.sim },
  ] },
  { k: "SEU ESTILO", kind: "arte", p: "O que você mais gosta de fazer em GTA?", o: [
    { t: "Seguir a história", icon: ICO.mochila }, { t: "Explorar o mapa", icon: ICO.mesa },
    { t: "Dirigir pela cidade", icon: ICO.carro }, { t: "Jogar com amigos", icon: ICO.cubo },
  ] },
  { k: "VICE CITY", kind: "arte", p: "O que mais chama sua atenção em GTA VI?", o: [
    { t: "Jason e Lucia", icon: ICO.mochila }, { t: "A nova Vice City", icon: ICO.sol },
    { t: "Explorar Leonida", icon: ICO.mesa }, { t: "Carros e perseguições", icon: ICO.carro },
  ] },
  { k: "SEU CONSOLE", kind: "duo", p: "Você já tem um PlayStation 5?", o: [
    { t: "Sim, já tenho", s: "meu PS5 está preparado", icon: ICO.sim, tone: "ok" },
    { t: "Ainda não", s: "está nos meus planos", icon: ICO.nao, tone: "no" },
  ] },
  { k: "O CONTROLE", kind: "grid", p: "Qual visual combina mais com seu setup?", o: [
    { t: "Preto · Noites de Vice City", img: IMG.neon },
    { t: "Branco · Amanhecer em Vice City", img: IMG.white },
  ] },
  { k: "ÚLTIMA MISSÃO", kind: "arte", p: "O que você faria primeiro em GTA VI?", o: [
    { t: "Começar as missões", icon: ICO.sim }, { t: "Conhecer Vice City", icon: ICO.sol },
    { t: "Pegar um carro", icon: ICO.carro }, { t: "Explorar sem pressa", icon: ICO.infinito },
  ] },
];

export const SHIPPING = [
  { id: "pac", name: "Entrega padrão · PAC", eta: "7 a 12 dias úteis · com rastreio", cost: 9.9, was: 18.9 },
  { id: "sedex", name: "Expresso · SEDEX", eta: "2 a 5 dias úteis · com rastreio", cost: 18.94 },
] as const;

export const BUMP_CASE = 19.9;
export const BUMP_GRIPS = 9.9;
