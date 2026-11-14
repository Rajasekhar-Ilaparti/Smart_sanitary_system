# Putting Clean Gudlavalleru online (Supabase + Netlify)

When it's online, the app runs like this:
- **Netlify** hosts the pages and runs the API (`netlify/functions/api.js`).
- **Supabase** stores the reports, accounts and photos.
- The site gets an **https** address, so **automatic GPS works on phones** (it doesn't over Wi-Fi at `http://192.168.x.x`).

`START.bat` still works on your computer with the local `data` folder, so you can still present offline.

You need free accounts on https://supabase.com, https://github.com and https://netlify.com. Allow about 20 minutes.

---

## Before you start: change the passwords
The demo passwords (`admin123`, `north123`, `worker123`, ...) are written in `HOW-TO-RUN.md`, so anyone who reads it could log in to your live site.
1. Open `demo-accounts.js` and give every account a new password (at least 6 characters).
2. Do this **before the first deploy**. The accounts are created from this file the first time the site opens.

Workers can change their own password later in the worker app, under **Profile**. The department can reset workers' passwords under **Workers**.

---

## Step 1: Supabase (database and photos)
1. Go to https://supabase.com, then **New project**.
   - Name: `clean-gudlavalleru`
   - Database password: make a strong one and save it somewhere
   - Region: **South Asia (Mumbai)**, the closest to Gudlavalleru
2. Wait about 2 minutes while the project is created.
3. Open **SQL Editor** in the left menu, then **New query**. Paste everything from `supabase/setup.sql` and click **Run**. It should say *Success*.
   This creates the tables and a **photos** storage bucket, and locks the tables so browsers can't read them directly.
4. Open **Project Settings**, then **API** (called **API Keys** in newer projects), and copy two values:
   - **Project URL**, for example `https://abcdefgh.supabase.co`
   - **service_role** key (the secret one, *not* the `anon` / publishable key)

> ⚠️ The service_role key can read and change everything. Put it only in Netlify's settings (step 3). Never put it in `public/` files, GitHub or chat messages.

## Step 2: Put the code on GitHub
Netlify deploys from a GitHub repository.
1. Install **GitHub Desktop** (https://desktop.github.com) and sign in.
2. Click **File**, then **Add local repository**, and choose this project folder. When it says it isn't a repository, click **create a repository**.
   - Keep it **Private**.
   - The `.gitignore` file already leaves out the `data` folder and `.env`, so your local reports and keys stay on your computer.
3. Click **Commit to main**, then **Publish repository**, and keep **Keep this code private** ticked.

> Don't use GitHub's website "Upload files" button. It ignores `.gitignore` and would upload the `data` folder.

## Step 3: Netlify
1. Go to https://app.netlify.com, then **Add new site**, then **Import an existing project**, then **GitHub**. Choose your repository.
2. Leave the build settings as they are. `netlify.toml` already sets them: publish folder `public`, functions in `netlify/functions`.
3. Before deploying, open **Add environment variables** (or after deploying: **Site configuration**, then **Environment variables**) and add:
   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL from step 1 |
   | `SUPABASE_SERVICE_KEY` | the service_role key from step 1 (tick **Contains secret values**) |
4. Click **Deploy**. After about a minute you get an address like `https://clean-gudlavalleru.netlify.app`. You can rename it under **Site configuration**, then **Change site name**.

> Netlify's drag-and-drop "Deploy manually" page does not run the API function. Use the GitHub import.

If you added the variables after the first deploy, go to **Deploys**, then **Trigger deploy**, then **Deploy site** once.

## Step 4: First visit
Open your Netlify address. The first visit takes a few seconds, because it creates the accounts from `demo-accounts.js` and the 7 sample reports with photos. After that:
- `https://your-site.netlify.app/` is the home page
- `/report`, `/department` and `/worker` are the other pages, as before

In Supabase, **Table Editor** now shows `gw_users`, `gw_reports` and `gw_sessions`, and **Storage**, then **photos**, shows the photos.

---

## Everyday things
- **Update the site:** change files, then in GitHub Desktop click **Commit** and **Push**. Netlify redeploys automatically in about a minute.
- **Start again with fresh sample data:** in Supabase, open **SQL Editor**, run `supabase/reset.sql`, then open the website once. This deletes all reports and accounts.
- **Real use (not a classroom demo):** set `DEMO_MODE: false` in `config.js`. Workers then *must* be within 150 m of the spot to check in.
- **Test against Supabase from your computer:** copy `.env.example` to `.env` and fill in the two values. `START.bat` then uses Supabase instead of the `data` folder. Delete `.env` to go back.

## Free plan limits worth knowing
- **Supabase free projects pause after 7 days with no visits.** Open the site, or click **Restore** in Supabase, before a presentation.
- **Netlify free plan:** 125,000 API calls a month. An open department page checks for new reports every 10 seconds, about 360 calls an hour, and an open worker app about 240 an hour. That's plenty for a project, but close tabs you aren't using.
- **Photos:** Supabase free storage is 1 GB. Photos are shrunk on the phone first (to about 200–400 KB), so that's a few thousand reports.
