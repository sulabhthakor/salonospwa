# Salon & Spa Booking Platform – Product Requirements Document (PRD)

## 1. Overview and Vision

We are building a **multi-tenant salon and spa scheduling platform (SaaS)** that serves multiple businesses (tenants) from one codebase. Each tenant’s data (schedules, clients, inventory, etc.) is isolated and secured \[1]. The system will provide end-to-end tools for salon owners and staff: online booking, calendar management, point-of-sale (POS), CRM, marketing, analytics, and more – all wrapped in an intuitive teal-and-white UI.

### Technology Stack
*   **Frontend**: Next.js (App Router with PWA support)
*   **Backend**: NestJS + PostgreSQL + Prisma ORM
*   **Deployment**: Docker on Windows
*   **Key Integrations**: Stripe Connect (Payments)

### Architecture Highlights
The vision is to match or exceed platforms like Fresha and Zenoti by offering a unified dashboard for admins, business owners, staff, and clients, with robust payment integration and multi-location support.

*   **Multi-tenancy**: Shared-database model where every row is tagged with a `tenantId` to isolate data.
*   **Security**: Row-level security (RLS) in Postgres and strict access controls in code to ensure data isolation \[1]\[2].
*   **Scalability**: Horizontal scaling (load balancers, containerized services) and caching/quotas per tenant \[3].
*   **User-Centric Design**: Workflows designed around specific user personas \[4]\[5].

---

## 2. User Personas

Understanding each user role is crucial for feature scope and UI design \[4].

1.  **Platform Admin (Super Admin)**
    *   The SaaS operator who configures global settings, manages tenant subscriptions, oversees payouts, and troubleshoots issues.
    *   *Needs*: Global dashboards, multi-tenant analytics, compliance/KYC tools.

2.  **Admin (Platform Manager)**
    *   Reports to Super Admin. Manages salon registrations, approves/rejects businesses, and oversees user support.
    *   *Needs*: Approval dashboard, user lookup tools, platform stats.

3.  **Business Owner (Salon Manager)**
    *   Owns one or more salon locations. Sets up services, staff, schedule, inventory, pricing, and branding.
    *   *Needs*: Appointment monitoring, sales tracking, staff performance analytics, client lists, business health reports.

4.  **Staff Member (Service Provider)**
    *   Hair stylist, massage therapist, etc.
    *   *Needs*: Staff portal to manage schedule, check-in clients, track tips/commissions, update CRM notes, and view inventory. Simple interface for calendar slots and clocking in/out.

5.  **Client (End Customer)**
    *   Books appointments via the public website or PWA.
    *   *Needs*: Search/browse salons, book time slots, manage appointments, purchase gift cards, view history/payments. Receives reminders and surveys.

---

## 3. Full Feature List

### 3.1 Appointment Scheduling & Calendar Management
*   **Booking**: Online booking widget and pages; service & staff selection.
*   **Real-time Availability**: Prevents double-booking.
*   **Management**: Drag-and-drop schedule edits, multi-day/week views, recurring and package appointments.
*   **Reminders**: Automatic text/email reminders.
*   **Visuals**: Color-coded calendar.
*   **Self-Service**: Client reschedule/cancel options. (Comparable to Fresha/Zenoti \[6]\[7]).

### 3.2 Point-of-Sale (POS) & Payments
Integrated via **Stripe Connect**.
*   **Payment Methods**: Credit/debit cards, contactless (Stripe Terminal), manual payments.
*   **Stripe Connect Flows**:
    *   *Direct Charges*: Platform collects payment, deducts commission, transfers funds to salon \[8].
    *   *Destination Charges / Split Payouts*: Split payments between connected accounts (e.g., salon vs. independent stylist) \[9].
*   **Tips**: Clients can add tips; routed to individual staff.
*   **Invoicing**: Stripe Invoicing for walk-ins or plans. Recurring billing for memberships.
*   **Refunds & Disputes**: Managed via Dashboard; 1099 tracking.

### 3.3 Client CRM
*   **Profiles**: Contact info, visit history, communication preferences, tags.
*   **Intake**: Allergies, preferences, custom notes, digital intake forms.
*   **History & Files**: Past services, invoices, before/after photos, medical waivers.
*   **Communication**: Email/SMS logs, consent checks.
*   **Loyalty**: Gift cards (Stripe or custom), loyalty points/rewards \[7]\[10].

