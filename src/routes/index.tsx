import { createFileRoute } from "@tanstack/react-router";
import Funnel from "@/components/funnel/Funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Desafio iChef Shark · Conjunto de Panelas 7 Peças" },
      {
        name: "description",
        content:
          "Responda 9 perguntas sobre sua rotina na cozinha e resgate o Conjunto iChef Shark 7 peças por R$ 0, pagando apenas a entrega escolhida.",
      },
      { property: "og:title", content: "Desafio iChef Shark · Conjunto 7 peças" },
      {
        property: "og:description",
        content:
          "9 perguntas rápidas sobre sua cozinha. O conjunto iChef Shark 7 peças sai por R$ 0; você paga o envio.",
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
