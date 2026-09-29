import { createFileRoute } from "@tanstack/react-router";
import Funnel from "@/components/funnel/Funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Desafio iChef Shark · Escolha 3 peças" },
      {
        name: "description",
        content:
          "Responda 9 perguntas sobre sua rotina na cozinha e escolha 3 peças iChef Shark por R$ 0, pagando a entrega escolhida.",
      },
      { property: "og:title", content: "Desafio iChef Shark · Escolha 3 peças" },
      {
        property: "og:description",
        content:
          "9 perguntas rápidas sobre sua cozinha. Escolha 3 peças iChef Shark por R$ 0; você paga o envio.",
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
