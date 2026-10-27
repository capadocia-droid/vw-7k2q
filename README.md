VA WINE PASSPORT — INSTALLING ON YOUR GALAXY S25
=================================================

This app is a set of web files. GitHub Pages hosts them for free at a private-ish
web address; Chrome then installs them as an app. Your photos, notes, scores and
trips are stored ONLY on the phone. The hosted files contain just the public guide.

ONE-TIME SETUP (about 10 
minutes, works from the phone's Chrome or a computer)
1. Go to github.com and sign up (free) or sign in.
2. Tap "+" (top right) > "New repository". Name it something obscure, e.g.
   "vw-7k2q". Choose Public (needed for free Pages). Tap "Create repository".
3. On the new repo page tap "uploading an existing file". Unzip
   va-wine-passport.zip first, then select ALL files inside the folder
   (index.html, app.js, data.js, leaflet.js, leaflet.css, sw.js,
   manifest.webmanifest) and commit. Then use "Add file > Create new file", type
   "icons/" to make the folder, or simply upload the three icon PNGs into an
   "icons" folder (on a computer you can drag the whole folder in at once).
4. Repo > Settings > Pages > "Build and deployment": Source = "Deploy from a
   branch", Branch = "main", folder "/ (root)" > Save.
5. Wait 1–2 minutes. Your address appears at the top of that page:
   https://YOUR-NAME.github.io/vw-7k2q/

INSTALL ON THE S25
6. Open that address in Chrome on the phone.
7. Tap the "Install" card on the home screen of the app, or Chrome's ⋮ menu >
   "Add to home screen" > Install.
8. Open "Wine Passport" from your home screen. In Settings, tap
   "Protect storage from cleanup".

GOOGLE MY MAPS VIEW
In Google My Maps, open your winery map > Share > "Anyone with the link can view".
Paste that link in the app under Settings > Google My Maps list.

BACKUPS
Settings > Save backup creates one file with everything, including photos.
Save it to Google Drive now and then. "Restore from file" brings it back on a
new phone.

UPDATING THE APP LATER
Upload the changed files to the 
same repo; the app picks them up next time it
opens with a connection. Your data is untouched by updates.
