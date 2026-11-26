import {
  Archive,
  Armchair,
  Brush,
  GraduationCap,
  Hammer,
  Leaf,
  Scissors,
} from "lucide-react";

export interface LandingService {
  slug: string;
  name: string;
  copy: string;
}

/**
 * The starter list. The database is the source of truth once it is seeded,
 * but the landing page should never look broken while it is not.
 */
export const starterServices: LandingService[] = [
  {
    slug: "furniture-repair",
    name: "Furniture repair",
    copy: "Wobbly chairs, tired upholstery and small wooden fixes.",
  },
  {
    slug: "clothing-alterations",
    name: "Clothing alterations",
    copy: "Hems, zips, seams and a better fit.",
  },
  {
    slug: "household-repairs",
    name: "Household repairs",
    copy: "Flat-pack, fixtures and practical help at home.",
  },
  {
    slug: "decluttering-organising",
    name: "Decluttering",
    copy: "Sort a room, a cupboard or a fresh start.",
  },
  {
    slug: "gardening-outdoor-help",
    name: "Gardening help",
    copy: "Tidy-ups, planters and growing advice.",
  },
  {
    slug: "hair-braiding",
    name: "Hair braiding",
    copy: "Braiding, styling and hair care at home.",
  },
  {
    slug: "other-skills-hobbies",
    name: "Other skills",
    copy: "Tutoring, making and the thing you are good at.",
  },
];

/**
 * Every service uses the same white card with a green icon. The category is
 * carried by its name and copy, not by a different card colour, so the
 * palette stays calm and the text keeps AA contrast throughout.
 */
export const serviceStyles: Record<string, { Icon: typeof Armchair }> = {
  "furniture-repair": { Icon: Armchair },
  "clothing-alterations": { Icon: Scissors },
  "household-repairs": { Icon: Hammer },
  "decluttering-organising": { Icon: Archive },
  "gardening-outdoor-help": { Icon: Leaf },
  "other-skills-hobbies": { Icon: GraduationCap },
  "hair-braiding": { Icon: Brush },
};
