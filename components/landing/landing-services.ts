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
 * Each tile carries its own foreground colour. White fails contrast on the
 * lighter backgrounds, so those tiles use ink instead.
 */
export const serviceStyles: Record<
  string,
  { background: string; foreground: string; Icon: typeof Armchair }
> = {
  "furniture-repair": {
    background: "var(--l-blue)",
    foreground: "#ffffff",
    Icon: Armchair,
  },
  "clothing-alterations": {
    background: "var(--l-orange)",
    foreground: "var(--l-ink)",
    Icon: Scissors,
  },
  "household-repairs": {
    background: "var(--l-green)",
    foreground: "var(--l-ink)",
    Icon: Hammer,
  },
  "decluttering-organising": {
    background: "var(--l-brown)",
    foreground: "var(--l-ink)",
    Icon: Archive,
  },
  "gardening-outdoor-help": {
    background: "var(--l-teal)",
    foreground: "#ffffff",
    Icon: Leaf,
  },
  "other-skills-hobbies": {
    background: "var(--l-purple)",
    foreground: "#ffffff",
    Icon: GraduationCap,
  },
  "hair-braiding": {
    background: "var(--l-red)",
    foreground: "var(--l-ink)",
    Icon: Brush,
  },
};