### 3.4 Staff Management
*   **Schedules**: Define working hours, days off, breaks. Shift swapping and block-outs.
*   **RBAC**: Role-based access control (staff view only their data vs. managers).
*   **Payroll**: Commission rates (flat/%), hourly pay, tip tracking, payroll reports.
*   **Performance**: Productivity stats, revenue per staff, attendance logs.

### 3.5 Inventory & Retail
*   **Catalog**: Products, SKUs, pricing.
*   **Stock Control**: Track levels by location, low stock alerts.
*   **POS Integration**: Auto-deduct inventory on sale.
*   **Purchasing**: Purchase orders, supplier management.
*   **Reports**: Valuation, reorder reports \[7]\[11].

### 3.6 Marketing & Promotion
*   **Campaigns**: Email/SMS newsletters and targeted promos.
*   **Automation**: Triggered messages (Birthday, follow-ups).
*   **Deals**: Promo codes, package deals.
*   **Marketplace**: (Optional) Public directory listing.

### 3.7 Analytics & Reporting
*   **Dashboard**: Real-time KPIs (revenue, appointments, no-shows).
*   **Reports**: Sales, tax, inventory, payroll exports (CSV/PDF).
*   **Visuals**: Revenue trends, retention graphs.
*   **Multi-location**: Consolidated reports for chains \[7]\[12].
*   **Export/API**: Data access for external BI.

### 3.8 Mobile & PWA
*   **PWA**: Installable on iOS/Android.
*   **Offline**: Caching for booking forms and schedules.
*   **Push Notifications**: Reminders via browser APIs \[13].

### 3.9 Multi-Language & Multi-Location
*   **i18n**: Next.js internationalization (English, Spanish, French, etc.).
*   **Multi-Location**: Business owners manage multiple "sub-tenant" locations with unified analytics \[7].

### 3.10 Platform Administration (New)
*   **Salon Approval Workflow**: New businesses start as "Pending". Admins must approve them before they go live on the public directory.
*   **User Management**: Super Admin can manage Admins. Admins can manage Owners/Clients.
*   **Global Analytics**: Aggregated stats (Total Salons, Total Bookings, Total Platform Revenue).

---

## 4. Pages and User Interfaces

