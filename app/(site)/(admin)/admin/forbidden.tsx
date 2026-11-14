import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="dash-page">
      <div>
        <p className="dash-kicker">403</p>
        <h1 className="mt-1">This area is for the site owner.</h1>
        <p className="mt-2 max-w-[65ch] text-muted">
          Your account is signed in, but it does not have admin access. If you
          think that is wrong, contact the site owner.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <Link
          href="/account"
          className="inline-flex min-h-12 items-center justify-center rounded-control px-5 text-base font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
        >
          Your account
        </Link>
      </div>
    </div>
  );
}
