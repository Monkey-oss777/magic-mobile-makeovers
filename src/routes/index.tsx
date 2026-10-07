import { createFileRoute } from "@tanstack/react-router";
import Funnel from "@/components/funnel/Funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Desafio GTA VI · Controle PS5 + Jogo" },
      {
        name: "description",
        content:
          "Responda 9 perguntas sobre GTA e escolha um controle PS5 GTA VI Preto ou Branco com o jogo. Envio após o lançamento previsto para 19/11/2026.",
      },
      { property: "og:title", content: "Desafio GTA VI · Controle PS5 + Jogo" },
      {
        property: "og:description",
        content:
          "Desafio GTA VI com dois modelos de controle PS5 e jogo incluído. Envio após o lançamento de 19/11/2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      <Funnel />
    </main>
  );
}
