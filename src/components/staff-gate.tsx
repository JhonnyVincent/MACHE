"use client";

import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { roleMaySee, type StaffRole } from "@/lib/staff";

/*
  Remplace le contenu d'une page de l'administration par un message
  quand le rôle de la personne n'y donne pas accès. Le backend refuse
  de toute façon les requêtes : ce message évite seulement une page
  d'erreurs.
*/
export function StaffGate({ role, children }: { role: StaffRole; children: React.ReactNode }) {
  const pathname = usePathname() || "";

  if (roleMaySee(role, pathname)) return <>{children}</>;

  return (
    <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-6">
      <h1 className="text-xl font-bold text-[#0f1111]">Cet espace est réservé au propriétaire</h1>
      <p className="mt-2 text-base text-[#565959]">Votre compte n&apos;a pas accès à cette page.</p>
      <Link href="/dashboard/admin" className="mt-4 inline-block text-base font-semibold text-[#007185] hover:underline">
        Retour à la vue d&apos;ensemble
      </Link>
    </div>
  );
}
