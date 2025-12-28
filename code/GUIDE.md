# Salon & Spa Platform - Development & Deployment Guide 📘

This guide explains how to develop locally on your PC and how to host the production version on a server using Docker.

---

## 1. Local Development Guide 💻
**Goal**: Run the code on your Windows PC for editing and testing.

### Prerequisites
*   **Node.js**: v20 or higher.
*   **pnpm**: Install globally: `npm install -g pnpm`.
*   **PostgreSQL**: Local Windows installation (or use the one in Docker).
*   **Git**: For version control.

### Setup Instructions

#### Step 1: Install Dependencies
Open a terminal in the project root (where `package.json` is) and run:
```powershell
pnpm install
```

#### Step 2: Configure Database
1.  Ensure your local PostgreSQL service is running.
2.  Create a database named `salon_db`.
3.  Copy `apps/backend/.env.example` to `apps/backend/.env`.
4.  Update the connection string in `.env`:
    ```env
    DATABASE_URL="postgresql://postgres:your_password@localhost:5432/salon_db?schema=public"
    ```

#### Step 3: Initialize Database & Seed Data
This sets up your tables and creates test accounts (Owner, Client, Services).
```powershell
# Navigate to backend
cd apps/backend

# Push schema to DB
npx prisma db push

# Seed sample data (Important!)
npx prisma db seed
```

#### Step 4: Start the App
Return to the root directory and start both Frontend and Backend:
```powershell
cd ../..
pnpm dev
```
*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend**: [http://localhost:3001](http://localhost:3001)

### 🛠 Local Troubleshooting
*   **Backend Network Error**: If the backend fails to connect, try clearing the build cache:
    ```powershell
    # In apps/backend
    rm -r dist
    rm tsconfig.tsbuildinfo
    ```
*   **Hydration Warnings**: Ignore yellow warnings about "hydration mismatch" if they disappear on reload; we have suppressed most of them.

---

## 2. Docker Server Hosting 🐳
**Goal**: Host the application permanently on a server or secondary PC.

### Prerequisites (Server)
*   **Docker Desktop**: Installed and running.
*   **Git/GitHub Desktop**: To pull the code.

### Deployment Instructions

#### Step 1: Clone & Configure
1.  Clone the repository to your Server PC.
2.  In the project root, verify `docker-compose.yml` exists.
3.  (Optional) Create a `.env` file in the root if you need to override the API URL for other devices to access it:
    ```env
    NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001
    ```

#### Step 2: Build & Start
Run this command in the project root terminal:
```powershell
docker-compose up --build -d
```
*   **--build**: Compiles the code (this takes a few minutes the first time).
*   **-d**: Detached mode (runs in background).

#### Step 3: Access
*   **URL**: `http://localhost:3000` (or `http://YOUR_SERVER_IP:3000` from mobile).

### 🔄 Pushing Updates via Docker Desktop
When you have made changes to the code (e.g., added a new feature or fixed a bug) and pushed them to GitHub:

1.  **Pull Changes**:
    *   On the Server PC, do `git pull` (or "Fetch origin" in GitHub Desktop) to get the latest code.
2.  **Update Containers**:
    *   Run the same command again:
    ```powershell
    docker-compose up --build -d
    ```
    *   **Docker is smart**: It detects what changed, rebuilds only the necessary parts, and restarts the containers. Your database data persists because it is stored in a volume (`postgres_data`).
