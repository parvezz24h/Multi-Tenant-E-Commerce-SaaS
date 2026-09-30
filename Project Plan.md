# Multi-Tenant Single-Vendor E-Commerce SaaS

## Project Plan

### 1. Project Overview

Build a SaaS platform that allows individual business owners to create and operate their own single-vendor e-commerce stores.

Each business owner will have:

* A dedicated online store
* Their own products and categories
* Their own customers and orders
* A merchant/admin dashboard
* A customizable ready-made theme
* A platform-generated subdomain
* The ability to connect a custom domain later
* Subscription-based access to the SaaS

Example:

```text
Platform
    │
    ├── rahim.shopbd.com
    ├── karim.shopbd.com
    └── sadia.shopbd.com
```

Later:

```text
rahimfashion.com
karimstore.com
sadiashop.com
```

All stores will run on the same SaaS platform while keeping their data logically isolated.

---

# 2. Business Model

The platform will operate as a subscription-based SaaS.

Example plans:

### Starter

* 100 products
* 1 store owner
* Basic theme customization
* Subdomain
* Basic order management

### Business

* 1,000 products
* Multiple staff accounts
* Custom domain
* Advanced store customization
* Advanced analytics

### Premium

* Unlimited products
* More staff accounts
* Advanced features
* Priority support

The actual pricing and feature limits will be finalized before launch.

---

# 3. Target Market

### Initial Market

Bangladesh.

### Initial Target Users

* Facebook-based sellers
* Small retailers
* Fashion businesses
* Grocery stores
* Electronics sellers
* Cosmetics businesses
* Local brands
* Small wholesalers moving into online retail

The initial product should prioritize:

* Bangladeshi currency
* COD
* Local addresses
* Local payment gateways
* Simple merchant workflows
* Mobile-friendly storefronts

---

# 4. Recommended Technology Stack

## Application

* Next.js
* React
* TypeScript
* App Router

## UI

* Tailwind CSS
* shadcn/ui

## Backend

* Next.js server-side application
* Server Actions / API routes / typed application services

## Database

* PostgreSQL
* Prisma ORM

## Authentication

* Better Auth

## File Storage

* Amazon S3 or Cloudflare R2

## Background Jobs

* Inngest or Redis-based worker

## DNS / Custom Domains

* Cloudflare
* Cloudflare for SaaS when custom-domain support is introduced

## Payments

Initial:

* Cash on Delivery

Later:

* bKash
* Nagad
* SSLCommerz
* Other suitable Bangladeshi payment gateways

## Deployment

A managed deployment such as:

* Railway
* AWS
* Vercel-compatible infrastructure

The final deployment provider should be selected based on custom-domain, background-job, database, and cost requirements.

---

# 5. High-Level Architecture

```text
                       Internet
                           │
                     Cloudflare
                           │
          ┌────────────────┴────────────────┐
          │                                 │
   Subdomains                         Custom Domains
          │                                 │
          └────────────────┬────────────────┘
                           │
                      Next.js App
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     Storefront       Merchant Admin   Super Admin
          │                │                │
          └────────────────┼────────────────┘
                           │
                    Tenant Resolution
                           │
                    Authentication
                           │
                    Authorization
                           │
                   Business Modules
                           │
                    PostgreSQL
                           │
             ┌─────────────┼─────────────┐
             │             │             │
           S3/R2         Jobs        Payments
```

The initial architecture will be a **modular monolith**, not microservices.

---

# 6. Multi-Tenant Architecture

The platform will use a shared application and shared PostgreSQL database.

Each store is a tenant.

Core model:

```text
User
  │
  └── Store
        │
        ├── Products
        ├── Categories
        ├── Customers
        ├── Orders
        ├── Inventory
        ├── Coupons
        ├── Store Settings
        └── Domains
```

Most tenant-owned entities will contain:

```text
storeId
```

Example:

```text
Product
-------
id
storeId
name
slug
price
stock
```

Every server-side query must enforce tenant isolation.

---

# 7. Domain Architecture

