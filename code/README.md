# SalonOS PWA 💇‍♀️

A multi-tenant Salon & Spa SaaS Platform built with Next.js, NestJS, and Prisma.

## 🚀 Local Development

### Prerequisites
*   Node.js v20.x
*   pnpm (`npm install -g pnpm`)
*   PostgreSQL (Local or Docker)

### Setup Instructions

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Environment Setup**
    *   Copy `.env.example` to `.env` in `apps/backend` (if not present).
    *   Update `DATABASE_URL` to point to your Postgres instance.

3.  **Database Migration & Seeding**
    ```bash
    # Run migrations
    cd apps/backend
    npx prisma migrate dev

    # Seed sample data (Owner, Client, Services)
    npx prisma db seed
    ```

4.  **Start Development Server**
    Run both frontend and backend in one command:
    ```bash
    # From root directory
    pnpm dev
    ```

    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend**: [http://localhost:3001](http://localhost:3001)

## 🐳 Docker Hosting

The project is containerized for production configuration.

### Deployment with Docker Compose

1.  **Build and Run**
    ```bash
    docker-compose up --build
    ```

2.  **Access**
    *   Application: [http://localhost:3000](http://localhost:3000)
    *   API: [http://localhost:3001](http://localhost:3001)

### Dockerfile Details

*   **Backend**: Uses `node:20-alpine`. Builds utilizing `nest build` and runs `dist/main.js`.
*   **Frontend**: Uses `node:20-alpine`. Builds Next.js for production and using `npm start`.

## 🛠 Troubleshooting

### Network Error / Backend Not Starting
If the backend fails to start or you see `MODULE_NOT_FOUND`:
*   The project uses `ts-node` for local dev to bypass build caching issues.
*   Ensure `apps/backend/tsconfig.json` includes `"include": ["src/**/*"]`.
*   To force a clean state: `rm -rf apps/backend/dist apps/backend/tsconfig.tsbuildinfo`.

### Hydration Errors
*   Occasional hydration mismatch warnings may appear due to browser extensions (Grammarly, etc.).
*   The `<body>` tag has `suppressHydrationWarning` enabled to mitigate this.
