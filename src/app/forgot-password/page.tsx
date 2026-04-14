export default function ForgotPasswordPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>

        <div className="mt-6 space-y-4">
          <input className="input" type="email" placeholder="Votre email" />
          <button className="btn-primary w-full">Envoyer le lien</button>
        </div>
      </div>
    </main>
  );
}