## Phase 1 — Platform Subdomains

Each store automatically receives:

```text
store-slug.platform.com
```

Example:

```text
rahim-fashion.shopbd.com
```

A wildcard DNS record will route subdomains to the application:

```text
*.shopbd.com → Application
```

The application will inspect the request hostname:

```text
rahim-fashion.shopbd.com
        ↓
Resolve Store
        ↓
storeId = abc123
        ↓
Load Store Data
```

The merchant does not need to configure DNS for the platform subdomain.

---

## Phase 2 — Custom Domains

A merchant can later connect:

```text
www.rahimfashion.com
```

The merchant enters the domain in the dashboard.

The platform creates a pending domain:

```text
hostname: www.rahimfashion.com
storeId: abc123
status: PENDING
```

The merchant receives DNS instructions.

After DNS verification:

```text
Domain
   ↓
Verification
   ↓
SSL
   ↓
ACTIVE
```

The custom domain will then resolve to the same store:

```text
www.rahimfashion.com
        ↓
storeId = abc123
        ↓
Rahim Fashion Store
```

The domain is simply another identifier for the tenant.

---

# 8. Core User Roles

## Platform Admin

```text
SUPER_ADMIN
```

Responsibilities:

* Manage stores
* Manage users
* Manage subscriptions
* Manage plans
* Manage domains
* Manage themes
* Platform settings
* Platform analytics

## Store Owner

```text
STORE_OWNER
```

Responsibilities:

* Manage store
* Manage products
* Manage orders
* Manage customers
* Manage inventory
* Customize theme
* Manage subscription
* Manage domain

## Store Staff

```text
STORE_ADMIN
```

Optional for the initial release, but the authorization architecture should support it.

## Customer

```text
CUSTOMER
```

Customers can:

* Browse products
* Add products to cart
* Checkout
* View orders
* Track orders

---

# 9. Storefront Features

### Homepage

* Store logo
* Navigation
* Hero section
* Featured products
* Categories
* Promotional banners
* Footer

### Product Listing

* Categories
* Search
* Product filtering
* Sorting
* Pagination

### Product Details

* Product images
* Product name
* Description
* Price
* Stock
* Variants, if supported
* Add to cart

### Cart

* Product quantity
* Remove item
* Subtotal
* Delivery charge
* Total

### Checkout

* Customer name
* Phone
* Address
* District
* Upazila
* Area
* Payment method
* Order confirmation

---

# 10. Merchant Dashboard

```text
Dashboard
│
├── Overview
├── Products
│   ├── All Products
│   ├── Add Product
│   └── Categories
│
├── Orders
├── Customers
├── Inventory
├── Coupons
│
├── Store Design
├── Domain
├── Payments
├── Subscription
└── Settings
```

---

# 11. Product Management

MVP product fields:

```text
Product
-------
Name
Slug
Description
Price
Compare Price
Stock
SKU
Category
Images
Status
```

Optional later:

* Product variants
* Size
* Color
* Multiple prices
* Wholesale pricing
* Attributes

---

# 12. Order Management

Initial order statuses:

```text
PENDING
CONFIRMED
PROCESSING
SHIPPED
DELIVERED
CANCELLED
RETURNED
```

Basic flow:

```text
Customer
   ↓
Checkout
   ↓
Order Created
   ↓
Merchant Notification
   ↓
Merchant Confirms
   ↓
Processing
   ↓
Shipped
   ↓
Delivered
```

Cash on Delivery will be the primary initial payment method.

---

# 13. Bangladesh Address System

The address model should support structured local addresses:

```text
Customer Address
----------------
Name
Phone
District
Upazila
Area
Address Line
Postal Code
```

This will make future courier integrations easier.

---

# 14. Theme System

The platform will use ready-made themes instead of a drag-and-drop website builder.

Example:

```text
Theme: Modern
Theme: Fashion
Theme: Grocery
Theme: Minimal
```

Each theme will use reusable components.

Store-specific settings will control:

