import Link from "next/link";

export function SiteFooter() {
  const supportEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || "hello@example.com";

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr] md:px-8 lg:px-12">
        <div>
          <p className="font-display text-lg font-extrabold">
            Repairs <span className="text-primary">&amp;</span> Other Services
          </p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Providers are independent. We do not guarantee qualifications,
            insurance or checks unless a profile says so.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link href="/search" className="font-bold hover:text-primary">
            Find help
          </Link>
          <Link href="/post-job" className="font-bold hover:text-primary">
            Post a job
          </Link>
          <Link href="/provide/apply" className="font-bold hover:text-primary">
            Offer your services
          </Link>
        </nav>

        <nav aria-label="Legal" className="flex flex-col gap-2 text-sm">
          <Link href="/privacy" className="font-bold hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="font-bold hover:text-primary">
            Terms
          </Link>
          <Link href="/cookies" className="font-bold hover:text-primary">
            Cookies
          </Link>
          <a
            href={`mailto:${supportEmail}`}
            className="font-bold hover:text-primary"
          >
            Contact
          </a>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-4 text-sm text-muted md:px-8 lg:px-12">
          Glasgow pilot. Built for neighbours, students and makers.
        </p>
      </div>
    </footer>
  );
}
