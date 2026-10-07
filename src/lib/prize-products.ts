import { GTA_IMAGES as IMG } from "./gta-assets";

export const PRIZE_PRODUCTS = [
  { id: "gta-vi-black", name: "Controle GTA VI Preto + Jogo GTA VI", img: IMG.neon },
  { id: "gta-vi-white", name: "Controle GTA VI Branco + Jogo GTA VI", img: IMG.white },
] as const;

export function selectModel(current: string[], id: string): string[] {
  if (!PRIZE_PRODUCTS.some((product) => product.id === id)) return current;
  return current.includes(id) ? [] : [id];
}

export function hasSelectedModel(picks: string[]): boolean {
  return picks.length === 1 && PRIZE_PRODUCTS.some((product) => product.id === picks[0]);
}