"use client";

import { useMemo, useState } from "react";
import { agents } from "@/lib/mock-data";

export default function VerifyAgentPage() {
  const [code, setCode] = useState("");

  const result = useMemo(() => {
    return agents.find(
      (agent) => agent.code.toLowerCase() === code.trim().toLowerCase()
    );
  }, [code]);

  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <div className="card p-6">
          <h1 className="text-3xl font-bold">Vérification agent</h1>
          <p className="mt-3 text-neutral-500">
            Saisissez un code agent pour afficher son identité officielle, sa zone
            et son statut public.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: MCH-AG-1024"
              className="input"
            />
            <button className="btn-primary">Vérifier</button>
          </div>
        </div>

        <div className="mt-6">
          {result ? (
            <div className="card p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <img
                  src={result.avatar}
                  alt={result.fullName}
                  className="h-24 w-24 rounded-full object-cover"
                />

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{result.fullName}</h2>
                    {result.officialBadge ? (
                      <span className="badge">Badge officiel</span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <p>
                      <span className="font-semibold">Code :</span> {result.code}
                    </p>
                    <p>
                      <span className="font-semibold">Zone :</span> {result.zone}
                    </p>
                    <p>
                      <span className="font-semibold">Statut :</span> {result.status}
                    </p>
                    <p>
                      <span className="font-semibold">Validité :</span> {result.validUntil}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : code.trim() ? (
            <div className="card p-6">
              <p className="font-semibold">Aucun agent trouvé pour ce code.</p>
              <p className="mt-2 text-sm text-neutral-500">
                Vérifie le format ou contacte le support Mache.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
