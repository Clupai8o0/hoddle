-- ─────────────────────────────────────────────────────────────────
-- Hoddle Melbourne — Development Seed
-- Run automatically by: supabase db reset
-- All inserts bypass RLS (service role context).
-- Forum categories are already seeded in the phase2 migration.
-- ─────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────
-- Fixed UUIDs
-- ─────────────────────────────────────────

-- Mentors
-- m1: Wei Lin        (CompSci / UniMelb)
-- m2: Priya Sharma   (Finance / Monash)
-- m3: Anh Nguyen     (Architecture / RMIT)

-- Students
-- s1: Ji-ho Park     (Engineering / UniMelb)
-- s2: Fatima Hassan  (Medicine / Monash)
-- s3: Carlos Mendez  (Commerce / UniMelb)
-- s4: Mei Tanaka     (Arts / RMIT)
-- s5: Arjun Patel    (IT / Deakin)

do $$
declare
  m1 uuid := '11111111-0000-0000-0000-000000000001';
  m2 uuid := '11111111-0000-0000-0000-000000000002';
  m3 uuid := '11111111-0000-0000-0000-000000000003';
  s1 uuid := '22222222-0000-0000-0000-000000000001';
  s2 uuid := '22222222-0000-0000-0000-000000000002';
  s3 uuid := '22222222-0000-0000-0000-000000000003';
  s4 uuid := '22222222-0000-0000-0000-000000000004';
  s5 uuid := '22222222-0000-0000-0000-000000000005';

  -- content item ids
  c1 uuid := '33333333-0000-0000-0000-000000000001';
  c2 uuid := '33333333-0000-0000-0000-000000000002';
  c3 uuid := '33333333-0000-0000-0000-000000000003';
  c4 uuid := '33333333-0000-0000-0000-000000000004';
  c5 uuid := '33333333-0000-0000-0000-000000000005';
  c6 uuid := '33333333-0000-0000-0000-000000000006';

  -- thread ids
  t1 uuid := '44444444-0000-0000-0000-000000000001';
  t2 uuid := '44444444-0000-0000-0000-000000000002';
  t3 uuid := '44444444-0000-0000-0000-000000000003';
  t4 uuid := '44444444-0000-0000-0000-000000000004';
  t5 uuid := '44444444-0000-0000-0000-000000000005';

  -- post ids
  p1 uuid := '55555555-0000-0000-0000-000000000001';
  p2 uuid := '55555555-0000-0000-0000-000000000002';
  p3 uuid := '55555555-0000-0000-0000-000000000003';
  p4 uuid := '55555555-0000-0000-0000-000000000004';
  p5 uuid := '55555555-0000-0000-0000-000000000005';
  p6 uuid := '55555555-0000-0000-0000-000000000006';
  p7 uuid := '55555555-0000-0000-0000-000000000007';
  p8 uuid := '55555555-0000-0000-0000-000000000008';

  -- story ids
  st1 uuid := '66666666-0000-0000-0000-000000000001';
  st2 uuid := '66666666-0000-0000-0000-000000000002';

  -- session ids
  se1 uuid := '77777777-0000-0000-0000-000000000001';
  se2 uuid := '77777777-0000-0000-0000-000000000002';
  se3 uuid := '77777777-0000-0000-0000-000000000003';
  se4 uuid := '77777777-0000-0000-0000-000000000004';

begin

