# Clean Gudlavalleru: How to run

A waste-reporting web app for the CSP project. Citizens report garbage spots with a photo and location (no sign-up). Each report goes to the sanitary department of that zone. A worker checks in on site, cleans, and uploads an "after" photo. The department then verifies and closes the report.

## 1. One-time setup
Install **Node.js** (the LTS version) from https://nodejs.org. Nothing else is needed.

## 2. Start the app
Double-click **`START.bat`**. A black window opens and the browser opens the home page.
**Keep the black window open** while you use the app. Close it to stop the app.

| Page | Address |
|---|---|
| Home page (info, animation, report button) | http://localhost:3000/ |
| Report a problem / track a report | http://localhost:3000/report |
| Sanitary department portal | http://localhost:3000/department |
| Worker app | http://localhost:3000/worker |

The maps need an internet connection.

## 3. Demo logins

| Who | Username | Password | Sees |
|---|---|---|---|
| Sanitary officer (all zones) | `admin` | `admin123` | Every zone + reports outside all zones |
| North Zone department | `north` | `north123` | North Zone only |
| South-West Zone department | `southwest` | `sw123` | South-West only |
| South-East Zone department | `southeast` | `se123` | South-East only |
| Workers (North) | `ramesh`, `lakshmi` | `worker123` | Their own jobs |
| Workers (South-West) | `suresh`, `padma` | `worker123` | Their own jobs |
| Workers (South-East) | `ravi`, `anitha` | `worker123` | Their own jobs |

You can change the accounts in `demo-accounts.js`.

## 4. Demo script for your presentation (about 5 minutes)
1. **Home tab:** play the story video (56 seconds). Click any chapter below it to jump there, or press ⛶ for full screen.
   For the projector, open http://localhost:3000/film.
   Press the **🌐 తెలుగు** button in the top-right corner to switch the whole home page, the video and the report form to Telugu. Press **English** to switch back.
   Then open the **Segregation** tab, click **Try it yourself** and play the bin game. Show the **Tips** and **Learn** tabs briefly.
2. **Report tab:** open *Report a problem*, add a photo, tap the map to set the spot (inside the dashed North Zone box), choose *Open garbage dumping* and send it. Note the tracking ID.
3. **Worker first:** open `/worker` in a second tab (or an incognito window, or on a phone) and log in as `ramesh`. Leave this page open.
   The NEW badge, sound and vibration only happen when a job arrives while the worker app is already open, so log in **before** you assign.
4. **Department:** open `/department` in a third tab and log in as `north`. The new report appears in *Pending*. Open it and assign it to **Ramesh K**.
5. **Worker:** go back to Ramesh's tab. Within 15 seconds the new job appears marked **NEW**, with a sound and vibration (on a phone).
   - The **Jobs** screen shows To do / Working / Done today.
   - Tap the job. Step 1 shows a map and a **Navigate** button. Tap **I have reached - Check in**. GPS will be far away in a classroom, so use **Check in anyway (demo mode)**.
   - Step 2 shows a running work timer. Step 3: take the after photo, add a note, then **Upload & finish job**.
   - Also show **Map** (all your jobs and your location), **History** (before/after of finished jobs, "Approved ✓") and **Profile** (your stats, change password, language, sound).
6. **Department:** the report now shows as *Waiting for your check*, with before and after photos side by side. Click **Approve**.
7. **Citizen:** track the ID. It shows **Solved** with the after photo.
8. Also show these in the department portal (left menu):
   - **Overview:** stat tiles, the 14-day chart, "Needs your attention" and who is on site.
   - **New-complaint alert:** keep the department open, send a report from the citizen page, and within 10 seconds a pop-up and a sound appear (🔔 Sound on/off in the menu).
   - **Map:** filter by status, and tick 🔥 Hotspot heatmap.
   - **Workers:** ＋ Add worker, 🔑 Reset password, 🗑 Remove.
   - **Analytics:** average solve time, on-time %, 30-day chart, problems by type, worker performance and the hotspot map.
   - **Complaints → Excel (CSV)** download, and the 🌐 తెలుగు switch.
   - Log in as `southwest` to show they **can't see** North Zone complaints.

## 5. Features
- No sign-up for citizens, with a tracking ID and a "My reports" list on the phone
- Automatic routing to the right department by GPS zone
- Telugu / English switch on the report page
- Duplicate merging: the same problem within 50 m becomes "+1 report", and 3+ reports become high priority
- Every problem must be solved within 3 hours, with overdue highlighting (change it per problem type in `config.js`)
- Worker GPS check-in (must be within 150 m) and a GPS-stamped after photo
- Department verification (approve, or send back to the worker)
- Spam protection: 5 reports per hour per device, and a device is blocked after 3 fake reports
- Photos are compressed before upload, and hidden location data is removed
- Excel (CSV) download of complaints

## 6. Changing things
- **Zones, map centre, problem types, deadlines, check-in distance:** edit `config.js`
- **Start again with fresh sample data:** close the app, delete the `data` folder, then start it again
- All reports and photos are stored in the `data` folder

## 7. Using phones
Phones on the same Wi-Fi can open the address shown in the black window (for example `http://192.168.x.x:3000`). Phone browsers only allow **automatic GPS** on secure (https) websites, so on Wi-Fi you set the spot by tapping the map. For full GPS on phones, the app needs to be put online (hosted) with https.

## 8. Putting it online
To host the app on Netlify, with the Supabase database and photo storage, follow **[DEPLOY.md](DEPLOY.md)**. Once it's online, it has an https address, so automatic GPS works on every phone.
