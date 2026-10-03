import { Link } from "next-view-transitions";

/*
  LA PAGE D'UN PROFIL VENDEUR (vendeur, fournisseur).

  Une seule mise en page pour les deux : même rythme, mêmes espaces, mêmes
  titres. Seuls les textes changent, et ils sont écrits dans chaque page.
  Plus de fausse maquette de tableau de bord avec des chiffres inventés :
  une page qui présente un profil montre ce que le profil permet, pas des
  nombres qui n'existent pas.
*/

type Plan = { name: string; price: string; text: string };

export type ProfileContent = {
  /* Ligne au-dessus du titre, ex. « Profil Vendeur ». */
  eyebrow: string;
  title: string;
  intro: string;
  primaryCta: string;
  secondaryCta: { label: string; href: string };
  benefitsTitle: string;
  benefits: string[];
  toolsTitle: string;
  toolsIntro: string;
  tools: [string, string][];
  plansTitle?: string;
  plansIntro?: string;
  plans?: Plan[];
  stepsTitle: string;
  steps: string[];
  closing: { title: string; text: string; primary: string; secondary: { label: string; href: string } };
};

export function ProfilePage({ content }: { content: ProfileContent }) {
  return (
    <main>
      <section className="bg-white">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <Link href="/sell" className="text-sm text-[var(--mache-muted)] hover:text-[var(--mache-text)]">
              ← Tous les profils
            </Link>

            <p className="mt-6 text-sm font-semibold tracking-label text-[var(--mache-primary)]">
              {content.eyebrow}
            </p>

            <h1 className="mt-3 max-w-2xl text-hero text-[var(--mache-text)]">{content.title}</h1>

            <p className="mt-5 max-w-xl text-md leading-relaxed text-[var(--mache-muted)]">{content.intro}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard/seller/inscription" className="btn-primary">
                {content.primaryCta}
              </Link>
              <Link href={content.secondaryCta.href} className="btn-secondary">
                {content.secondaryCta.label}
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/carte-haiti-mache.webp"
              width={1000}
              height={800}
              alt="Carte d'Haïti aux couleurs de MACHE"
              className="w-full max-w-[420px] object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="max-w-2xl text-3xl text-[var(--mache-text)] sm:text-4xl">{content.benefitsTitle}</h2>

        <ul className="mt-8 grid gap-x-10 gap-y-4 border-t border-[var(--mache-line)] pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {content.benefits.map((item) => (
            <li key={item} className="flex gap-3 text-md">
              <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[var(--mache-primary)]" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[var(--mache-bg-2)] py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl text-[var(--mache-text)] sm:text-4xl">{content.toolsTitle}</h2>
            <p className="mt-3 max-w-md text-md leading-relaxed text-[var(--mache-muted)]">{content.toolsIntro}</p>
          </div>

          <dl className="grid gap-5 sm:grid-cols-2">
            {content.tools.map(([title, text]) => (
              <div key={title} className="rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-6">
                <dt className="font-display text-lg font-semibold text-[var(--mache-text)]">{title}</dt>
                <dd className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {content.plans && content.plans.length > 0 && (
        <section className="container-page py-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-3xl text-[var(--mache-text)] sm:text-4xl">{content.plansTitle}</h2>
              <p className="mt-3 max-w-md text-md leading-relaxed text-[var(--mache-muted)]">{content.plansIntro}</p>
            </div>

            <dl className="grid gap-5 sm:grid-cols-2">
              {content.plans.map((plan) => (
                <div key={plan.name} className="rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-6">
                  <dt className="text-sm font-semibold text-[var(--mache-muted)]">{plan.name}</dt>
                  <dd className="mt-2 font-display text-2xl font-semibold text-[var(--mache-text)]">{plan.price}</dd>
                  <dd className="mt-2 text-base text-[var(--mache-muted)]">{plan.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section id="guide-vendeur" className="container-page py-16">
        <h2 className="max-w-2xl text-3xl text-[var(--mache-text)] sm:text-4xl">{content.stepsTitle}</h2>

        <ol className="mt-8 divide-y divide-[var(--mache-line)] border-y border-[var(--mache-line)]">
          {content.steps.map((step, index) => (
            <li key={step} className="flex items-baseline gap-6 py-4">
              <span className="w-8 shrink-0 font-display text-2xl font-semibold text-[var(--mache-primary)]">
                {index + 1}
              </span>
              <span className="text-md text-[var(--mache-text)]">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pb-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[8px] bg-[var(--mache-dark)] p-8 text-white sm:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl">{content.closing.title}</h2>
            <p className="mt-2 text-md leading-relaxed text-white/75">{content.closing.text}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/seller/inscription"
              className="rounded-[6px] bg-[var(--mache-primary)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              {content.closing.primary}
            </Link>
            <Link
              href={content.closing.secondary.href}
              className="rounded-[6px] border border-white/40 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[var(--mache-text)]"
            >
              {content.closing.secondary.label}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
