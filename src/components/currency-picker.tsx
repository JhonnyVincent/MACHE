"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE, DISPLAY_CURRENCIES } from "@/lib/fx";

/*
  Choix de la devise d'affichage (en plus du prix facturé). Gardé dans un
  cookie d'un an ; « Prix : HTG » = pas de conversion.
*/
export function CurrencyPicker() {
  const router = useRouter();
  const [value, setValue] = useState("HTG");

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([A-Z]{3})`));
    if (match && (DISPLAY_CURRENCIES as readonly string[]).includes(match[1])) setValue(match[1]);
  }, []);

  return (
    <select
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        document.cookie = `${CURRENCY_COOKIE}=${event.target.value}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
      aria-label="Afficher aussi les prix en"
      title="Afficher aussi les prix dans cette devise (indicatif)"
      className="bg-black text-white outline-none"
    >
      <option value="HTG">HTG</option>
      {DISPLAY_CURRENCIES.filter((code) => code !== "HTG").map((code) => (
        <option key={code} value={code}>≈ {code}</option>
      ))}
    </select>
  );
}
