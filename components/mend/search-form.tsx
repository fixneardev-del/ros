import Link from "next/link";
import type { ServiceCategory } from "@/lib/types";
import { topLevelCategories } from "@/lib/category-utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

export function SearchForm({
  categories,
  defaultService = "",
  defaultPostcode = "",
}: {
  categories: ServiceCategory[];
  defaultService?: string;
  defaultPostcode?: string;
}) {
  const parents = topLevelCategories(categories);

  return (
    <form action="/search" method="get" className="space-y-4">
      <Field label="What do you need help with?" htmlFor="service">
        <Select id="service" name="service" defaultValue={defaultService} required>
          <option value="">Choose a service</option>
          {parents.map((parent) => (
            <optgroup key={parent.id} label={parent.name}>
              <option value={parent.slug}>{parent.name}</option>
              {categories
                .filter((category) => category.parent_id === parent.id)
                .map((child) => (
                  <option key={child.id} value={child.slug}>
                    {child.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <Field
        label="Postcode"
        htmlFor="postcode"
        hint="For example G12 8QQ"
      >
        <Input
          id="postcode"
          name="postcode"
          defaultValue={defaultPostcode}
          placeholder="Enter your postcode"
          autoComplete="postal-code"
          inputMode="text"
          required
        />
      </Field>

      <Button type="submit" className="w-full">
        Find local help
      </Button>

      <p className="text-center text-sm">
        <Link href="/post-job" className="font-bold text-primary underline">
          Post a job instead
        </Link>
      </p>
    </form>
  );
}
