import { createFileRoute } from "@tanstack/react-router";
import Funnel from "@/components/funnel/Funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Desafio Monster · Responda o Quiz e Leve o Copo 1,15L" },
      {
        name: "description",
        content:
          "Responda as 9 perguntas do Desafio Monster e leve o copo térmico 1,15L de aço inox por R$ 0. Você paga só a entrega rastreada. Lote limitado.",
      },
      { property: "og:title", content: "Desafio Monster · Copo Térmico 1,15L grátis" },
      {
        property: "og:description",
        content:
          "9 perguntas rápidas e o Copo Térmico Monster 1,15L de R$ 197 sai por R$ 0. Você paga só o envio.",
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
