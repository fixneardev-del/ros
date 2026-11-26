import Link from "next/link";

export function DashFooter({
  variant,
}: {
  variant: "customer" | "provider" | "admin";
}) {
  return (
    <footer className="dash-footer">
      <p>Repairs &amp; Other Services · Glasgow pilot</p>
      <nav aria-label="Dashboard footer">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/cookies">Cookies</Link>
        <Link href="/contact">Contact</Link>
        {variant === "customer" ? <Link href="/search">Find help</Link> : null}
        {variant === "admin" ? <Link href="/admin">Admin</Link> : null}
      </nav>
    </footer>
  );
}
