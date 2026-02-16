# Deployment Guide: SalonOS PWA

**For Freshers & Developers**

This guide explains exactly how to run the **SalonOS PWA** project in two different modes:
1.  **Local Development (Laptop)**: For coding, testing, and making changes.
2.  **Production Hosting (Server/PC)**: For running the live application using Docker.

---

## 1. Local Development (Laptop)

**Goal**: Run the app on your Windows laptop, using your local PostgreSQL database.

### Prerequisites
1.  **Node.js (v20 or v22)**: Download from [nodejs.org](https://nodejs.org/).
2.  **Git**: Download from [git-scm.com](https://git-scm.com/).
3.  **PostgreSQL**: Installed on Windows. Default port is `5432`.
4.  **pnpm**: Run `npm install -g pnpm`.

### Step-by-Step Setup

#### 1. Get the Code
Open **PowerShell** or **VS Code Terminal**:
```powershell
# Go to your projects folder
cd "C:\Docker Hosted"

# Clone the repository (if not already done)
# git clone <repo_url> salonospwa

# Go into the code folder (IMPORTANT: All dev work happens here)
cd "salonospwa\code"
```

#### 2. Install Dependencies
```powershell
pnpm install
```

#### 3. Configure Database Connection (.env)
Ensure your `code\.env` file connects to your **local Windows Postgres**:
```ini
# Local Development Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/salon_db?schema=public"
AUTH_SECRET="dev-secret"
```
*Note: Update `password` to match your local Postgres password.*

#### 4. Setup the Database
```powershell
# Create DB & Tables
pnpm exec prisma db push

# Generate Client (Required for TS errors)
pnpm exec prisma generate

# Seed Data (Optional)
pnpm exec prisma db seed
```

#### 5. Run the App
```powershell
pnpm dev
```
*   **Result**: The app will start. Open your browser and go to `http://localhost:3001`.

---

## 2. Production Hosting (Server/PC)

**Goal**: Host the application permanently on a server using Docker.

### Prerequisites
1.  **Docker Desktop**: Install and ensure it is running (Green whale icon).
2.  **Git**: Installed.

### Step-by-Step Deployment

#### 1. Go to Project Root
**Important**: Run Docker commands from the **root** folder, NOT the `code` folder.
```powershell
cd "C:\Docker Hosted\salonospwa"
```

#### 2. Update Code
```powershell
git pull
```

#### 3. Start the Server
```powershell
docker compose up -d --build
```
*   **What it does**:
    *   Builds the Next.js app.
    *   Starts Postgres (Port 5435), Nginx (Port 8082), and Cloudflare Tunnel.
    *   **Note**: The first build may take 10-15 minutes. Be patient!

#### 4. Access the App
*   **Remote**: `https://sb.snapdecode.in`
*   **Local Nginx**: `http://localhost:8082`
*   **Direct App**: `http://localhost:3003`

### Common Commands
*   **Check Logs**: `docker compose logs -f`
*   **Stop Server**: `docker compose stop`
*   **Restart Server**: `docker compose restart`

---

## Troubleshooting / Common Issues

### 1. "ELIFECYCLE" or Build Error
*   **Cause**: TypeScript errors or strict linting.
*   **Fix**: We have configured `next.config.ts` to ignore these during build. If it persists, check `docker compose logs`.

### 2. Database Connection Error
*   **Cause**: Postgres container `salon_db` is not running or password mismatch.
*   **Fix**: Check `docker ps`. Ensure `.env.docker` uses `DATABASE_URL=postgresql://postgres:password@postgres:5432...`.

### 3. Port Conflicts
*   **Cause**: Another app is using port 3003 or 5435.
*   **Fix**: Check `docker ps` to see what is running. Each app should have unique ports (See `SHARED_HOSTING_GUIDE.md`).
