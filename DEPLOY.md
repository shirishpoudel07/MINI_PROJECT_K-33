# 🚀 VirtuHeal Deployment Guide

This guide provides instructions for deploying the **VirtuHeal** clinical rehabilitation platform (React + Vite frontend, Node.js + Express + Socket.io backend, and Prisma + SQLite database).

---

## ❓ Can You Host the ENTIRE Website on GitHub Pages?

### The Short Answer:
> **No, not the backend or database — but YES, you can host the Frontend on GitHub Pages!**

### Why?
| Component | Can Run on GitHub Pages? | Technical Reason |
| :--- | :---: | :--- |
| **Frontend** (React, Vite, Tailwind, UI) | **✅ YES** | GitHub Pages is a **static web server**. It excels at serving compiled HTML, CSS, JavaScript, and static assets. |
| **Backend API** (Node.js, Express) | **❌ NO** | GitHub Pages **cannot execute server code** (no Node.js runtime, no dynamic endpoints, no continuous server process). |
| **Real-time WebSockets** (Socket.io) | **❌ NO** | GitHub Pages cannot maintain persistent bidirectional TCP/WebSocket connections for live therapist/patient chat. |
| **Database** (SQLite / Prisma) | **❌ NO** | GitHub Pages cannot run database engines or write persistent data to disk. |

---

## 🏗️ Recommended Architectures

To deploy VirtuHeal, choose one of the two best approaches below:

```
┌────────────────────────────────────────────────────────────────────────┐
│ OPTION A: HYBRID ARCHITECTURE (Recommended Free Tier)                  │
│                                                                        │
│   [ GitHub Pages ]  ────── HTTPS / WSS ──────►  [ Render / Railway ]   │
│   Static React Frontend                         Express Backend API    │
│   (HTML/CSS/JS)                                 Socket.io + SQLite     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ OPTION B: ALL-IN-ONE SINGLE SERVICE (Easiest & No CORS)                │
│                                                                        │
│   [ Render / Railway / VPS ]                                           │
│   └── Express Server serves BOTH:                                      │
│       ├── /api & Socket.io (Backend & Database)                        │
│       └── Compiled Vite Frontend (dist/ folder)                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 OPTION A: Hybrid Deployment (Frontend on GitHub Pages + Backend on Render)

### Part 1: Deploy Backend to Render (Free)

1. **Sign in to Render**: Go to [render.com](https://render.com) and create a free account (sign in with your GitHub account).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your repository: `shirishpoudel07/MINI_PROJECT_K-33`.
4. Configure the Web Service settings:
   - **Name**: `virtuheal-backend` (or your preferred name)
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && node src/prisma/seed.js
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
5. **Environment Variables**: Click **Advanced** → **Add Environment Variable**:
   - `PORT`: `5000`
   - `DATABASE_URL`: `file:./dev.db`
   - `NODE_ENV`: `production`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, for example:
   ```
   https://virtuheal-backend.onrender.com
   ```
   *(Verify it by opening `https://virtuheal-backend.onrender.com/api/health` in your browser. You should see `{"status":"ok"}`)*.

---

### Part 2: Deploy Frontend to GitHub Pages

