"use client";

import { useMemo, useState } from "react";

const quickQuestions = [
  "Comment vendre sur Mache ?",
  "Quels moyens de paiement sont prévus ?",
  "Comment vérifier un agent ?",
  "Comment fonctionne l’export ?"
];

function getAssistantReply(input: string) {
  const q = input.toLowerCase();

  if (q.includes("vendre") || q.includes("vendeur")) {
    return "Mache permet aux particuliers, vendeurs business et fournisseurs de vendre. L’architecture prévoit validation vendeur, wallet, payouts, promotions, commandes et shipping.";
  }

  if (q.includes("paiement") || q.includes("payer")) {
    return "Le site est prêt pour Stripe en phase 1, PayPal en phase 2, méthodes locales en phase 3, ainsi que cash on delivery.";
  }

  if (q.includes("agent") || q.includes("vérifier")) {
    return "La page Verify Agent permet de saisir un code agent pour voir son nom, sa zone, son statut actif/suspendu/expiré et sa date de validité.";
  }

  if (q.includes("export")) {
    return "Mache prévoit une logique export avec fournisseurs, conformité, paiements, shipping international et structure de suivi.";
  }

  return "Je peux vous aider sur la boutique, la vente, les paiements, l’export, les agents vérifiables et les fonctionnalités marketplace Mache.";
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; text: string }>>([
    {
      role: "ai",
      text: "Bonjour. Je suis l’assistant Mache. Je peux vous aider sur la boutique, les vendeurs, l’export et la plateforme."
    }
  ]);

  const disabled = useMemo(() => input.trim().length === 0, [input]);

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: value },
      { role: "ai", text: getAssistantReply(value) }
    ]);
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[var(--mache-dark)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-medium)] transition hover:-translate-y-0.5"
      >
        💬 Assistant Mache
      </button>

      {open ? (
        <div className="fixed bottom-20 right-5 z-40 flex w-[min(360px,calc(100%-24px))] flex-col overflow-hidden rounded-[20px] border border-[var(--mache-line)] bg-[var(--mache-white)] shadow-[var(--shadow-medium)]">
          <div className="flex items-center justify-between bg-[var(--mache-dark)] px-4 py-3 text-white">
            <div>
              <h4 className="text-sm font-bold">Assistant IA Mache</h4>
              <div className="text-[11px] text-white/50">En ligne</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-sm text-white/70"
            >
              ×
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-[var(--mache-bg-2)] px-3 py-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => send(question)}
                className="whitespace-nowrap rounded-full border border-[var(--mache-line)] px-3 py-1 text-[11px] font-medium text-[var(--mache-muted)] transition hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
              >
                {question}
              </button>
            ))}
          </div>

          <div className="flex h-[280px] flex-col gap-3 overflow-y-auto px-3 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-[14px] px-4 py-3 text-[13px] leading-6 ${
                  message.role === "ai"
                    ? "self-start rounded-tl-[4px] bg-[var(--mache-bg)] text-[var(--mache-text)]"
                    : "self-end rounded-br-[4px] bg-[var(--mache-primary)] text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-[var(--mache-line)] px-3 py-3">
            <input
              className="flex-1 rounded-full border border-[var(--mache-line)] bg-[var(--mache-bg)] px-4 py-2 text-sm outline-none transition focus:border-[var(--mache-primary)]"
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button
              onClick={() => send()}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mache-primary)] text-white disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
