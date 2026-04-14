export default function RegisterPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Créer un compte</h1>

        <div className="mt-6 space-y-4">
          <input className="input" placeholder="Nom complet" />
          <input className="input" type="email" placeholder="Email" />
          <select className="input">
            <option>buyer</option>
            <option>seller_individual</option>
            <option>seller_business</option>
            <option>agent</option>
          </select>
          <input className="input" type="password" placeholder="Mot de passe" />
          <button className="btn-primary w-full">Créer mon compte</button>
        </div>
      </div>
    </main>
  );
}
