import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { getCategories } from "@/lib/data/categories";
import { getDistricts } from "@/lib/data/locations";
import { getSiteSetting } from "@/lib/data/settings";
import { topLevelCategories } from "@/lib/category-utils";
import {
  serviceStyles,
  starterServices,
} from "@/components/landing/landing-services";
import { LandingSearch } from "@/components/landing/landing-search";
import { LandingWaitlist } from "@/components/landing/landing-waitlist";

const defaultNotice =
  "We are starting in Glasgow's West End and selected university communities. More areas will follow.";

const fallbackDistricts = ["G12", "G11", "G3", "G4"];

const steps = [
  {
    title: "Tell us what you need",
    copy: "Pick a service, add a short description and your postcode. Only the district is shown to providers.",
  },
  {
    title: "Compare local offers",
    copy: "Approved providers who cover your area and that service send you an offer with a price and a timeframe.",
  },
  {
    title: "Choose and arrange",
    copy: "Accept one offer to close the job and release contact details. You agree the work and pay directly.",
  },
];

/**
 * Each piece of the landing page that reads the database sits behind its own
 * Suspense boundary. The reads are not cacheable, so without a boundary the
 * route cannot be prerendered and the page is blocked.
 */
async function HeroSearch() {
  const [categories, notice] = await Promise.all([
    getCategories(),
    getSiteSetting("pilot_notice", defaultNotice),
  ]);

  return <LandingSearch categories={categories} notice={notice} />;
}

async function ServiceTiles() {
  const categories = await getCategories();
  const parents = topLevelCategories(categories);
  const starterBySlug = new Map(
    starterServices.map((service) => [service.slug, service]),
  );

  const tiles = (
    parents.length > 0
      ? parents.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          copy:
            category.description ||
            starterBySlug.get(category.slug)?.copy ||
            "Local help, nearby.",
        }))
      : starterServices.map((service) => ({
          id: service.slug,
          slug: service.slug,
          name: service.name,
          copy: service.copy,
        }))
  ).map((service) => ({
    ...service,
    ...(serviceStyles[service.slug] ?? { Icon: Sparkles }),
  }));

  if (tiles.length === 0) {
    return (
      <p className="l-lead" style={{ marginTop: 24 }}>
        The service list is being set up. Browse the search page to see what is
        live.
      </p>
    );
  }

  return (
    <div className="l-tiles" style={{ marginTop: 24 }}>
      {tiles.map((tile) => (
        <Link
          key={tile.id}
          href={`/search?service=${tile.slug}`}
          className="l-tile"
        >
          <div>
            <span className="l-tile-icon">
              <tile.Icon size={16} aria-hidden />
            </span>
            <p className="l-tile-name">{tile.name}</p>
            <p className="l-tile-copy">{tile.copy}</p>
          </div>
          <span className="l-tile-link">Find help</span>
        </Link>
      ))}
    </div>
  );
}