The repository already includes the automated GitHub Actions workflow at [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

1. **Set Backend URL in GitHub**:
   - In your GitHub repository (`shirishpoudel07/MINI_PROJECT_K-33`), go to **Settings** → **Secrets and variables** → **Actions**.
   - Under the **Variables** tab, click **New repository variable**.
   - **Name**: `VITE_API_URL`
   - **Value**: Your Render URL (e.g., `https://virtuheal-backend.onrender.com`)
   - Click **Add variable**.

2. **Enable GitHub Pages via Actions**:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.

3. **Deploy**:
   - Commit and push your changes to `main`:
     ```bash
     git add .
     git commit -m "Configure GitHub Pages and production backend"
     git push origin main
     ```
   - Go to the **Actions** tab in your GitHub repository. You will see the **Deploy Frontend to GitHub Pages** workflow running.
   - Once completed, your site is live at:
     ```
     https://shirishpoudel07.github.io/MINI_PROJECT_K-33/
     ```

---

## ⚡ OPTION B: Single-Service Deployment on Render (Easiest Fullstack)

VirtuHeal's Express server is already configured to automatically serve the compiled frontend (`dist/`) when available! This means you can deploy the entire application (Frontend + Backend + Real-Time WebSockets) onto a single service with zero CORS issues.

1. Go to [render.com](https://render.com) → **New +** → **Web Service**.
2. Connect `shirishpoudel07/MINI_PROJECT_K-33`.
3. Configure the settings:
   - **Root Directory**: *(Leave empty)*
   - **Build Command**:
     ```bash
     npm install && npm run build && npm --prefix backend install && npm --prefix backend run db:generate && npm --prefix backend run db:push && npm --prefix backend run db:seed
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
4. **Environment Variables**:
   - `PORT`: `10000` (or `5000`)
   - `DATABASE_URL`: `file:./dev.db`
   - `NODE_ENV`: `production`
5. Click **Create Web Service**. Both your UI and Backend API will be live on one unified URL!

---

## 🚂 OPTION C: Deploy on Railway (Alternative)

Railway provides instant deployment with persistent disks and high WebSocket performance:

1. Go to [railway.app](https://railway.app) and click **Start a New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. In **Settings**:
   - **Build Command**: `npm install && npm run build && npm --prefix backend install && npm --prefix backend run db:generate && npm --prefix backend run db:push && npm --prefix backend run db:seed`
   - **Start Command**: `npm start`
4. Under **Variables**:
   - `PORT`: `5000`
   - `DATABASE_URL`: `file:/data/dev.db`
5. *(Optional)* Add a **Volume** mounted at `/data` if you want the SQLite database to retain changes across rebuilds.
6. Under **Settings** → **Networking**, click **Generate Domain**.

---

## 🖥️ OPTION D: Self-Hosted Production VPS (Ubuntu + Nginx + PM2)

If deploying to an Ubuntu virtual server (DigitalOcean, AWS EC2, Linode, Hetzner):

### 1. Install Node.js & PM2
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### 2. Clone and Build Project
```bash
cd /var/www
git clone https://github.com/shirishpoudel07/MINI_PROJECT_K-33.git virtuheal
cd virtuheal

# Install frontend & backend dependencies
npm install
npm run build
npm --prefix backend install
npm --prefix backend run db:generate
npm --prefix backend run db:push
npm --prefix backend run db:seed
```

### 3. Start Backend with PM2
```bash
pm2 start npm --name "virtuheal" -- start
pm2 save
pm2 startup
```

### 4. Configure Nginx Reverse Proxy with WebSocket Support
Edit `/etc/nginx/sites-available/virtuheal`:
```nginx
server {
    listen 80;
    server_name your-domain.com; # or your server IP

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        
        # WebSocket support headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Standard proxy headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/virtuheal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Add Free SSL Certificate
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## ⚙️ Environment Variables Summary

| Variable | Location | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Frontend (`.env` or GitHub Repo Variable) | Base URL pointing to the live backend server. (Leave blank if served together). | `https://virtuheal-backend.onrender.com` |
| `VITE_BASE_PATH` | Frontend (`vite.config.js` or GitHub Actions) | Base subpath for assets when hosted on GitHub Pages subfolder. | `/${{ github.event.repository.name }}/` |
| `PORT` | Backend (`.env` or Cloud Provider Env) | Port where Express listens. | `5000` |
| `DATABASE_URL` | Backend (`.env` or Cloud Provider Env) | Prisma SQLite file connection string. | `file:./dev.db` |
| `NODE_ENV` | Backend (`.env` or Cloud Provider Env) | Set to `production` in live environments. | `production` |

---

## 🔍 Troubleshooting & Pro Tips

### 1. Mixed Content Error (HTTPS vs HTTP)
- **Problem**: When accessing your frontend over HTTPS (like `https://shirishpoudel07.github.io`), the browser blocks API calls if your backend URL starts with `http://`.
- **Solution**: Always use `https://` for `VITE_API_URL`. Both Render and Railway provide free `https://` URLs automatically.

### 2. Render Free Tier Sleep ("Cold Starts")
- **Behavior**: On Render's free tier, backend instances spin down after 15 minutes of inactivity. When a user opens the app, the first request might take 30–50 seconds to wake up the server.
- **Solution**: This is normal for free hosting. For instant responses, upgrade to Render's starter plan ($7/mo) or use a free cron monitoring service (like UptimeRobot) to ping `/api/health` every 10 minutes.

### 3. Persistent SQLite Data on Ephemeral Cloud
- **Note**: Render Free tier instances have ephemeral filesystems (the SQLite `dev.db` file resets when the instance restarts or redeploys).
- **Production Solution**: For permanent production data:
  - Add a **Render Persistent Disk** mounted at `/var/data` and set `DATABASE_URL="file:/var/data/dev.db"`.
  - Or switch Prisma to PostgreSQL (e.g., free PostgreSQL on Supabase or Neon) by changing `provider = "postgresql"` in `prisma/schema.prisma`.