```text
Logo
Primary Color
Secondary Color
Hero Image
Hero Text
Banner
Featured Products
Category Display
Footer
```

Example:

```text
Theme
  ↓
Reusable Components
  ↓
Store Configuration
  ↓
Storefront
```

The same theme can therefore be used by many stores with different branding.

---

# 15. Database Modules

Core entities:

```text
User
Store
StoreDomain
StoreTheme
Plan
Subscription

Product
ProductImage
Category
Inventory

Customer
CustomerAddress

Cart
CartItem

Order
OrderItem

Coupon

Payment
PaymentTransaction

AuditLog
```

Relationships should be designed around tenant ownership.

For example:

```text
Store
 ├── Products
 ├── Categories
 ├── Customers
 ├── Orders
 ├── Domains
 ├── Subscription
 └── Settings
```

---

# 16. Subscription System

The platform will maintain:

```text
Plan
Subscription
Payment
```

Subscription states:

```text
TRIAL
ACTIVE
PAST_DUE
SUSPENDED
CANCELLED
```

Feature limits can be defined at the plan level.

Example:

```text
Starter
maxProducts = 100

Business
maxProducts = 1000

Premium
maxProducts = unlimited
```

The application should enforce these limits server-side.

---

# 17. Background Jobs

Background processing should handle operations such as:

* Order notifications
* Email
* SMS
* Subscription checks
* Payment webhook processing
* Scheduled subscription renewal
* Analytics aggregation
* Cleanup jobs

Example:

```text
Order Created
      │
      ↓
Background Job
      │
 ┌────┼─────┐
 ↓    ↓     ↓
Email SMS  Notification
```

---

# 18. File Storage

Product images should be stored outside PostgreSQL.

```text
S3 / R2
│
└── stores/
      └── store_123/
            └── products/
                  ├── product-1.jpg
                  └── product-2.jpg
```

Database stores only metadata and URLs.

---

# 19. Security Requirements

Security is especially important because multiple businesses share the same application.

Required:

* Tenant isolation
* Server-side authorization
* Role-based access control
* Secure authentication
* Secure session handling
* Input validation
* Rate limiting
* CSRF protection where applicable
* Secure file upload
* Payment webhook verification
* Audit logging
* Database backups
* Secret management

A user must never be able to access another store simply by changing a URL or ID.

For example:

```text
/store/abc123/orders
```

must verify that the authenticated user actually has access to `abc123`.

---

# 20. MVP Scope

## Phase 1 — Foundation

### Features

* Project setup
* PostgreSQL
* Prisma
* Authentication
* User management
* Store creation
* Store settings
* RBAC
* Tenant context

### Deliverable

A user can create and manage one store.

---

# 21. Phase 2 — Storefront

### Features

* Store routing
* Store homepage
* Product listing
* Product details
* Categories
* Search
* Cart
* Responsive design
* Ready-made theme

### Deliverable

Each store has a functional e-commerce website.

---

# 22. Phase 3 — Merchant Management

### Features

* Product CRUD
* Category CRUD
* Inventory
* Product images
* Order management
* Customer management
* Dashboard

### Deliverable

A merchant can operate their store without platform-admin assistance.

---

# 23. Phase 4 — Checkout

### Features

* Customer information
* Bangladesh address
* COD
* Delivery charge
* Order creation
* Order confirmation
* Order status management

### Deliverable

A real customer can place an order from a merchant's store.

---

# 24. Phase 5 — SaaS Subscription

### Features

* Pricing plans
* Trial period
* Subscription
* Feature limits
* Subscription status
* Billing history
* Merchant billing page

### Deliverable

The platform can onboard paying merchants.

---

# 25. Phase 6 — Subdomains

### Features

* Store slug
* Wildcard DNS
* Automatic subdomain
* Domain resolution
* Tenant resolution
* Store-specific routing

Example:

```text
rahim.shopbd.com
karim.shopbd.com
sadia.shopbd.com
```

### Deliverable

Every merchant gets a live store URL automatically.

---

