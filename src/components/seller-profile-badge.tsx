/*
  Le profil déclaré par une boutique, tel qu'un acheteur le lit.

  Le mot « déclaré » n'est pas une précaution de langage : ce profil est
  écrit par le vendeur lui-même. L'infobulle le dit, et le badge reste
  neutre — gris, sans coche ni couleur de validation. Un badge qui
  ressemble à une vérification alors qu'il n'en est pas une trompe
  l'acheteur plus sûrement qu'un badge absent.
*/

import { profileInfo, type SellerProfile } from "@/lib/seller-profile";

export function SellerProfileBadge({
  profile,
  withMeaning = false,
}: {
  profile: SellerProfile;
  withMeaning?: boolean;
}) {
  const info = profileInfo(profile);

  return (
    <span
      title={`${info.meaning} Profil déclaré par le vendeur.`}
      className="inline-flex items-center rounded-[3px] border border-[var(--mache-line)] bg-[var(--mache-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--mache-muted)]"
    >
      {info.badge}
      {withMeaning && (
        <span className="ml-1.5 font-normal">— {info.meaning}</span>
      )}
    </span>
  );
}
