import { permanentRedirect } from "next/navigation";

/* Les profils particulier et business sont réunis : « Vendeur ». */
export default function Page() {
  permanentRedirect("/sell/vendeur");
}
