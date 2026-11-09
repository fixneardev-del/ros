import Link from "next/link";

export function LandingFooter({ supportEmail }: { supportEmail: string }) {
  return (
    <footer className="l-footer">
      <div className="l-container">
        <div className="l-footer-grid">
          <div>
            <Link href="/" className="l-brand">
              <span className="l-brand-mark" aria-hidden>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
                    stroke="#0F766E"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeDasharray="2.6 2.2"
                  />
                </svg>
              </span>
              Repairs &amp; Other Services
            </Link>
            <p className="l-footer-copy">
              A local marketplace for Glasgow&apos;s West End. Providers are
              independent. We do not guarantee qualifications, insurance or
              checks unless a profile says so.
            </p>
          </div>

          <div>
            <h2>Find work</h2>
            <ul>
              <li>
                <Link href="/search">Find local help</Link>
              </li>
              <li>
                <Link href="/post-job">Post a job</Link>
              </li>
              <li>
                <Link href="/provide/apply">Offer your services</Link>
              </li>
              <li>
                <Link href="/provide/jobs">Matching jobs</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2>Legal</h2>
            <ul>
              <li>
                <Link href="/privacy">Privacy notice</Link>
              </li>
              <li>
                <Link href="/terms">Terms of use</Link>
              </li>
              <li>
                <Link href="/cookies">Cookie notice</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2>Contact</h2>
            <ul>
              <li>
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="l-footer-bottom">
          <span>Glasgow pilot. Built for neighbours, students and makers.</span>
          <span>No payments taken. Agree the work and pay the provider directly.</span>
        </div>
      </div>
    </footer>
  );
}
