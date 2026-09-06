# SonicWave Deployment Guide: Vercel & Cloud Backend

This application consists of two parts:
1. **Frontend (`client/`)**: High-performance Spotify-themed React/Vite web application — **Perfect for Vercel**.
2. **Backend (`server/`)**: Express service running `yt-dlp` and `ffmpeg` with 16-stream parallel downloading and audio extraction. Because long-running background media processing (>15s) and CLI binaries require persistent runtime processes, the backend is hosted on a free persistent cloud service (e.g. Render, Railway, Fly.io, or VPS).

---

## Option 1: Deploy Frontend on Vercel (Recommended)

### Step 1: Push your project to GitHub
If not already pushed:
```bash
git init
git add .
git commit -m "SonicWave Spotify-look universal social downloader"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import your GitHub repository.
4. Vercel will automatically read the pre-configured [vercel.json](file:///d:/Ansh/YTMP3/vercel.json):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm --prefix client run build`
   - **Output Directory**: `client/dist`
5. **Add Environment Variable**:
   - Variable name: `VITE_API_URL`
   - Value: URL of your deployed backend (e.g. `https://sonicwave-api.onrender.com`)
6. Click **Deploy**!

---

## Option 2: Deploy Frontend via Vercel CLI

From your project terminal:
```bash
npx vercel
```
1. Follow the interactive prompts to link your Vercel account.
2. When asked for build settings, Vercel will automatically pick up `vercel.json`.
3. Set your production environment variable:
   ```bash
   npx vercel env add VITE_API_URL
   ```
4. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## Live Deployment Status

- **Frontend (Vercel)**: [https://ytmp-3-five.vercel.app](https://ytmp-3-five.vercel.app)
- **Backend (Render)**: [https://sonicwave-gpui.onrender.com](https://sonicwave-gpui.onrender.com)

> [!NOTE]
> **Important Notes for Users & Testers:**
> 1. **Correct URL**: Ensure you are visiting `https://ytmp-3-five.vercel.app` (not `ytmp-3.vercel.app`, which is an older unlinked domain).
> 2. **Render Free Tier Spin-Up (Cold Starts)**: Free instances on Render automatically go to sleep after 15 minutes of inactivity. The first request after a period of inactivity may take **30–50 seconds** to wake up the backend. Once active, downloads and conversions are near-instant.
> 3. **Clear Browser Cache**: If you visited the site before `VITE_API_URL` was connected, press `Ctrl + F5` (or `Cmd + Shift + R` on Mac) to refresh the cached JavaScript bundle.
