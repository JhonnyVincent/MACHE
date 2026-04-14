import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <h3 className="text-lg font-bold">Mache</h3>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            Marketplace premium et populaire pour Haïti, la Caraïbe et la diaspora.
          </p>
        </div>

        <div>
          <h4 className="font-semibold">Marketplace</h4>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/shop" className="block">Shop</Link>
            <Link href="/sell" className="block">Sell</Link>
            <Link href="/export" className="block">Export</Link>
            <Link href="/verify-agent" className="block">Verify Agent</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Entreprise</h4>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/about" className="block">About</Link>
            <Link href="/contact" className="block">Contact</Link>
            <Link href="/faq" className="block">FAQ</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Légal</h4>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/legal/terms" className="block">Terms</Link>
            <Link href="/legal/privacy" className="block">Privacy</Link>
            <Link href="/legal/returns" className="block">Returns</Link>
            <Link href="/legal/shipping" className="block">Shipping</Link>
            <Link href="/legal/vendors" className="block">Vendors</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
