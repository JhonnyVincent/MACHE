import { privateSectionMetadata } from "@/lib/seo";

export const metadata = privateSectionMetadata("Espace vendeur");

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
