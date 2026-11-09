import type { ServiceCategory } from "@/lib/types";

export function topLevelCategories(categories: ServiceCategory[]) {
  return categories.filter((category) => !category.parent_id);
}
