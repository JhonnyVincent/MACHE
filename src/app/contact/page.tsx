export default function ContactPage() {
  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-3xl card p-6">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-3 text-neutral-500">
          Contacte l’équipe Mache pour support, export, conformité et partenariats.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Support</h2>
            <p className="mt-2 text-sm text-neutral-500">support@mache.local</p>
          </div>
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Export</h2>
            <p className="mt-2 text-sm text-neutral-500">export@mache.local</p>
          </div>
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Partenariats</h2>
            <p className="mt-2 text-sm text-neutral-500">partnerships@mache.local</p>
          </div>
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Confiance & agents</h2>
            <p className="mt-2 text-sm text-neutral-500">trust@mache.local</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <input className="input" placeholder="Nom" />
          <input className="input" placeholder="Email" type="email" />
          <textarea
            className="input min-h-36"
            placeholder="Votre message"
          />
          <button className="btn-primary">Envoyer</button>
        </div>
      </div>
    </main>
  );
}