-- ─────────────────────────────────────────
-- auth.users  (minimal required fields)
-- ─────────────────────────────────────────

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, aud, role
) values
  (m1, 'wei.lin@hoddle.dev',    '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (m2, 'priya.sharma@hoddle.dev','', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (m3, 'anh.nguyen@hoddle.dev', '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (s1, 'jiho.park@hoddle.dev',  '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (s2, 'fatima.hassan@hoddle.dev','',now(),'{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (s3, 'carlos.mendez@hoddle.dev','',now(),'{"provider":"email"}','{}', now(), now(), 'authenticated', 'authenticated'),
  (s4, 'mei.tanaka@hoddle.dev', '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (s5, 'arjun.patel@hoddle.dev','', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- profiles  (trigger creates bare rows; we update them)
-- ─────────────────────────────────────────

update public.profiles set
  full_name        = 'Wei Lin',
  country_of_origin= 'China',
  university       = 'University of Melbourne',
  year_of_study    = 4,
  role             = 'mentor',
  onboarded_at     = now() - interval '18 months'
where id = m1;

update public.profiles set
  full_name        = 'Priya Sharma',
  country_of_origin= 'India',
  university       = 'Monash University',
  year_of_study    = 3,
  role             = 'mentor',
  onboarded_at     = now() - interval '12 months'
where id = m2;

update public.profiles set
  full_name        = 'Anh Nguyen',
  country_of_origin= 'Vietnam',
  university       = 'RMIT University',
  year_of_study    = 4,
  role             = 'mentor',
  onboarded_at     = now() - interval '8 months'
where id = m3;

update public.profiles set
  full_name        = 'Ji-ho Park',
  country_of_origin= 'South Korea',
  university       = 'University of Melbourne',
  year_of_study    = 1,
  role             = 'student',
  onboarded_at     = now() - interval '3 months'
where id = s1;

update public.profiles set
  full_name        = 'Fatima Hassan',
  country_of_origin= 'Nigeria',
  university       = 'Monash University',
  year_of_study    = 1,
  role             = 'student',
  onboarded_at     = now() - interval '2 months'
where id = s2;

update public.profiles set
  full_name        = 'Carlos Mendez',
  country_of_origin= 'Brazil',
  university       = 'University of Melbourne',
  year_of_study    = 1,
  role             = 'student',
  onboarded_at     = now() - interval '1 month'
where id = s3;

update public.profiles set
  full_name        = 'Mei Tanaka',
  country_of_origin= 'Japan',
  university       = 'RMIT University',
  year_of_study    = 1,
  role             = 'student',
  onboarded_at     = now() - interval '6 weeks'
where id = s4;

update public.profiles set
  full_name        = 'Arjun Patel',
  country_of_origin= 'India',
  university       = 'Deakin University',
  year_of_study    = 1,
  role             = 'student',
  onboarded_at     = now() - interval '5 weeks'
where id = s5;

-- ─────────────────────────────────────────
-- mentors
-- ─────────────────────────────────────────

insert into public.mentors (profile_id, slug, headline, bio, expertise, hometown, current_position, verified_at, accepting_questions) values
(
  m1, 'wei-lin',
  'Software engineer at Canva — I figured out Melbourne so you don''t have to',
  'I arrived in Melbourne from Chengdu with one suitcase, zero friends, and a deep fear of tram inspectors. Four years later I''m graduating with a first-class CS degree and a grad offer at Canva. I want to help you skip the mistakes I made in semester one — academic integrity traps, the assignment extension email nobody tells you about, and how to actually meet people outside your degree.',
  array['software-engineering', 'internships', 'academic-life', 'networking'],
  'Chengdu, China',
  'Incoming Software Engineer, Canva',
  now() - interval '17 months',
  true
),
(
  m2, 'priya-sharma',
  'Finance grad turned CPA candidate — your guide to Melbourne''s corporate world',
  'Moving from Mumbai to Clayton for a Monash commerce degree was a culture shock in every direction. I landed two internships in my second year by learning how Australian workplaces actually communicate — it''s not what you expect. Now I''m a CPA candidate at Deloitte and I mentor students on résumés, cover letters, and the unspoken rules of Melbourne''s corporate culture.',
  array['finance', 'career', 'internships', 'professional-communication'],
  'Mumbai, India',
  'Graduate Accountant, Deloitte Melbourne',
  now() - interval '10 months',
  true
),
(
  m3, 'anh-nguyen',
  'Architecture student at RMIT — design, rent, and surviving the creative life',
  'I came from Ho Chi Minh City to study architecture and discovered that Melbourne rents are almost as brutal as the studio deadlines. I''ve navigated share-housing in Brunswick, Footscray, and Collingwood, survived three all-nighters in the RMIT design labs, and somehow kept a 75 WAM. If you''re in a creative degree — or just drowning in housing stress — I can help.',
  array['architecture', 'design', 'housing', 'creative-study'],
  'Ho Chi Minh City, Vietnam',
  'Architecture Student (Year 4), RMIT University',
  now() - interval '7 months',
  true
)
on conflict (profile_id) do nothing;

-- ─────────────────────────────────────────
-- content_tags
-- ─────────────────────────────────────────

insert into public.content_tags (slug, label) values
  ('internships',              'Internships'),
  ('academic-writing',         'Academic Writing'),
  ('mental-health',            'Mental Health'),
  ('housing',                  'Housing'),
  ('career',                   'Career'),
  ('networking',               'Networking'),
  ('visa',                     'Visa & Admin'),
  ('software-engineering',     'Software Engineering'),
  ('finance',                  'Finance'),
  ('design',                   'Design')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────
-- content_items
-- ─────────────────────────────────────────

insert into public.content_items (id, mentor_id, type, title, slug, excerpt, body, view_count, published_at) values
(
  c1, m1, 'article',
  'The academic integrity rules that tripped me up in Week 3',
  'academic-integrity-week-3',
  'Nobody warns you that collaborating on assignments works differently here. Here''s what I wish I''d known before I submitted my first lab report.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"In China, study groups mean you help each other understand the material. In Australia, that same behaviour can be classified as collusion depending on the assignment instructions. I learned this the hard way in Week 3 of my first semester."}]},{"type":"paragraph","content":[{"type":"text","text":"The first thing to do when you receive any assignment is read the collaboration policy — not the task itself, the collaboration policy. It will tell you exactly what you can and cannot discuss with classmates. Some assignments allow discussion of concepts but require individual writeups. Some require complete silence. Some actively encourage group work. They are not all the same."}]},{"type":"paragraph","content":[{"type":"text","text":"The second thing: turnitin is not the only plagiarism check. Code plagiarism tools like MOSS flag similar logic structures even if you rename every variable. Write your own code from scratch, even if a friend explains the approach."}]},{"type":"paragraph","content":[{"type":"text","text":"If you are ever unsure, email your subject coordinator before you submit. Keep that email. It takes three minutes and can save you from an academic misconduct hearing."}]}]}',
  412,
  now() - interval '14 months'
),
(
  c2, m1, 'article',
  'How I landed my Canva internship without a referral',
  'canva-internship-no-referral',
  'Cold applications work — but only if you do them properly. Here''s the exact process I used.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"I applied to 47 internships in second year. I got two interviews. I got one offer. That''s not a failure rate — that''s roughly the conversion rate for cold applications at top Melbourne tech companies. Here is what I did differently on those two applications."}]},{"type":"paragraph","content":[{"type":"text","text":"First: I tailored every cover letter to a specific team, not the company. I read engineering blogs, watched conference talks on YouTube, and mentioned a specific problem the team was publicly solving. Generic letters go to the bottom of the pile."}]},{"type":"paragraph","content":[{"type":"text","text":"Second: GitHub matters more than GPA. I built three small projects that were actually usable — a CLI tool, a web scraper with a clean README, and an open-source contribution to a project the company used. Recruiters at tech companies actually check these."}]},{"type":"paragraph","content":[{"type":"text","text":"Third: I practised LeetCode, but not randomly. I picked 30 medium-difficulty problems in arrays, trees, and graphs and did them until I could explain my approach in plain English. The interview is as much about communication as it is about code."}]}]}',
  287,
  now() - interval '8 months'
),
(
  c3, m2, 'article',
  'What nobody tells you about professional communication in Australian workplaces',
  'professional-communication-australia',
  'Direct feedback, first-name culture, and the art of "no worries" — understanding Australian workplace norms will change how you present yourself.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"When I started my first internship in Collins Street, I was confused. My manager said my report was \"pretty good\" and I thought that meant it was fine. It meant she had significant concerns and expected me to ask for detailed feedback. I did not ask. The report was redone by someone else."}]},{"type":"paragraph","content":[{"type":"text","text":"Australian professional communication is indirect about criticism and direct about almost everything else. \"That''s interesting\" can mean \"I disagree entirely\". \"We should catch up about this\" means it is a problem. Learning to read these signals took me half a year."}]},{"type":"paragraph","content":[{"type":"text","text":"On the other hand, hierarchy is much flatter than in India. You call your manager by their first name on day one. You can disagree with a senior in a meeting if you do it respectfully. Proactively sharing your ideas is expected — waiting to be asked to speak looks like disengagement."}]},{"type":"paragraph","content":[{"type":"text","text":"My practical advice: in your first month, ask your manager explicitly how they prefer to give feedback. Say \"I want to make sure I''m reading your feedback correctly — can you be direct with me if something isn''t hitting the mark?\" Most Australian managers will appreciate this and shift their communication style accordingly."}]}]}',
  531,
  now() - interval '6 months'
),
(
  c4, m2, 'resource',
  'Melbourne Internship Application Tracker (2026 edition)',
  'internship-tracker-2026',
  'A spreadsheet template for tracking 50+ applications across the big four, boutique firms, and tech companies hiring in Melbourne.',
  null,
  89,
  now() - interval '4 months'
),
(
  c5, m3, 'article',
  'How to find a room in Melbourne without getting scammed',
  'finding-a-room-melbourne-no-scam',
  'Facebook groups, fake listings, and agency fees — what I learned finding four different share houses across three years.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"The first listing I responded to when I arrived in Melbourne was a scam. Beautiful apartment in Fitzroy, $200 per week, the landlord was currently overseas. I only realised when a friend who''d been here longer saw the email chain and laughed. Here is what to look for."}]},{"type":"paragraph","content":[{"type":"text","text":"Legitimate share houses in Melbourne are listed on Flatmates.com.au and Domain.com.au. Facebook Marketplace listings exist and some are real, but the scam rate is higher — never pay a deposit before an in-person inspection."}]},{"type":"paragraph","content":[{"type":"text","text":"Budget expectations for 2026: a room in Brunswick or Footscray runs $250–320 per week including bills. Carlton and Fitzroy are $300–380. South Yarra and Richmond push past $400. If a listing is more than 20% below the suburb average, be suspicious."}]},{"type":"paragraph","content":[{"type":"text","text":"When you inspect a room, check: water pressure, mobile reception, distance to a tram or train stop, whether the kitchen is clean, and whether the existing housemates are actually home. A house showing you around without its current tenants is a red flag."}]},{"type":"paragraph","content":[{"type":"text","text":"Finally: sign a lease, not just a verbal agreement. You are entitled to a Residential Tenancy Agreement under Victorian law regardless of whether you are on a student visa. CAV (Consumer Affairs Victoria) has free templates and a hotline if a landlord refuses."}]}]}',
  698,
  now() - interval '5 months'
),
(
  c6, m3, 'video',
  'Studio survival: my RMIT all-nighter toolkit',
  'rmit-allnighter-toolkit',
  'What I eat, how I stay awake, and when I know it''s time to go home — 45 minutes of real talk about creative-degree burnout.',
  null,
  203,
  now() - interval '2 months'
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- content_item_tags
-- ─────────────────────────────────────────

insert into public.content_item_tags (content_item_id, tag_slug) values
  (c1, 'academic-writing'),
  (c2, 'internships'),
  (c2, 'software-engineering'),
  (c2, 'career'),
  (c3, 'career'),
  (c3, 'networking'),
  (c4, 'internships'),
  (c4, 'finance'),
  (c4, 'career'),
  (c5, 'housing'),
  (c6, 'mental-health'),
  (c6, 'design')
on conflict do nothing;

-- ─────────────────────────────────────────
-- forum_threads
-- ─────────────────────────────────────────

insert into public.forum_threads (id, category_slug, author_id, title, slug, body, pinned, last_activity_at, created_at) values
(
  t1, 'first-semester-struggles', s1,
  'Did anyone else completely blank in their first tutorial?',
  'blanked-in-first-tutorial',
  'I''m an engineering student at UniMelb. My first tutorial was last week and the tutor asked a question and the whole room went silent and I just... froze. Back home I would have answered immediately. Here I felt like I had to translate everything twice — once from Korean to English, and once from my way of thinking to what I thought the tutor wanted. Is this normal? Does it get better?',
  false,
  now() - interval '6 days',
  now() - interval '7 days'
),
(
  t2, 'career-and-internships', s2,
  'How do you explain gaps in your CV when you''ve just arrived?',
  'cv-gaps-just-arrived',
  'I''m applying for a part-time admin role to help cover living costs. My CV has a 6-month gap between finishing secondary school in Lagos and starting here at Monash. Every application form asks me to explain employment gaps. I wasn''t working — I was preparing to move countries, doing visa paperwork, and saying goodbye to my family. How do I write this in a way that sounds professional?',
  false,
  now() - interval '4 days',
  now() - interval '5 days'
),
(
  t3, 'living-in-melbourne', s3,
  'Best cheap eats near UniMelb that aren''t just meal deals?',
  'cheap-eats-near-unimelb',
  'I''ve eaten at the union building every single day this week and I can''t do it anymore. I''m on a tight budget (trying to keep food under $12 a meal) but I want something that actually tastes like food. I''m in Carlton/Parkville area. Brazilian food doesn''t really exist here at that price point unfortunately. What are people actually eating?',
  false,
  now() - interval '2 days',
  now() - interval '3 days'
),
(
  t4, 'academic-writing', s4,
  'My lecturer said my essay was "too descriptive" — what does that even mean?',
  'essay-too-descriptive-help',
  'I got feedback on my first essay at RMIT saying it was "too descriptive and not analytical enough." I don''t understand the difference. I described the design movement in detail with lots of facts and dates. My lecturer says I need to "develop an argument." I thought essays were about presenting information? I''m really confused. Can someone explain what Australian universities want?',
  false,
  now() - interval '12 hours',
  now() - interval '1 day'
),
(
  t5, 'visa-and-admin', s5,
  'Medicare — do international students actually qualify?',
  'medicare-international-students',
  'I''ve seen conflicting information online. Some sources say students from certain countries get Medicare through a reciprocal agreement, others say we don''t qualify at all. I''m from India, studying at Deakin. I went to a GP last week and paid $85 out of pocket and I''m wondering if I should have been bulk billed. Does anyone know the actual situation?',
  false,
  now() - interval '1 hour',
  now() - interval '2 hours'
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- forum_posts (replies)
-- ─────────────────────────────────────────

insert into public.forum_posts (id, thread_id, author_id, body, created_at) values
(
  p1, t1, m1,
  'It gets so much better. I froze in every single tutorial for the first four weeks. What helped me was realising that Australian students freeze too — they''re just better at hiding it. The classroom culture here rewards attempting an answer even if it''s wrong, which is the opposite of what most of us were taught. My tip: prepare one question or comment before every tutorial, even just "can you explain why X works this way?" It gives you something to say that feels safe.',
  now() - interval '6 days'
),
(
  p2, t1, s3,
  'Same experience here from Brazil. It does get better. By week 6 I started thinking of tutorials as conversations rather than tests and that helped a lot.',
  now() - interval '5 days'
),
(
  p3, t2, m2,
  'This is a very common situation and you can handle it well. For a gap like yours, write something like: "Relocated internationally from Nigeria to Australia; managed visa, pre-departure administration, and university enrolment process (Jan–July 2025)." That''s honest, professional, and shows initiative. Recruiters who work with international students see this constantly. If the form has a free-text box for explanation, one sentence is enough — don''t over-explain.',
  now() - interval '4 days'
),
(
  p4, t3, m3,
  'Lygon Street is right there and a lot of people walk past it, but the real cheap eats are a block or two back. Try the Vietnamese places on Elgin Street — pho and banh mi for under $10. Ying Thai on Lygon does a lunch special. If you''re willing to tram to North Melbourne, the options expand a lot. Also: the Prahran Market and Queen Vic Market have cheap fresh produce if you''re cooking at home.',
  now() - interval '2 days'
),
(
  p5, t4, m3,
  '"Descriptive" means you''re reporting what happened or what exists. "Analytical" means you''re making a claim about why it matters, what it means, or how to evaluate it. Example: describing is saying "The Bauhaus movement began in 1919 in Weimar." Analysing is saying "The Bauhaus''s Weimar origins shaped its obsession with mass production because the school was founded in a city with no major industrial base, forcing its designers to think in systems rather than objects." You need a sentence that starts with "because", "therefore", "this suggests", or "this reveals". That''s your signal that you''re analysing.',
  now() - interval '10 hours'
),
(
  p6, t4, s1,
  'This explanation actually just fixed something I''ve been confused about for months. Thank you.',
  now() - interval '8 hours'
),
(
  p7, t5, m2,
  'India does not have a Medicare reciprocal agreement with Australia, so unfortunately you are not eligible for bulk billing as a standard Medicare benefit. However — check whether your university health service offers subsidised GP appointments. Monash, UniMelb, and most G8 universities have on-campus clinics that bulk bill enrolled students regardless of visa type. Deakin has a health centre on the Burwood and Geelong campuses. That $85 should have been avoidable.',
  now() - interval '45 minutes'
),
(
  p8, t5, s3,
  'Also worth knowing: if you have OSHC (which is mandatory for student visas), it covers some GP costs. Read your policy — you might be able to claim back part of that $85.',
  now() - interval '30 minutes'
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- forum_reactions
-- ─────────────────────────────────────────

insert into public.forum_reactions (post_id, profile_id, reaction) values
  (p1, s1, 'helpful'),
  (p1, s2, 'helpful'),
  (p1, s4, 'thanks'),
  (p1, s5, 'heart'),
  (p3, s2, 'thanks'),
  (p3, s1, 'helpful'),
  (p5, s4, 'helpful'),
  (p5, s1, 'helpful'),
  (p5, s3, 'helpful'),
  (p6, m3, 'heart'),
  (p7, s5, 'thanks'),
  (p7, s2, 'helpful'),
  (p8, s5, 'helpful')
on conflict do nothing;

-- ─────────────────────────────────────────
-- success_stories
-- ─────────────────────────────────────────

insert into public.success_stories (id, author_id, title, slug, body, milestones, status, featured, published_at) values
(
  st1, m1,
  'From 2am noodles in a Carlton share house to a grad offer at Canva',
  'wei-lin-canva-grad-offer',
  'I didn''t come to Melbourne to be a success story. I came because my parents saved for years so I could, and I wasn''t going to waste it.

The first semester nearly broke me. My written English was functional but not academic. I failed my first assignment because I didn''t understand what "critical analysis" meant — I described things rather than evaluating them. I stayed up until 2am most nights not because I was working efficiently but because I was scared. Scared of falling behind, scared of asking for help and sounding stupid, scared of the gap between who I was and who the university seemed to expect me to be.

What changed was small and specific. A tutor in my algorithms subject pulled me aside after a practical and said my code was good but my explanations were poor, and she offered to meet with me to help me learn to think out loud in English. I almost didn''t go. I went. That hour changed the direction of my degree.

By third year I had a 79 WAM, three GitHub projects with actual users, and an internship lined up at a startup in Richmond. By fourth year I had a grad offer from Canva. The gap between that first failed assignment and that offer is not talent — it''s the willingness to ask one person for help, one time, when you feel like you can''t.

If you''re in first semester and it feels impossible, I need you to know: it is not. Ask someone. Anyone. The system here will work for you if you engage with it.',
  array[
    'Survived first semester despite failing first assignment',
    'Joined the CS Mentoring Program in second year',
    'Landed first internship after 47 applications',
    'Achieved 79 WAM by end of third year',
    'Accepted graduate offer at Canva'
  ],
  'published',
  true,
  now() - interval '6 months'
),
(
  st2, m2,
  'The cover letter that got me into Deloitte — and what I learned from the 40 that didn''t',
  'priya-sharma-deloitte-cover-letter',
  'I sent 41 job applications in my second year. I got one offer. I am going to tell you why.

Applications 1 through 38 were good applications. Clear formatting, correct grammar, genuine enthusiasm. They went nowhere. I know why: they were about me, not about the firm. They told the recruiter that I was hardworking and detail-oriented and passionate about finance. So did every other application they received.

Application 39 was different. I had spent three evenings reading Deloitte''s published reports on financial services regulation in Australia. I had noticed that their team was increasingly writing about superannuation law changes coming in 2027. My cover letter''s second paragraph was: "The proposed Your Future, Your Super amendments create a compliance workload that I understand your financial services team is actively building capacity for. My experience modelling superannuation scenarios for my honours research means I can contribute to that work from day one."

They called me within 48 hours.

The lesson is not "be smarter" or "know more." The lesson is: read what the team is actually working on, find one specific connection to something you have genuinely done, and lead with that. One real sentence beats three paragraphs of adjectives every time.

I was not the most qualified applicant. I was the one who made the recruiter feel like I understood their actual problem.',
  array[
    'Completed 38 unsuccessful applications — learned from each one',
    'Researched team-specific work at target firms',
    'Landed Deloitte interview with tailored cover letter',
    'Accepted graduate accountant position',
    'Currently studying for CPA qualification'
  ],
  'published',
  false,
  now() - interval '3 months'
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- live_sessions
-- ─────────────────────────────────────────

insert into public.live_sessions (id, mentor_id, title, description, scheduled_at, duration_minutes, max_attendees, status) values
(
  se1, m1,
  'Breaking into tech internships: what actually works',
  'A live Q&A covering job applications, GitHub portfolios, technical interviews, and how to convert an internship into a grad offer. Bring your specific questions — this is not a lecture.',
  now() + interval '5 days',
  60,
  40,
  'scheduled'
),
(
  se2, m2,
  'CV and cover letter clinic: finance edition',
  'Live review session. Share your CV or cover letter in the chat and I''ll give you direct, actionable feedback in real time. We''ll also go through the five things Melbourne finance recruiters are actually looking for in 2026.',
  now() + interval '12 days',
  90,
  25,
  'scheduled'
),
(
  se3, m3,
  'Share housing in Melbourne: your questions answered',
  'Everything about finding a room, reading a lease, knowing your rights as a tenant, and surviving difficult housemates. I''ve lived in four different share houses across three years — I''ve seen things.',
  now() + interval '3 days',
  45,
  50,
  'scheduled'
),
(
  se4, m1,
  'How to actually use LeetCode (without losing your mind)',
  'A walkthrough of the exact 30-problem set I used to prepare for technical interviews, with live problem-solving and commentary on how to communicate your thinking to interviewers.',
  now() - interval '2 weeks',
  60,
  35,
  'completed'
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- session_registrations
-- ─────────────────────────────────────────

insert into public.session_registrations (session_id, profile_id, attended) values
  (se1, s1, false),
  (se1, s2, false),
  (se1, s3, false),
  (se1, s5, false),
  (se2, s2, false),
  (se2, s4, false),
  (se2, s5, false),
  (se3, s3, false),
  (se3, s4, false),
  (se4, s1, true),
  (se4, s2, true),
  (se4, s3, false),
  (se4, s5, true)
on conflict do nothing;

-- ─────────────────────────────────────────
-- mentor_follows
-- ─────────────────────────────────────────

insert into public.mentor_follows (follower_id, mentor_id) values
  (s1, m1),
  (s1, m3),
  (s2, m2),
  (s2, m1),
  (s3, m1),
  (s3, m2),
  (s3, m3),
  (s4, m3),
  (s4, m2),
  (s5, m2),
  (s5, m1)
on conflict do nothing;

end $$;

-- ─────────────────────────────────────────────────────────────────
-- Homepage placeholder mentors: Raj, Sarah, Minh
-- These match the static cards that were on the landing page.
-- ─────────────────────────────────────────────────────────────────

do $$
declare
  m4 uuid := '11111111-0000-0000-0000-000000000004';
  m5 uuid := '11111111-0000-0000-0000-000000000005';
  m6 uuid := '11111111-0000-0000-0000-000000000006';
begin

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, aud, role
) values
  (m4, 'raj.patel@hoddle.dev',   '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (m5, 'sarah.chen@hoddle.dev',  '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated'),
  (m6, 'minh.tran@hoddle.dev',   '', now(), '{"provider":"email"}', '{}', now(), now(), 'authenticated', 'authenticated')
on conflict (id) do nothing;

update public.profiles set
  full_name         = 'Raj Patel',
  country_of_origin = 'India',
  university        = 'Monash University',
  year_of_study     = 4,
  role              = 'mentor',
  onboarded_at      = now() - interval '20 months'
where id = m4;

update public.profiles set
  full_name         = 'Sarah Chen',
  country_of_origin = 'China',
  university        = 'University of Melbourne',
  year_of_study     = 3,
  role              = 'mentor',
  onboarded_at      = now() - interval '15 months'
where id = m5;

update public.profiles set
  full_name         = 'Minh Tran',
  country_of_origin = 'Vietnam',
  university        = 'RMIT University',
  year_of_study     = 4,
  role              = 'mentor',
  onboarded_at      = now() - interval '11 months'
where id = m6;

insert into public.mentors (profile_id, slug, headline, bio, expertise, hometown, current_position, verified_at, accepting_questions) values
(
  m4, 'raj-patel',
  'I bombed my first essay. Here''s exactly how I turned it around.',
  'Landed in Clayton from Mumbai expecting my Distinction streak to follow me. It did not. My first essay was a Pass — the lowest mark I''d ever received. What I learned in the next six months about academic writing, asking for help, and understanding Australian grading standards completely changed how I approach my studies. Now in my final year of engineering with a 78 WAM and two internship offers. Happy to share everything I know.',
  array['academic-writing', 'engineering', 'internships', 'mental-health'],
  'Mumbai, India',
  'Engineering Student (Year 4), Monash University',
  now() - interval '19 months',
  true
),
(
  m5, 'sarah-chen',
  'Time management is the secret weapon nobody tells you about.',
  'I arrived from Shanghai thinking Australian uni would be easier than my gaokao preparation. I was wrong in ways I did not expect. The volume of self-directed study, the lack of daily structure, the expectation that you manage your own time completely — it took me a full semester to build systems that actually worked. Now I have a part-time role at a Big Four firm, a 3.8 GPA, and a time management framework I''ve shared with over 200 students.',
  array['finance', 'career', 'networking', 'academic-writing'],
  'Shanghai, China',
  'Business Student (Year 3), University of Melbourne',
  now() - interval '14 months',
  true
),
(
  m6, 'minh-tran',
  'Don''t wait until graduation to start building your career.',
  'I spent my first year at RMIT just surviving — assignments, rent, homesickness. I told myself I''d focus on my career after I graduated. That was the worst plan I could have made. By the time I started building projects, going to meetups, and doing open-source work in second year, I was already a year behind the students who''d been doing it since week one. Here''s what I''d do differently — and what you can start today.',
  array['software-engineering', 'internships', 'career', 'networking'],
  'Hanoi, Vietnam',
  'IT Student (Year 4), RMIT University',
  now() - interval '10 months',
  true
)
on conflict (profile_id) do nothing;

end $$;
