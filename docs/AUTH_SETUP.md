# Authentication Setup Guide

## Overview

DeepResearch uses [Supabase Auth](https://supabase.com/docs/guides/auth) for:
- Email/password signup and login
- Email verification
- Google OAuth
- Forgot/reset password
- Persistent JWT sessions

This guide explains exactly how to configure your Supabase project.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organisation, give the project a name, set a strong database password
4. Choose a region close to your deployment (Render is `us-east-1` by default)
5. Wait for the project to finish initialising (~2 minutes)

---

## 2. Collect Your API Keys

Go to **Project Settings → API**:

| Variable                    | Where to find it                     |
|-----------------------------|--------------------------------------|
| `SUPABASE_URL`              | "Project URL"                        |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key (secret — server only) |
| `VITE_SUPABASE_URL`         | Same as `SUPABASE_URL`               |
| `VITE_SUPABASE_ANON_KEY`    | "anon public" key (safe for browser) |

> ⚠️ **Never** expose the `service_role` key in the browser or commit it to Git.

---

## 3. Enable Email/Password Auth

1. Go to **Authentication → Providers**
2. Ensure **Email** provider is **enabled** (it is by default)
3. Under **Email**, configure:
   - ✅ **Enable email confirmations** — required for email verification
   - Set **Minimum password length** to `8`
   - Leave **Secure email change** enabled

---

## 4. Configure Google OAuth

1. In the [Google Cloud Console](https://console.cloud.google.com):
   - Create a project (or use an existing one)
   - Enable the **Google+ API** / **OAuth 2.0**
   - Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add **Authorised redirect URIs**:
     ```
     https://<your-project>.supabase.co/auth/v1/callback
     ```
   - Save — note the **Client ID** and **Client Secret**

2. In Supabase: **Authentication → Providers → Google**:
   - Enable Google
   - Paste your **Client ID** and **Client Secret**
   - Save

---

## 5. Configure Redirect URLs

Supabase needs to know which URLs are allowed for OAuth and email redirects.

Go to **Authentication → URL Configuration**:

### Site URL
Set to your primary frontend URL:
- Local dev: `http://localhost:5173`
- Production: `https://your-app.vercel.app`

### Redirect URLs (allowed list)
Add ALL of these:
```
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
http://localhost:5173/verify-email
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/reset-password
https://your-app.vercel.app/verify-email
```

> 💡 You can use wildcards: `https://*.vercel.app/**` to cover all Vercel preview deployments.

---

## 6. Email Templates (Optional but Recommended)

Go to **Authentication → Email Templates** to customise:

### Confirm Signup
Subject: `Verify your DeepResearch account`

The default template works, but ensure the redirect URL is:
```
{{ .SiteURL }}/auth/callback
```

### Reset Password
Subject: `Reset your DeepResearch password`

Ensure the redirect URL is:
```
{{ .SiteURL }}/reset-password
```

---

## 7. Environment Variables

### `apps/server/.env`
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### `apps/web/.env`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:4000
```

> Copy `.env.example` from the repo root as a starting point.

---

## 8. Local Development Checklist

- [ ] Supabase project created
- [ ] API keys copied to `.env` files
- [ ] Email provider enabled with confirmations on
- [ ] `http://localhost:5173/auth/callback` added to redirect URLs
- [ ] `http://localhost:5173/reset-password` added to redirect URLs
- [ ] Google OAuth configured (optional for local dev)
- [ ] Server started: `npm run dev:server` (port 4000)
- [ ] Frontend started: `npm run dev:web` (port 5173)

---

## 9. Testing Auth Flows

### Email/Password Signup
1. Go to `http://localhost:5173/signup`
2. Enter email + password (min 8 chars)
3. Expect: confirmation screen + email arrives
4. Click verification link → redirected to `/auth/callback` → `/dashboard`

### Email/Password Login
1. Go to `http://localhost:5173/login`
2. Enter credentials
3. Expect: redirected to `/dashboard`

### Logout
1. Click **Sign out** in the dashboard
2. Expect: redirected to `/login`

### Protected Route
1. While logged out, visit `http://localhost:5173/dashboard`
2. Expect: redirected to `/login`

### Forgot Password
1. Go to `/forgot-password`
2. Enter email
3. Expect: email arrives with reset link
4. Click link → redirected to `/reset-password`
5. Enter new password → success → redirected to `/dashboard`

### Google OAuth
1. Click **Continue with Google** on login/signup
2. Complete Google OAuth flow
3. Expect: redirected to `/auth/callback` → `/dashboard`

### GET /api/v1/auth/me
```bash
# Get token from browser console: (await supabase.auth.getSession()).data.session.access_token
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# { "success": true, "data": { "id": "...", "email": "...", "emailVerified": true, "createdAt": "..." } }

# Without token:
curl http://localhost:4000/api/v1/auth/me
# Expected: 401
```

---

## 10. Production Deployment

### Vercel (Frontend)
Add environment variables in the Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (your Render backend URL)

### Render (Backend)
Add environment variables in the Render dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` (your Vercel URL)
- `NODE_ENV=production`

Update Supabase redirect URLs to include your production domains.

---

## Security Notes

- The `service_role` key has full database access and bypasses RLS. It must only exist in the server environment.
- The `anon` key is safe to expose in the browser — Supabase enforces Row Level Security on top of it.
- All JWTs are short-lived. The Supabase JS SDK handles automatic refresh transparently.
- The server verifies JWTs by calling `supabaseAdmin.auth.getUser(token)` — this validates the signature against Supabase's own JWKS endpoint, not a local secret.
