"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    kicker: "Nouvelle collection",
    title: "Mode & style caribéen",
    highlight: "caribéen",
    text: "Des produits plus premium, une vraie logique marketplace et une identité forte pour Mache.",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=80",
    ctaHref: "/shop",
    ctaLabel: "Découvrir"
  },
  {
    kicker: "Marché local",
    title: "Alimentation et produits authentiques",
    highlight: "authentiques",
    text: "Épicerie, produits locaux, export et sélection pensée pour Haïti, la Caraïbe et la diaspora.",
    image:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=1400&q=80",
    ctaHref: "/shop",
    ctaLabel: "Explorer la boutique"
  },
  {
    kicker: "Programme vendeur",
    title: "Vends sur Mache et développe ton activité",
    highlight: "Mache",
    text: "Particuliers, business et fournisseurs peuvent vendre avec une vraie structure e-commerce évolutive.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80",
    ctaHref: "/sell",
    ctaLabel: "Devenir vendeur"
  },
  {
    kicker: "Maison & artisanat",
    title: "Art, déco et créations premium",
    highlight: "premium",
    text: "Un catalogue vivant, plus crédible, plus dynamique, prêt à monter en gamme.",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=80",
    ctaHref: "/shop",
    ctaLabel: "Voir les produits"
  }
];

export function HomeHeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const current = slides[index];

  return (
    <section className="market-hero">
      <div className="market-hero-grid">
        <div className="market-hero-copy">
          <span className="market-hero-kicker">{current.kicker}</span>

          <h1 className="market-hero-title">
            {current.title.split(current.highlight).map((part, i, arr) => (
              <span key={`${part}-${i}`}>
                {part}
                {i < arr.length - 1 ? <em>{current.highlight}</em> : null}
              </span>
            ))}
          </h1>

          <p className="market-hero-text">{current.text}</p>

          <div className="market-hero-actions">
            <Link href={current.ctaHref} className="btn-primary">
              {current.ctaLabel}
            </Link>
            <Link href="/shop" className="btn-secondary">
              Tout le catalogue
            </Link>
          </div>
        </div>

        <div className="market-hero-visual">
          <img src={current.image} alt={current.title} />
        </div>
      </div>

      <div className="flex gap-2 px-6 pb-5 pt-3 md:px-12">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition ${
              i === index
                ? "w-7 bg-[var(--mache-primary)]"
                : "w-2 bg-white/25"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
