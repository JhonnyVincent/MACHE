import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--bg)]/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Mache
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link href="/shop">Shop</Link>
          <Link href="/sell">Sell</Link>
          <Link href="/export">Export</Link>
          <Link href="/verify-agent">Verify Agent</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary hidden sm:inline-flex">
            Login
          </Link>
          <Link href="/register" className="btn-primary">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