# 26. Phase 7 — Custom Domains

### Features

* Add domain
* DNS instructions
* DNS verification
* Domain status
* SSL
* Domain activation
* Domain removal
* Domain replacement

Example:

```text
www.rahimfashion.com
        ↓
Rahim's Store
```

### Deliverable

Merchants can use their own domains.

---

# 27. Phase 8 — Bangladesh Integrations

After the core SaaS is stable:

* bKash
* Nagad
* SSLCommerz
* SMS provider
* Courier APIs
* Pathao
* Steadfast
* RedX
* WhatsApp notifications

These should be added incrementally rather than all being required for MVP.

---

# 28. MVP Exclusions

Do not include these in the first release:

* Drag-and-drop website builder
* Multi-vendor marketplace
* Mobile apps
* Advanced ERP
* Advanced warehouse management
* AI features
* International tax system
* Multi-currency
* Complex marketing automation
* Microservices
* Advanced analytics

The MVP should focus on one thing:

> **Allow a merchant to create a store, add products, receive orders, and manage their business.**

---

# 29. Suggested Development Order

```text
1. Project Setup
       ↓
2. Authentication
       ↓
3. User & Store
       ↓
4. Tenant Resolution
       ↓
5. RBAC
       ↓
6. Theme System
       ↓
7. Products
       ↓
8. Categories
       ↓
9. Storefront
       ↓
10. Cart
       ↓
11. Checkout
       ↓
12. Orders
       ↓
13. Customers
       ↓
14. Inventory
       ↓
15. Merchant Dashboard
       ↓
16. Subscription
       ↓
17. Subdomains
       ↓
18. Custom Domains
       ↓
19. Payment Gateway
       ↓
20. Courier Integration
```

---

# 30. Success Criteria for MVP

The MVP should be considered successful when this complete flow works:

```text
Merchant
   ↓
Sign Up
   ↓
Create Store
   ↓
Choose Theme
   ↓
Configure Store
   ↓
Add Products
   ↓
Store Published
   ↓
store.platform.com
   ↓
Customer Visits
   ↓
Browses Products
   ↓
Adds to Cart
   ↓
Checkout
   ↓
COD Order
   ↓
Merchant Receives Order
   ↓
Merchant Processes Order
   ↓
Order Delivered
```

After this flow is stable:

```text
Subdomain
   ↓
Custom Domain
   ↓
Online Payment
   ↓
Courier Integration
```

should be added.

---

# 31. Long-Term Architecture

The initial architecture should be a modular monolith:

```text
Next.js
│
├── Auth Module
├── Tenant Module
├── Store Module
├── Theme Module
├── Product Module
├── Order Module
├── Customer Module
├── Inventory Module
├── Subscription Module
├── Domain Module
├── Payment Module
└── Notification Module
```

If the platform grows significantly, individual modules can later become independent services.

For example:

```text
                 API / Platform
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Order Service  Payment Service  Notification
```

There is no need to start this way.

---

# 32. Final Recommended Stack

```text
Frontend + Backend
        ↓
Next.js + TypeScript

UI
        ↓
Tailwind + shadcn/ui

Database
        ↓
PostgreSQL + Prisma

Authentication
        ↓
Better Auth

Storage
        ↓
S3 / Cloudflare R2

Background Jobs
        ↓
Inngest / Redis Worker

DNS / CDN
        ↓
Cloudflare

Payments
        ↓
COD → bKash / Nagad / SSLCommerz

Deployment
        ↓
Railway / AWS / Vercel-compatible infrastructure
```

### Architecture Strategy

**Start simple:**

```text
One Next.js application
+
One PostgreSQL database
+
Shared schema
+
Strong tenant isolation
+
Subdomains
```

**Then expand:**

```text
Custom Domains
        ↓
Payments
        ↓
Courier
        ↓
More integrations
        ↓
Caching / scaling
        ↓
Separate services only when necessary
```

This gives you a relatively simple MVP while keeping the architecture ready to grow from **10–100 stores to a much larger SaaS platform**.
