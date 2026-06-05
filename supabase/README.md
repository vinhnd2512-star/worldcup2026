# Supabase Setup

Use this for the Vercel static version.

1. Create a Supabase project.
2. In SQL Editor, run `schema.sql`.
3. In SQL Editor, run `seed.sql`.
4. In SQL Editor, run `seed_bracket.sql`.
5. Create the first admin in Supabase Auth:
   - Email: `admin@worldcup.local`
   - Password: your choice
6. Find that Auth user UUID and run:

```sql
update public.profiles
set username = 'admin',
    display_name = 'Admin',
    role = 'admin',
    wallet_balance = 0
where id = '<AUTH_USER_UUID>';
```

6. In Vercel project settings, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `API_FOOTBALL_KEY`
   - `ODDS_API_KEY`
   - `FOOTBALL_DATA_API_TOKEN`

The anon key is used by the browser. The service role key is used only by the Vercel admin user creation function.

After deployment, log in as admin and create player accounts from the Admin tab. Usernames are mapped to local emails automatically, for example username `demo` logs in as `demo@worldcup.local`. Password resets are also handled from the Admin tab through a Vercel Function, so the service role key never reaches the browser.

Provider sync is handled by the Vercel Function `/api/sync-football-data`. It upserts API-FOOTBALL teams and fixtures into `teams` and `matches`, then records sync status in `sync_runs`.
