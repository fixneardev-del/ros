-- Starter categories. The client can rename, reorder or deactivate these.
insert into service_categories (id, parent_id, name, slug, description, requires_extra_checks, is_active, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', null, 'Furniture repair and refurbishment', 'furniture-repair', 'Mending, restoring and refreshing furniture.', false, true, 10),
  ('22222222-2222-4222-8222-222222222222', null, 'Clothing alterations and repair', 'clothing-alterations', 'Alterations, mending and small clothing repairs.', false, true, 20),
  ('33333333-3333-4333-8333-333333333333', null, 'Hair braiding and styling', 'hair-braiding', 'Braiding, styling and hair care at home.', false, true, 30),
  ('44444444-4444-4444-8444-444444444444', null, 'Household repairs', 'household-repairs', 'Small repairs, assembly and practical help at home.', true, true, 40),
  ('55555555-5555-4555-8555-555555555555', null, 'Decluttering and organising', 'decluttering-organising', 'Sorting, decluttering and organising spaces.', false, true, 50),
  ('66666666-6666-4666-8666-666666666666', null, 'Gardening and outdoor help', 'gardening-outdoor-help', 'Gardens, planters, outdoor tidy-ups and growing help.', false, true, 60),
  ('77777777-7777-4777-8777-777777777777', null, 'Other skills and hobbies', 'other-skills-hobbies', 'A skill or hobby that helps a neighbour.', false, true, 70),
  ('11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'Upholstery', 'upholstery', 'Re-covering chairs, stools and small furniture.', false, true, 11),
  ('11111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', 'Woodwork and joinery', 'woodwork-joinery', 'Small wooden repairs, shelves and made-to-fit pieces.', false, true, 12),
  ('22222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 'Zip and seam repairs', 'zip-seam-repairs', 'Replacing zips, mending seams and patching.', false, true, 21),
  ('22222222-2222-4222-8222-222222222224', '22222222-2222-4222-8222-222222222222', 'Hemming and resizing', 'hemming-resizing', 'Taking up hems and adjusting fit.', false, true, 22),
  ('44444444-4444-4444-8444-444444444445', '44444444-4444-4444-8444-444444444444', 'Flat-pack assembly', 'flat-pack-assembly', 'Assembling flat-pack furniture safely.', false, true, 41),
  ('44444444-4444-4444-8444-444444444446', '44444444-4444-4444-8444-444444444444', 'Small home fixes', 'small-home-fixes', 'Hanging, sealing and small practical fixes.', true, true, 42),
  ('66666666-6666-4666-8666-666666666667', '66666666-6666-4666-8666-666666666666', 'Garden tidy-ups', 'garden-tidy-ups', 'Weeding, pruning and clearing small outdoor spaces.', false, true, 61),
  ('77777777-7777-4777-8777-777777777778', '77777777-7777-4777-8777-777777777777', 'Tutoring and learning help', 'tutoring-learning-help', 'Informal tutoring and learning support.', false, true, 71)
on conflict (id) do nothing;

insert into locations (postcode_district, area_name, is_enabled)
values
  ('G12', 'West End', true),
  ('G11', 'Partick', true),
  ('G3', 'Finnieston and Anderston', true),
  ('G4', 'City centre north', true)
on conflict (postcode_district) do nothing;

insert into site_settings (key, value)
values
  ('pilot_notice', 'We are starting in Glasgow''s West End and selected university communities. More areas will follow.'),
  ('reapprove_on_key_change', 'true'),
  ('review_turnaround', 'We usually review provider applications within 2 working days.'),
  ('provider_independence_notice', 'Providers are independent. We do not guarantee qualifications, insurance or checks unless a profile says so.'),
  ('support_email', 'hello@example.com'),
  ('analytics_provider', 'off')
on conflict (key) do nothing;
