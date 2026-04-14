const items = [
  { badge: "−30%", text: "Mode caribéenne" },
  { badge: "NOUVEAU", text: "Produits premium diaspora" },
  { badge: "BIO", text: "Sélection épicerie et produits frais" },
  { badge: "GRATUIT", text: "Livraison offerte selon conditions" },
  { badge: "VENDEUR", text: "Inscription vendeur gratuite" },
  { badge: "EXPORT", text: "Structure prête pour l’international" },
  { badge: "TRUST", text: "Agents vérifiables et logique sécurité" },
  { badge: "PAY", text: "Stripe, PayPal, local methods, COD" }
];

export function HomeTicker() {
  const row = [...items, ...items];

  return (
    <div className="overflow-hidden bg-[var(--mache-dark-2)]">
      <div className="container-page overflow-hidden">
        <div className="flex min-h-[34px] items-center">
          <div className="flex min-w-max animate-[ticker_28s_linear_infinite] gap-10">
            {row.map((item, index) => (
              <div key={`${item.badge}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                <span className="rounded-[4px] bg-[var(--mache-primary)] px-2 py-0.5 text-[10px] font-[800] text-white">
                  {item.badge}
                </span>
                <span className="text-[11px] text-white/60">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
