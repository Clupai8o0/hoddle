# URL Configuration

The app URL is managed via two environment variables. When the deployment domain changes (e.g. from `hoddle-jet.vercel.app` to a custom domain), update both variables in Vercel and in Supabase Auth settings.

## Environment variables

| Variable | Purpose | Current value |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | OG metadata, email CTAs, notification link base | `https://hoddle-jet.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Supabase auth magic-link redirect base | `https://hoddle-jet.vercel.app` |

Both must have **no trailing slash**.

---

## Files that read `NEXT_PUBLIC_APP_URL`

| File | How it's used |
|---|---|
| `app/layout.tsx` | `metadataBase` and OG `url` for the root layout |
| `app/(marketing)/about/page.tsx` | OG `url` for the `/about` page |
| `app/(marketing)/apply/page.tsx` | OG `url` for the `/apply` page |
| `lib/email/templates/notification-emails.ts` | `BASE_URL` — all email CTA link hrefs (reply-to-message, forum links, etc.) |

---

## Checklist when switching domains

1. Update `NEXT_PUBLIC_APP_URL` in Vercel → Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_SITE_URL` in Vercel (same place)
3. In Supabase Dashboard → Authentication → URL Configuration:
   - Set **Site URL** to the new domain
   - Update **Redirect URLs** to include `<new-domain>/api/auth/callback` and `<new-domain>/api/auth/mentor-callback`
4. Redeploy on Vercel (env var changes take effect on next deploy)

---

## Admin email

Mentor application notification emails go to `ADMIN_EMAIL`. If unset, the code falls back to `RESEND_FROM_EMAIL`, then `GMAIL_USER`. Set `ADMIN_EMAIL` explicitly in production.

Relevant file: `lib/actions/mentor-application.ts`
