# Shared Hosting Guide: Managing Multiple Apps

**For Server Administrators**

This guide explains how to host `salonospwa` alongside other applications (like `localmarketpwa` and `snapimmi`) on the **same server** (your Windows PC using Docker) without conflicts.

---

## 1. The Golden Rule: Unique Ports

Every application needs specific "Ports" to talk to the world. We assign **Unique Ports** to `salonospwa` to avoid clashing with your existing apps.

### Assigned Port Registry

| Project Name | Feature | Internal Port | **External Host Port** (Assigned) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **LocalMarketPWA** | Web App | 3000 | **3000** | |
| | Database | 5432 | **5432** | |
| | Nginx | 80 | **80** | |
| | | | | |
| **SnapImmi** | Web App | 3000 | **3002** | |
| | Database | 5432 | **5434** | |
| | Nginx | 80 | **8081** | |
| | | | | |
| **SalonOS PWA** | Web App | 3000 | **3003** | **NEW** |
| | Database | 5432 | **5435** | **NEW** |
| | Nginx | 80 | **8082** | **NEW** |
| | Cloudflare | - | - | Tunnel: `salon-tunnel` |

---

## 2. Managing Docker Containers

You can run `salonospwa` simultaneously with other projects.

### Starting SalonOS
```powershell
cd "C:\Docker Hosted\salonospwa"
docker compose up -d
```

### Checking Status
Run this command to see ALL running containers across all projects:
```powershell
docker ps
```
You should see:
- `salon_app` (Port 3003)
- `salon_db` (Port 5435)
- `salon_nginx` (Port 8082)
- `salon_cloudflared`

### Stopping SalonOS
```powershell
cd "C:\Docker Hosted\salonospwa"
docker compose stop
```
*(Use `down` instead of `stop` if you want to remove the containers completely)*

---

## 3. Cloudflare Tunnels (Remote Access)

`salonospwa` has its own isolated Cloudflare Tunnel container.

- **URL**: `https://sb.snapdecode.in`
- **Tunnel Details**:
  - Name: `salon-tunnel`
  - UUID: `334e8995-44c8-497b-9cf4-f59c98b99c27`
  - Creds File: `cloudflared/334e8995-44c8-497b-9cf4-f59c98b99c27.json`

**Configuration (`cloudflared/config.yml`)**:
Points to the internal Docker service:
```yaml
ingress:
  - hostname: sb.snapdecode.in
    service: http://salon_nginx:80
  - service: http_status:404
```

---

## 4. Maintenance & Backups

### Database Backups
Since `salonospwa` has its own Postgres container (`salon_db`), backing it up acts independently of other projects.

**Command to Backup SalonOS DB**:
```powershell
docker exec -t salon_db pg_dumpall -c -U postgres > salonospwa_backup.sql
```

**Command to Restore**:
```powershell
cat salonospwa_backup.sql | docker exec -i salon_db psql -U postgres
```
