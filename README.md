# Friendship Loyalty Game — setup & deployment

## 1. Run locally
1. Open this folder in VS Code.
2. Install the "Live Server" extension.
3. Create your Firebase project (step 2), paste the config into firebase.js.
4. Right-click index.html > Open with Live Server (ES modules need http, not file://).

## 2. Firebase
1. console.firebase.google.com > Add project.
2. Add a Web app (</>) and copy its config into firebase.js.
3. Build > Authentication > Get started > enable Email/Password.
4. Build > Firestore Database > Create database (production mode).
5. Firestore > Rules: paste firestore.rules and Publish.
6. Authentication > Settings > Authorized domains: add your Netlify domain after deploying.

## 3. GitHub
    git init
    git add .
    git commit -m "Friendship Loyalty Game"
    git branch -M main
    git remote add origin YOUR_REPO_URL
    git push -u origin main

## 4. Netlify
1. app.netlify.com > Add new site > Import from GitHub.
2. Build command: empty. Publish directory: . (root).
3. Deploy, then add the .netlify.app domain to Firebase authorized domains.

## 5. Test
1. Sign up as user A, create a room, copy the invite link.
2. Open the link in a private window, sign up as user B, join.
3. Award stars on one device; confirm the other updates live.
4. Revoke the invite and confirm a third account cannot join.

## Known limits
Any room member can edit stars (client-trusted). For anti-cheat, move awards to Cloud Functions.
