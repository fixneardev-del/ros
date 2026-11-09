import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { StitchLine } from "@/components/mend/tag";

export default function Forbidden() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col justify-center px-4 py-16 md:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
        403
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-5xl">
        This area is for the site owner.
      </h1>
      <StitchLine className="mt-4 w-24" />
      <p className="mt-4 text-lg text-muted">
        Your account is signed in, but it does not have admin access. If you
        think that is wrong, contact the site owner.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
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
