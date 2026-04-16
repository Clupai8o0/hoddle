-- =============================================================================
-- Hoddle Melbourne — Development Seed
-- Run automatically on: npx supabase db reset
-- Run manually:         npx supabase db seed
--
-- Strategy:
--   1. Insert auth.users  →  trigger auto-creates profiles rows
--   2. UPDATE profiles    →  set role, name, avatar_url, etc.
--   3. Insert mentors     →  one row per mentor profile
--   4. Insert content     →  articles + resources
--   5. Insert forums      →  categories, threads, posts
--
-- All fixed UUIDs so the seed is idempotent and predictable.
-- RLS is bypassed — seed.sql runs as postgres superuser locally.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEAR (safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────

truncate auth.users cascade;   -- cascades to profiles → mentors → everything

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUTH USERS  (trigger creates profiles rows automatically)
-- ─────────────────────────────────────────────────────────────────────────────

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values

  -- ── Mentors ────────────────────────────────────────────────────────────────

  ( 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    'mei.chen@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mei Lin Chen"}',
    now(), now() ),

  ( 'aaaaaaaa-0000-0000-0000-000000000002'::uuid,
    'priya.sharma@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sharma"}',
    now(), now() ),

  ( 'aaaaaaaa-0000-0000-0000-000000000003'::uuid,
    'james.okonkwo@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"James Okonkwo"}',
    now(), now() ),

  ( 'aaaaaaaa-0000-0000-0000-000000000004'::uuid,
    'sofia.barros@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sofia Barros"}',
    now(), now() ),

  -- ── Students ───────────────────────────────────────────────────────────────

  ( 'bbbbbbbb-0000-0000-0000-000000000001'::uuid,
    'yuki.tanaka@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Yuki Tanaka"}',
    now(), now() ),

  ( 'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
    'ahmad.khalil@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ahmad Khalil"}',
    now(), now() ),

  ( 'bbbbbbbb-0000-0000-0000-000000000003'::uuid,
    'emma.dupont@seed.hoddle.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Emma Dupont"}',
    now(), now() );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES  (rows exist from trigger — update them)
-- ─────────────────────────────────────────────────────────────────────────────

update public.profiles set
  full_name        = 'Mei Lin Chen',
  role             = 'mentor',
  country_of_origin = 'China',
  university       = 'University of Melbourne',
  year_of_study    = 3,
  onboarded_at     = now(),
  -- avatar_url: replace with real Storage URL once you upload the photo
  -- Path in avatars bucket: aaaaaaaa-0000-0000-0000-000000000001/avatar.webp
  avatar_url       = null
where id = 'aaaaaaaa-0000-0000-0000-000000000001';

update public.profiles set
  full_name        = 'Priya Sharma',
  role             = 'mentor',
  country_of_origin = 'India',
  university       = 'RMIT University',
  year_of_study    = 4,
  onboarded_at     = now(),
  avatar_url       = null
where id = 'aaaaaaaa-0000-0000-0000-000000000002';

update public.profiles set
  full_name        = 'James Okonkwo',
  role             = 'mentor',
  country_of_origin = 'Nigeria',
  university       = 'Monash University',
  year_of_study    = 3,
  onboarded_at     = now(),
  avatar_url       = null
where id = 'aaaaaaaa-0000-0000-0000-000000000003';

update public.profiles set
  full_name        = 'Sofia Barros',
  role             = 'mentor',
  country_of_origin = 'Brazil',
  university       = 'Swinburne University',
  year_of_study    = 4,
  onboarded_at     = now(),
  avatar_url       = null
where id = 'aaaaaaaa-0000-0000-0000-000000000004';

update public.profiles set
  full_name        = 'Yuki Tanaka',
  role             = 'student',
  country_of_origin = 'Japan',
  university       = 'University of Melbourne',
  year_of_study    = 1,
  onboarded_at     = now()
where id = 'bbbbbbbb-0000-0000-0000-000000000001';

update public.profiles set
  full_name        = 'Ahmad Khalil',
  role             = 'student',
  country_of_origin = 'Jordan',
  university       = 'RMIT University',
  year_of_study    = 1,
  onboarded_at     = now()
where id = 'bbbbbbbb-0000-0000-0000-000000000002';

update public.profiles set
  full_name        = 'Emma Dupont',
  role             = 'student',
  country_of_origin = 'France',
  university       = 'Monash University',
  year_of_study    = 1,
  onboarded_at     = now()
where id = 'bbbbbbbb-0000-0000-0000-000000000003';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MENTORS
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.mentors
  (profile_id, slug, headline, bio, expertise, hometown, current_position, verified_at)
values

  ( 'aaaaaaaa-0000-0000-0000-000000000001',
    'mei-lin-chen',
    'CS student by day, bubble tea enthusiast always. Three years in and I finally know where everything is.',
    'I moved to Melbourne from Shanghai not knowing anyone, with broken English and a map screenshot of the city. Three years later I''m a teaching assistant in computer science, run a coding bootcamp for first-years, and genuinely love this city. I write about the messy, honest bits of that transition — the first-semester anxiety, the visa confusion, the moment you stop comparing Melbourne to home and start loving it for itself.',
    ARRAY['academic_writing', 'coding_and_tech', 'navigating_campus', 'mental_health'],
    'Shanghai, China',
    'Teaching Assistant, School of Computing and Information Systems',
    now() - interval '30 days' ),

  ( 'aaaaaaaa-0000-0000-0000-000000000002',
    'priya-sharma',
    'Marketing & business. Four years of figuring out how international students can actually build careers in Melbourne.',
    'Coming from Mumbai, I thought a business degree would automatically translate into a job. It doesn''t — not without knowing how the local market works, how to network authentically, and which internships are actually worth your time. I''ve made the mistakes so you don''t have to. My content focuses on career strategy, professional confidence, and building a network when you''re starting from zero.',
    ARRAY['internships', 'networking', 'professional_writing', 'career_planning'],
    'Mumbai, India',
    'Marketing Coordinator, Deloitte Digital (Part-time)',
    now() - interval '25 days' ),

  ( 'aaaaaaaa-0000-0000-0000-000000000003',
    'james-okonkwo',
    'Engineering student. Housing, finances, and not losing your mind in your first year.',
    'Lagos to Melbourne is a big jump. The cost of living here shocked me — I had no idea how expensive renting would be, or how complicated the rental market is for international students. I spent my first year figuring out accommodation, budgeting, and part-time work rules under a student visa. Now I help others skip that learning curve.',
    ARRAY['housing_and_accommodation', 'budgeting_and_finances', 'visa_and_legal', 'part_time_work'],
    'Lagos, Nigeria',
    'Civil Engineering Student + Residential Advisor, Monash',
    now() - interval '20 days' ),

  ( 'aaaaaaaa-0000-0000-0000-000000000004',
    'sofia-barros',
    'Arts and media. How to build community and actually enjoy Melbourne beyond the university bubble.',
    'I studied journalism in São Paulo and chose Melbourne for its arts scene. What I didn''t expect was how isolating the first months could feel — everyone seemed to already have their group. It took me a year to find my people, and it happened through the city itself, not the campus. I share how to explore Melbourne properly: live music, community events, volunteering, and the neighbourhoods nobody tells you about.',
    ARRAY['social_and_community', 'arts_and_culture', 'mental_health', 'navigating_campus'],
    'São Paulo, Brazil',
    'Freelance journalist + Media Studies student, Swinburne',
    now() - interval '15 days' );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONTENT TAGS
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.content_tags (slug, label) values
  ('first-year',         'First Year'),
  ('housing',            'Housing'),
  ('visa',               'Visa & Legal'),
  ('career',             'Career'),
  ('mental-health',      'Mental Health'),
  ('budgeting',          'Budgeting'),
  ('campus-life',        'Campus Life'),
  ('networking',         'Networking'),
  ('melbourne-city',     'Melbourne City'),
  ('academic-tips',      'Academic Tips')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CONTENT ITEMS
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.content_items
  (id, mentor_id, type, title, slug, excerpt, body, published_at)
values

  -- ── Mei Lin Chen — Article ────────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'article',
    'The First Month Nobody Warns You About',
    'first-month-nobody-warns-you-about',
    'Orientation week is over, lectures have started, and you feel more lost than ever. Here is what is actually happening — and why it is completely normal.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Everyone talks about orientation week like it fixes everything. You get a tote bag, you smile at strangers, you eat free pizza, and then suddenly you are supposed to feel settled. Except you don''t. Lectures start and the accent sounds different to the recorded YouTube videos you studied. The LMS interface is confusing. Your tutorial group is full of domestic students who already seem to know each other."}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "I want to be honest with you about what the first month is actually like, because the glossy version did me more harm than good."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "The tiredness is not laziness"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Processing a new culture, a new accent, a new university system, and living alone for possibly the first time is cognitively exhausting. I slept nine hours a night and still felt drained. That is not a character flaw — that is your brain doing enormous amounts of work."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "The comparison trap"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Your classmates who seem relaxed and confident have usually done this before — maybe they studied interstate, or they have family in Melbourne, or they are simply very good at performing confidence. Give yourself the same grace you would give a friend who just moved country."}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Month two gets quieter. Month three gets easier. That is not a promise — it is what I have seen, and what my students tell me now."}]
        }
      ]
    }'::jsonb,
    now() - interval '20 days' ),

  -- ── Mei Lin Chen — Article 2 ──────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'article',
    'How I Went From Failing My First Assignment to Teaching Assistant',
    'failing-first-assignment-to-teaching-assistant',
    'A D+ on my first essay was one of the best things that happened to me. Here is why, and what changed.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The grade was a D+. I cried in the library bathroom for about twenty minutes. Then I went home and read the feedback so many times I had it memorised."}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The problem was not my English, not exactly. It was that I was writing the way I had been taught at school in China — state your conclusion, explain it, restate it. Australian academic writing expects the opposite: open a question, tension it, then resolve it with evidence. The structure itself was the issue."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "The Academic Skills Centre is not for struggling students"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "I used to think the writing centre was where you went if you were bad at English. Now I send my own students there in week one, before anything is due. The consultants are not editors — they teach you to think differently about academic argument. Book a session early, while the load is light."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "What actually changed"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "I read widely. I read the readings my lecturers cited, not just the readings themselves. I started noticing how academics open with a problem rather than an answer. By second semester I was getting distinctions. By second year I was the one helping others."}]
        }
      ]
    }'::jsonb,
    now() - interval '12 days' ),

  -- ── Priya Sharma — Article ────────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'article',
    'The Only Internship Guide You Need as an International Student in Melbourne',
    'internship-guide-international-student-melbourne',
    'The rules are different here. Work rights, application culture, networking style — here is what nobody told me until I had already made the mistakes.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "When I arrived from Mumbai I had three years of internship experience and a portfolio I was proud of. I applied to forty roles in my first six months and heard back from two. I was confused and, honestly, a little humiliated."}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The problem was not my skills. It was that I was applying the Indian way to an Australian job market that works completely differently."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Know your work rights first"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "On a student visa (subclass 500) you can work up to 48 hours per fortnight during semester, and unlimited hours during official university breaks. Most internships are unpaid WIL (Work Integrated Learning) placements coordinated through your faculty — these do not count toward your work limit. Know this before you apply."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "LinkedIn in Australia is a real tool"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "In Australia, hiring happens through relationships more than job boards. A warm introduction from a mutual connection gets your application read first. Start building your profile and connecting with alumni from your degree in week one — not when you need a job."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "The one thing that got me my first role"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "I messaged twenty alumni from RMIT on LinkedIn asking for a fifteen-minute coffee chat — not a job, just a conversation. Three said yes. One of them referred me to an opening that was never advertised. That is how Melbourne works."}]
        }
      ]
    }'::jsonb,
    now() - interval '18 days' ),

  -- ── James Okonkwo — Article ───────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'article',
    'Finding a Rental in Melbourne When You Have No Rental History',
    'finding-rental-melbourne-no-rental-history',
    'The Melbourne rental market is brutal even for locals. For an international student with no Australian rental history, it can feel impossible. Here is the playbook.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "My first week in Melbourne I stayed in an airport hotel because every share house I applied to rejected me. No rental history, no Australian references, no local guarantor. I had not even thought about this as a problem before I arrived."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Start with purpose-built student accommodation"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "PBSA providers (UniLodge, Scape, Urbanest) accept international students without rental history. Yes, they are more expensive. Think of the premium as the cost of having a Melbourne address and a rental record you can show future landlords. Six months in PBSA, then move to share housing with references."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "The Facebook groups are real"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Search Facebook for ''Melbourne student housing [your university]'' and ''Melbourne share house [your suburb].'' Private landlords listing on social media often care less about formal references and more about whether they trust you. Show up to inspections in person — first impressions matter here."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Your university''s student housing office"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Every university in Melbourne has a housing support team. Monash, for example, has a list of verified private landlords who have a track record of renting to students. Use it. They can also sometimes provide a reference letter as an institution."}]
        }
      ]
    }'::jsonb,
    now() - interval '10 days' ),

  -- ── Sofia Barros — Article ────────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'article',
    'The Melbourne Nobody Shows You in the Brochure',
    'melbourne-nobody-shows-you-in-brochure',
    'Everyone knows Fitzroy. But the city that makes you fall in love with it lives in its backstreets, community gardens, and cheap live music venues. Here is where to actually go.',
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The Melbourne in the university brochures is Southbank at golden hour and the Botanic Gardens. Beautiful, but not where you build a life. The Melbourne I love is messier and more alive — and most first-years never find it because they stay within two tram stops of campus."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Neighbourhoods worth exploring"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Footscray has the best Vietnamese and African food in the city, a thriving arts scene, and rents significantly cheaper than inner suburbs. Northcote is where the musicians live. Brunswick has the best bookshops and a slow-weekend energy that is hard to describe. Williamstown feels like a different city entirely — walk along the waterfront on a Tuesday morning when it is quiet."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Free things that are actually good"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The NGV is free (temporary exhibitions cost money, the permanent collection does not). The State Library reading room is one of the most beautiful spaces in Australia. Most live music venues have free entry before 8pm on weeknights. The Coburg Night Market runs through summer and costs nothing to enter."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "How to find your people"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Volunteer. I mean this seriously. I found my closest friends in Melbourne through a community garden in Thornbury, not through university. The city rewards people who show up."}]
        }
      ]
    }'::jsonb,
    now() - interval '8 days' ),

  -- ── James Okonkwo — Resource ──────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000006',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'resource',
    'Melbourne Student Budget Template (Monthly)',
    'melbourne-student-budget-template',
    'A realistic monthly budget breakdown for international students in Melbourne, with rent, food, transport, and study costs. Downloadable spreadsheet included.',
    null,
    now() - interval '5 days' ),

  -- ── Priya Sharma — Resource ───────────────────────────────────────────────

  ( 'cccccccc-0000-0000-0000-000000000007',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'resource',
    'LinkedIn Profile Checklist for International Students',
    'linkedin-profile-checklist-international-students',
    'Every section of your LinkedIn profile, optimised for the Australian job market. What to include, what to leave out, and the one thing most international students forget.',
    null,
    now() - interval '3 days' );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CONTENT TAGS — assign to articles
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.content_item_tags (content_item_id, tag_slug) values
  ('cccccccc-0000-0000-0000-000000000001', 'first-year'),
  ('cccccccc-0000-0000-0000-000000000001', 'mental-health'),
  ('cccccccc-0000-0000-0000-000000000001', 'campus-life'),
  ('cccccccc-0000-0000-0000-000000000002', 'first-year'),
  ('cccccccc-0000-0000-0000-000000000002', 'academic-tips'),
  ('cccccccc-0000-0000-0000-000000000003', 'career'),
  ('cccccccc-0000-0000-0000-000000000003', 'networking'),
  ('cccccccc-0000-0000-0000-000000000003', 'visa'),
  ('cccccccc-0000-0000-0000-000000000004', 'housing'),
  ('cccccccc-0000-0000-0000-000000000004', 'first-year'),
  ('cccccccc-0000-0000-0000-000000000005', 'melbourne-city'),
  ('cccccccc-0000-0000-0000-000000000005', 'mental-health'),
  ('cccccccc-0000-0000-0000-000000000006', 'budgeting'),
  ('cccccccc-0000-0000-0000-000000000006', 'first-year'),
  ('cccccccc-0000-0000-0000-000000000007', 'career'),
  ('cccccccc-0000-0000-0000-000000000007', 'networking');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. FORUM CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.forum_categories (slug, name, description, sort_order) values
  ( 'life-in-melbourne',
    'Life in Melbourne',
    'Transport, neighbourhoods, things to do, food — everything about living in the city.',
    1 ),
  ( 'academic-survival',
    'Academic Survival',
    'Assignment help, study strategies, understanding Australian academic expectations.',
    2 ),
  ( 'visa-and-legal',
    'Visa & Legal',
    'Student visa conditions, work rights, Medicare, and navigating Australian bureaucracy.',
    3 ),
  ( 'careers-and-jobs',
    'Careers & Jobs',
    'Internships, part-time work, résumés, and building a career in Australia.',
    4 ),
  ( 'social-and-community',
    'Social & Community',
    'Making friends, fighting loneliness, clubs, events, and building your support network.',
    5 )
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. FORUM THREADS + POSTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Thread 1: Life in Melbourne
insert into public.forum_threads
  (id, category_slug, author_id, title, slug, body)
