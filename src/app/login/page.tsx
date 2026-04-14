import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Connexion</h1>

        <div className="mt-6 space-y-4">
          <input className="input" type="email" placeholder="Email" />
          <input className="input" type="password" placeholder="Mot de passe" />
          <button className="btn-primary w-full">Se connecter</button>

          <Link href="/forgot-password" className="block text-sm text-neutral-500">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </main>
  );
}
