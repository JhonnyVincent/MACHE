import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--mache-white)]/95 backdrop-blur">
      <div className="container-page">
        <div className="grid min-h-[76px] grid-cols-[170px_1fr_auto] items-center gap-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--mache-primary)] text-lg text-white">
              M
            </div>
            <div className="text-[22px] font-extrabold tracking-[-0.04em]">
              Mache
            </div>
          </Link>

          <div className="hidden md:flex">
            <div className="flex w-full overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)]">
              <select className="min-w-[130px] border-r border-[var(--mache-line)] bg-[var(--mache-bg-2)] px-3 text-[12px] font-medium outline-none">
                <option>Toutes catégories</option>
                <option>Mode</option>
                <option>Épicerie</option>
                <option>Artisanat</option>
                <option>Export</option>
              </select>

              <input
                className="flex-1 bg-transparent px-4 py-3 text-[13px] outline-none"
                placeholder="Rechercher produits, vendeurs, catégories..."
              />

              <button className="bg-[var(--mache-primary)] px-5 text-sm font-semibold text-white">
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary">
              Login
            </Link>
            <Link href="/register" className="btn-primary">
              Register
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-1 overflow-x-auto whitespace-nowrap border-t border-[var(--mache-line)] py-2 text-[12px] text-[var(--mache-muted)] md:flex">
          <Link href="/shop" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">
            Shop
          </Link>
          <Link href="/sell" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">
            Sell
          </Link>
          <Link href="/export" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">
            Export
          </Link>
          <Link href="/verify-agent" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">
            Verify Agent
          </Link>
          <Link href="/about" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">
            About
          </Link>
          <Link href="/contact" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