values
  ( 'dddddddd-0000-0000-0000-000000000001',
    'life-in-melbourne',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Best suburbs to live in as a student? (Not too far from Uni of Melbourne)',
    'best-suburbs-student-unimelb',
    'Hi everyone, I''m starting at Uni of Melbourne in February and currently trying to figure out where to live. My budget is around $200–$250/week for a room in a share house. I''ve been looking at Carlton, Fitzroy, Brunswick and Parkville but I''m open to suggestions. What do people actually recommend based on experience?' );

insert into public.forum_posts (id, thread_id, author_id, body) values
  ( 'eeeeeeee-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Carlton is the obvious choice — 10 minutes walk to campus, lots of students, cheap eateries on Lygon Street. The downside is that the cheapest rooms go fast in November/December. If you''re reading this in January, you might need to look at Brunswick (tram to the city, quieter, slightly cheaper) or Fitzroy (great neighbourhood, more competition for nice places). My honest recommendation: book short-term accommodation first, arrive early, and look for a place in person. Photos lie.' ),

  ( 'eeeeeeee-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'I moved to Coburg in my first year because it was the only place in my budget. The 19 tram to the city takes about 30 minutes which sounds long but you get used to it. It''s very multicultural up there and feels welcoming. Coburg farmers market on Saturdays is worth it.' ),

  ( 'eeeeeeee-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Northcote is underrated for students — cheaper than Carlton and Fitzroy, great café culture, High Street has everything you need. The 86 tram gets you to the CBD in 20 minutes. I lived there in second year and loved it.' );

-- Thread 2: Academic Survival
insert into public.forum_threads
  (id, category_slug, author_id, title, slug, body)
values
  ( 'dddddddd-0000-0000-0000-000000000002',
    'academic-survival',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'How do Australian lecturers expect you to reference? Confused about the difference between in-text and footnote styles',
    'australian-referencing-styles-confused',
    'Coming from a European university system where we used footnotes for everything. My first assignment brief says to use APA 7th edition and I''m genuinely confused. Do I put the citation inside the sentence or after? And what goes in the reference list vs the in-text citation? Sorry if this is a basic question.' );

insert into public.forum_posts (id, thread_id, author_id, body) values
  ( 'eeeeeeee-0000-0000-0000-000000000004',
    'dddddddd-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Not a basic question at all — this tripped me up in my first semester too. APA 7th uses author-date in-text citations like (Chen, 2021, p. 45), and then a full reference list at the end. No footnotes except for supplementary notes. The university library has a brilliant APA guide with examples for every source type — books, journal articles, websites, social media. Google "[your university] APA 7 guide" and bookmark it. Also: Zotero is free, syncs to your browser, and formats your references automatically. Set it up now before you need it under pressure.' ),

  ( 'eeeeeeee-0000-0000-0000-000000000005',
    'dddddddd-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'This was confusing for me too — France uses footnote systems in humanities. One thing that helped me: your subject outline will usually specify exactly which APA style it wants and sometimes links directly to the library guide. Read the whole subject outline carefully, there is usually a lot of information buried in there that lecturers assume you will find.' );

-- Thread 3: Visa & Legal
insert into public.forum_threads
  (id, category_slug, author_id, title, slug, body)
values
  ( 'dddddddd-0000-0000-0000-000000000003',
    'visa-and-legal',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Can I work more than 48 hours a fortnight if my employer really needs me during semester?',
    'work-hours-limit-student-visa-employer',
    'My part-time employer wants me to work 60 hours in a two-week period during semester because they are short-staffed. I need the money too. Is this actually enforced? What are the consequences if I go over?' );

insert into public.forum_posts (id, thread_id, author_id, body) values
  ( 'eeeeeeee-0000-0000-0000-000000000006',
    'dddddddd-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Please do not do this. I know it is tempting and I understand the money pressure is real, but the consequences are serious. Working over the fortnightly limit can result in visa cancellation — that is not an exaggeration, that is Department of Home Affairs policy. Your employer''s staffing problems are not your visa risk to take. If you are struggling financially, talk to your university''s student financial support team before you put your visa on the line. There are emergency grants, hardship loans, and food banks specifically for international students. The 48-hour limit does not apply during official university break periods — confirm your exact semester dates and plan your extra hours around those.' ),

  ( 'eeeeeeee-0000-0000-0000-000000000007',
    'dddddddd-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Adding to what James said: employers are required by law not to let you exceed the work limit. If they are pressuring you to work more hours during semester, that is on them, not on you — but you will be the one whose visa is at risk. Know your rights, and if your employer does not respect them, the Fair Work Ombudsman has an international student hotline.' );

-- Thread 4: Careers & Jobs
insert into public.forum_threads
  (id, category_slug, author_id, title, slug, body)
values
  ( 'dddddddd-0000-0000-0000-000000000004',
    'careers-and-jobs',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'How do I write a cover letter in Australia? Mine keep getting ignored',
    'cover-letter-australia-international-student',
    'I have been applying for part-time jobs and internships and I''m getting almost no responses. I think my cover letter might be the problem. In Japan we use a very formal, structured format. I''ve tried to adapt but I''m not sure what Australian employers actually want. Can anyone share what works?' );

insert into public.forum_posts (id, thread_id, author_id, body) values
  ( 'eeeeeeee-0000-0000-0000-000000000008',
    'dddddddd-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Australian cover letters are shorter and more direct than what most international students are used to. Three paragraphs is ideal: (1) what role you are applying for and one sentence on why you are interested in this specific company (research them — generic openers get deleted); (2) two or three specific examples of your experience with evidence of impact; (3) a brief close with your availability. No "To Whom It May Concern" — find the hiring manager''s name if you can. The biggest mistake I see is listing duties instead of achievements. "I managed social media" is forgettable. "I grew our Instagram engagement by 40% in three months by shifting to short-form video" is memorable. Every point should answer: so what?' ),

  ( 'eeeeeeee-0000-0000-0000-000000000009',
    'dddddddd-0000-0000-0000-000000000004',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Priya''s advice is exactly right. Also — your university careers centre will review your cover letter for free. Book an appointment before your next round of applications. They see hundreds of student applications and know exactly what local employers are looking for.' );

-- Thread 5: Social & Community
insert into public.forum_threads
  (id, category_slug, author_id, title, slug, body)
values
  ( 'dddddddd-0000-0000-0000-000000000005',
    'social-and-community',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Six months in and still haven''t made real friends. Is this just me?',
    'six-months-no-real-friends-normal',
    'I know this sounds sad but I need to ask honestly. I have been in Melbourne for six months, I go to classes, I say hi to people, I have been to a few student events — but I don''t have any friends I actually hang out with outside of uni. Everyone seems to already have their group. I''m starting to think something is wrong with me.' );

insert into public.forum_posts (id, thread_id, author_id, body) values
  ( 'eeeeeeee-0000-0000-0000-000000000010',
    'dddddddd-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'This is not just you — this is one of the most common things I hear from international students, and nobody talks about it honestly enough. Six months is not long. Most of the "groups" you see formed in the first few weeks are convenience clusters — people who sat near each other in week one. They are not necessarily the friendships that will last.

Real friendships in Melbourne tend to form through repeated low-stakes contact over time — the same running club every Saturday, the same volunteering shift every month, the same café where the staff know your order. The common thread is repetition and shared purpose, not a single big social event. If you are doing things once and then stopping, try committing to something for two months and see what grows.' ),

  ( 'eeeeeeee-0000-0000-0000-000000000011',
    'dddddddd-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'I felt this exact same way at month four. What helped me: I joined a study group for a class I was struggling in. It started as pure utility — we needed each other for exam prep — and two of those people are still my close friends two years later. Sometimes friendship sneaks in through the side door.' ),

  ( 'eeeeeeee-0000-0000-0000-000000000012',
    'dddddddd-0000-0000-0000-000000000005',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'You are not alone. I moved here from Japan and months 3–5 were the hardest. It does turn around. Sofia''s advice about committing to something for a fixed period is the best I have heard.' );

-- ─────────────────────────────────────────────────────────────────────────────
-- Done.
-- ─────────────────────────────────────────────────────────────────────────────