async function PilotDistricts() {
  const locations = await getDistricts();
  const districts =
    locations.length > 0
      ? locations.map((location) => location.postcode_district)
      : fallbackDistricts;

  return (
    <div className="l-districts">
      {districts.map((district) => (
        <span key={district} className="l-district">
          {district}
        </span>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <section className="l-container l-hero">
        <div>
          <p className="l-hero-intro">
            Find help with furniture assembly, clothing alterations, hair
            braiding, decluttering, gardening and more in Scotland
          </p>
          <h1 className="l-hero-title">Repairs and Other Services</h1>
          <p className="l-hero-subtitle">
            One place to find local help with repairs and everyday services.
          </p>
          <p className="l-lead" style={{ marginTop: 12 }}>
            Find local people who repair, alter, restore, organise and teach. Or
            offer the skills you already have. No commission, and contact details
            that stay private until you agree on an offer.
          </p>

          <div className="l-hero-actions">
            <Link href="/search" className="l-btn l-btn-teal l-btn-lg">
              Find local help
            </Link>
            <Link href="/post-job" className="l-btn l-btn-lg">
              Post a job
            </Link>
            <Link href="/provide/apply" className="l-btn l-btn-lg">
              Offer your services
            </Link>
          </div>

          <ul className="l-hero-proof">
            <li>
              <Check size={14} aria-hidden style={{ color: "var(--l-ros-green)" }} />
              Provider applications are reviewed before profiles go live.
            </li>
            <li>
              <Check size={14} aria-hidden style={{ color: "var(--l-ros-green)" }} />
              Contact details stay private
            </li>
            <li>
              <Check size={14} aria-hidden style={{ color: "var(--l-ros-green)" }} />
              No payments taken here
            </li>
          </ul>
        </div>

        <div>
          <Suspense fallback={<div className="l-skeleton" aria-hidden />}>
            <HeroSearch />
          </Suspense>
        </div>
      </section>

      <section className="l-section" data-reveal>
        <div className="l-container">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <p className="l-kicker">What people ask for</p>
              <h2 className="l-section-heading" style={{ marginTop: 10 }}>
                Seven kinds of help,
                <br />
                one local list.
              </h2>
            </div>
            <Link
              href="/search"
              className="l-btn l-btn-sm"
              style={{ marginBottom: 4 }}
            >
              Browse all services
              <ArrowRight size={13} aria-hidden />
            </Link>
          </div>

          <Suspense fallback={<div className="l-skeleton" aria-hidden />}>
            <ServiceTiles />
          </Suspense>
        </div>
      </section>

      <section className="l-section" data-reveal>
        <div className="l-container">
          <p className="l-kicker">How it works</p>
          <h2 className="l-section-heading" style={{ marginTop: 10 }}>
            Three steps, no back and forth.
          </h2>

          <ol className="l-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <p className="l-step-number">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="l-step-title">{step.title}</p>
                <p className="l-step-copy">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-band" data-reveal>
        <div className="l-container l-band-grid">
          <div>
            <p className="l-kicker" style={{ color: "var(--l-ros-green)" }}>
              Providers
            </p>
            <h2 className="l-band-title" style={{ marginTop: 10 }}>
              Have a skill to offer?
              <br />
              Offer your services.
            </h2>
            <p className="l-lead" style={{ marginTop: 14 }}>
              Have a skill to offer? You don&apos;t need to run a business to get
              started. Apply as an individual or a business and choose the
              services you can confidently provide. Some services may require
              evidence of qualifications or insurance.
            </p>

            <ul className="l-band-list">
              <li>
                <Check size={15} aria-hidden style={{ color: "var(--l-ros-green)" }} />
                You choose your own services and postcode areas.
              </li>
              <li>
                <Check size={15} aria-hidden style={{ color: "var(--l-ros-green)" }} />
                No commission, no subscription, no ranking to buy.
              </li>
              <li>
                <Check size={15} aria-hidden style={{ color: "var(--l-ros-green)" }} />
                An admin reviews every application before you appear in search.
              </li>
            </ul>

            <div className="l-hero-actions">
              <Link href="/provide/apply" className="l-btn l-btn-teal l-btn-lg">
                Start an application
              </Link>
            </div>
            <p className="l-review-note">
              We aim to review completed applications within 24 hours.
            </p>
          </div>

          <div className="l-band-panel">
            <h3>What we check</h3>
            <p>Your profile, photos and chosen services.</p>
            <p>At least one photo of your work.</p>
            <p>Extra evidence for categories marked as needing checks.</p>
            <p>
              Providers are independent. We do not guarantee qualifications,
              insurance or checks unless a profile says so.
            </p>
          </div>
        </div>
      </section>

      <section className="l-section" data-reveal>
        <div className="l-container l-split">
          <div>
            <p className="l-kicker">Privacy</p>
            <h2 className="l-section-heading" style={{ marginTop: 10 }}>
              Your contact details stay private.
            </h2>
            <p className="l-lead" style={{ marginTop: 14 }}>
              Providers see your service, description and postcode district.
              Your full postcode, email and phone are released only when you
              accept an offer.
            </p>

            <ul className="l-checklist">
              <li>
                <Check size={17} aria-hidden />
                <span>
                  <strong>Applications are reviewed</strong>
                  Provider applications are reviewed before profiles go live.
                </span>
              </li>
              <li>
                <Check size={17} aria-hidden />
                <span>
                  <strong>No commission</strong>
                  We do not take payments or a cut. You agree the work and pay
                  the provider directly.
                </span>
              </li>
              <li>
                <Check size={17} aria-hidden />
                <span>
                  <strong>Built for the West End</strong>
                  The pilot works by postcode district, not distance or maps.
                </span>
              </li>
            </ul>

            <p className="l-lead" style={{ marginTop: 20 }}>
              We are live in these districts so far:
            </p>
            <Suspense fallback={<div className="l-skeleton" aria-hidden />}>
              <PilotDistricts />
            </Suspense>
          </div>

          <div>
            <p className="l-kicker">Not in the pilot yet?</p>
            <h2 className="l-section-heading" style={{ marginTop: 10 }}>
              Leave your email and postcode.
            </h2>
            <p className="l-lead" style={{ marginTop: 14, marginBottom: 18 }}>
              We will let you know when we reach your area. We will only use
              this to tell you about the pilot.
            </p>
            <LandingWaitlist />
          </div>
        </div>
      </section>
    </>
  );
}
