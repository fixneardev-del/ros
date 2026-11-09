# 03 – Service Categories

**Phase:** 1 | **Est.:** 3–4 hrs

## Purpose
A controlled list of service types that drives search, provider profiles and job requests.

## Data model
`service_categories`: id, name, slug, parent_id (optional), description, is_active, requires_extra_checks (boolean), sort_order

## Starter categories (to be confirmed by client)
Furniture repair and refurbishment, Clothing alterations and repair, Hair braiding, Household repairs, Decluttering and organising, Gardening, Other skills and hobbies.

## Functional requirements
1. Categories seeded in the database.
2. Shown in the homepage dropdown, provider registration and job form.
3. Admin can add, rename, reorder, deactivate categories.
4. `requires_extra_checks` flag marks categories where provider approval needs extra evidence (manual process during pilot).
5. One level of subcategory supported; deeper nesting excluded.

## Acceptance criteria
- [ ] Only active categories appear to the public
- [ ] Deactivating a category hides it without deleting existing records
- [ ] Flagged categories show "additional checks required" in the admin approval screen

## Client must supply
Final category list and which ones need extra checks.