**Theme**: Teal (#14B8A6) & White. Clean, modern, accessible.
**Library**: shadcn/ui + Tailwind CSS \[14].

### Public Marketing Site
*   **Purpose**: Attract clients and enable booking.
*   **Key Pages**: Landing (Search), Salon Profile (Services, Photos, Reviews), Booking Funnel, Contact/About.
*   **Key Components**: Search filters, Service cards, Calendar date-picker, Booking confirmation modal.

### Client Portal (My Account)
*   **Purpose**: Manage appointments and profile.
*   **Layout**: Dashboard with upcoming list, "Book New", History, Profile settings.
*   **Key Components**: Calendar widget, Reschedule/Cancel actions.

### Staff Portal
*   **Purpose**: Manage daily schedule and client details.
*   **Layout**: Day/Week Calendar view, Client lookup, Service notes.
*   **Key Components**: Draggable appointment grid, Client list, Clock-in/out.
*   **Logic**: RBAC enforces staff only see/edit their permitted data.

### Admin Dashboard (Business Owner)
*   **Purpose**: Configure business, view reports, manage staff/inventory.
*   **Navigation**: Dashboard, Calendar, Clients, Staff, Services, Inventory, Marketing, Reports, Settings.
*   **Key Pages**:
    *   *Calendar*: Interactive multi-staff schedule.
    *   *Clients/Staff/Services/Inventory*: CRUD tables with search/filter.
    *   *Marketing*: Campaign composer.
    *   *Reports*: Charts and exports.
    *   *Settings*: Business info, Stripe onboarding, tax rates.

### Admins (Super & Regular)
*   `/admin/dashboard` - Platform Overview (Stats).
*   `/admin/salons` - List & Approval Queue (Approve/Reject actions).
*   `/admin/users` - User Management (Edit/Reset Info).
*   `/admin/admins` - Super Admin only (Manage other Admins).

### 5.3 API Design (NestJS)

Protected by JWT & RBAC.

*   **/api/auth**: Login, Logout, Me.
*   **/api/users**: Management of staff/clients.
*   **/api/appointments**: CRUD + Status updates.
*   **/api/services**: Service & Category management.
*   **/api/calendar**: Availability logic, Block-out times.
*   **/api/clients**: CRM endpoints (Notes, History).
*   **/api/payments**: Checkout (Stripe), Tips, Invoices, Refunds, Webhooks.
*   **/api/products**: Inventory CRUD.
*   **/api/marketing**: Campaigns, Coupons, Automations.
*   **/api/reports**: Analytics data.

### 5.4 Database & Tenancy (Prisma + Postgres)

**Strategy**: Row-Level Security (RLS). Every table has a `tenantId`.
**Implementation**: NestJS middleware sets `app.current_tenant_id` in Postgres session; RLS policies enforce isolation \[16]\[17].

**Simplified Prisma Schema**:

```prisma
model Business {
  id        Int      @id @default(autoincrement())
  name      String
  status    String   @default("PENDING") // PENDING, APPROVED, REJECTED
  locations Location[]
  staff     User[]
}

model Location {
  id          Int     @id @default(autoincrement())
  business    Business @relation(fields: [businessId], references: [id])
  businessId  Int
  name        String
  tenantUsers User[]
  clients     Client[]
  appointments Appointment[]
  inventory   Product[]
}

model User {
  id          String  @id @default(cuid())
  email       String  @unique
  id          String  @id @default(cuid())
237:   email       String  @unique
238:   role        Role    // SUPER_ADMIN, ADMIN, OWNER, STAFF, CLIENT
239:   location    Location? @relation(fields: [locationId], references: [id])
  location    Location? @relation(fields: [locationId], references: [id])
  locationId  Int?
}

model Appointment {
  id          Int      @id @default(autoincrement())
  location    Location @relation(fields: [locationId], references: [id])
  locationId  Int
  service     Service  @relation(fields: [serviceId], references: [id])
  serviceId   Int
  staff       User     @relation(fields: [staffId], references: [id])
  staffId     String
  client      Client   @relation(fields: [clientId], references: [id])
  clientId    Int
  startTime   DateTime
  duration    Int
  status      String
}

model Service {
  id        Int      @id @default(autoincrement())
  location  Location @relation(fields: [locationId], references: [id])
  locationId Int
  name      String
  duration  Int
  price     Float
}
```

---

## 6. Design System

*   **Primary Color**: Teal (`#0d9488` / Tailwind `teal-600`) for actions/active states.
*   **Backgrounds**: White (`bg-white`) with soft gray accents.
*   **Typography**: Clean sans-serif (Inter/Geist).
*   **Accessibility**: WCAG AA contrast compliance.
*   **Components**: Shadcn/ui (Radix Primitives) customized to the Teal theme.
*   **Responsive**: Mobile-first approach for all portals.

---

## 7. Sources & References

*   \[1] \[2] \[3] [Complete Guide to Multi-Tenant Architecture | Medium](https://medium.com/@seetharamugn/complete-guide-to-multi-tenant-architecture-d69b24b518d6)
*   \[4] \[5] [Personas Make Users Memorable - NN/G](https://www.nngroup.com/articles/persona/)
*   \[6] \[10] \[11] \[12] [Mindbody vs Fresha 2025: Features, Pricing & Best Fit](https://www.goodcall.com/appointment-scheduling-software/mindbody-vs-fresha)
*   \[7] [Managing multiple salon locations | Zenoti](https://www.zenoti.com/thecheckin/multi-location-salon-software)
*   \[8] \[9] [Stripe Connect Documentation](https://stripe.com/in/connect)
*   \[13] [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
*   \[14] [shadcn/ui Documentation](https://ui.shadcn.com/)
*   \[15] [Monorepo with pnpm, Nest, Next.js, Prisma | Medium](https://medium.com/@_hanglucas/monorepo-using-pnpm-workspaces-integrating-nest-next-js-prisma-and-docker-a4b16dd1d58d)
*   \[16] \[17] [Securing Multi-Tenant Apps with RLS & Prisma | Medium](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)
