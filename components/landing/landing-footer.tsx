import Link from "next/link";
import { RosLogo } from "@/components/landing/ros-logo";

export function LandingFooter({ supportEmail }: { supportEmail: string }) {
  return (
    <footer className="l-footer">
      <div className="l-container">
        <div className="l-footer-grid">
          <div>
            <Link href="/" className="l-brand">
              <RosLogo />
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
                <Link href="/contact">Contact us</Link>
              </li>
              {supportEmail ? (
                <li>
                  <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
