"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage(
          "Session de réinitialisation introuvable. Redemandez un nouveau lien."
        );
      }

      setReady(true);
    }

    checkSession();
  }, [supabase]);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!password || !confirmPassword) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/login?message=password_updated");
  }

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>

        <p className="mt-2 text-sm text-neutral-500">
          Entrez votre nouveau mot de passe.
        </p>

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        {!ready ? (
          <p className="mt-6 text-sm text-neutral-500">Chargement...</p>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <input
              className="input"
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              className="input"
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
