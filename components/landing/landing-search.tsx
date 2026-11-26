import type { ServiceCategory } from "@/lib/types";
import { topLevelCategories } from "@/lib/category-utils";
import { starterServices } from "@/components/landing/landing-services";

/**
 * The real search form, presented as a repair ticket. It is the same
 * service and postcode search the rest of the site uses, not a picture of
 * one.
 */
export function LandingSearch({
  categories,
  notice,
}: {
  categories: ServiceCategory[];
  notice: string;
}) {
  const parents = topLevelCategories(categories);

  // Fall back to the starter list so the form is never empty.
  const options =
    parents.length > 0
      ? parents.map((parent) => ({
          slug: parent.slug,
          name: parent.name,
          children: categories
            .filter((category) => category.parent_id === parent.id)
            .map((child) => ({ slug: child.slug, name: child.name })),
        }))
      : starterServices.map((service) => ({
          slug: service.slug,
          name: service.name,
          children: [],
        }));

  return (
    <form action="/search" method="get" className="l-ticket">
      <div className="l-ticket-head">
        <p className="l-ticket-title">What do you need help with?</p>
        <p className="l-ticket-note">Takes a minute</p>
      </div>

      <label className="l-field">
        <span className="l-label">What do you need help with?</span>
        <select
          name="service"
          required
          defaultValue=""
          className="l-input l-select"
        >
          <option value="">Choose a service</option>
          {options.map((option) => (
            <optgroup key={option.slug} label={option.name}>
              <option value={option.slug}>{option.name}</option>
              {option.children.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="l-field">
        <span className="l-label">Postcode</span>
        <input
          name="postcode"
          required
          placeholder="For example G12 8QQ"
          autoComplete="postal-code"
          inputMode="text"
          className="l-input"
        />
      </label>

      <button type="submit" className="l-btn l-btn-teal l-btn-lg" style={{ width: "100%" }}>
        Find local help
      </button>

      <p className="l-ticket-footer" style={{ textAlign: "center" }}>
        <a
          href="/post-job"
          style={{ color: "var(--l-teal)", fontWeight: 700 }}
        >
          Post a job instead
        </a>
      </p>

      <p className="l-pilot">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          style={{ flex: "none", marginTop: 2 }}
        >
          <circle cx="8" cy="8" r="6.5" stroke="var(--l-ros-green)" strokeWidth="1.4" />
          <path
            d="M8 7.2v4M8 5.1v.1"
            stroke="var(--l-ros-green)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span>{notice}</span>
      </p>
    </form>
  );
}
