# CLAUDE.md - Lexi to Hyperlocal Delivery App Context

## 🎯 Project Overview

You are working on transforming the **Lexi e-commerce platform** (currently for digital products/books) into a **hyperlocal delivery app** for Saudi Arabia, serving food, pharmacy, and grocery verticals.

## 🔴 Critical Issues to Fix

### Current Production Errors (from Vercel logs)

1. **Database Schema Error** (CRITICAL - Blocking All API Calls)
   ```
   Error: You can't specify 'public' as schema name. Postgres is using public schema by default. 
   If you want to use 'public' schema, just use pgTable() instead of creating a schema
   ```
   - **Location**: Database configuration/schema definition
   - **Impact**: All API endpoints failing (categories, items, auth)
   - **Solution**: Remove explicit 'public' schema declaration from Drizzle/Prisma config

2. **TRPC Client Error**
   ```
   TRPCClientError: Unexpected token '<', "<!doctype "... is not valid JSON
   ```
   - **Cause**: API returning HTML instead of JSON (likely 404 or error page)
   - **Impact**: Frontend can't communicate with backend
   - **Solution**: Fix API routing and ensure proper JSON responses

3. **Payload CMS Initialization Failure**
   ```
   [baseProcedure] Failed to create Payload instance
   ```
   - **Cause**: Database schema configuration error
   - **Impact**: CMS functionality completely broken
   - **Solution**: Fix schema configuration, ensure proper Payload initialization

## 📊 Current Project State

### Phase 1 ✅ COMPLETED
- Data models transformed (Books → Items)
- Tenant model enhanced with delivery fields
- Categories setup for verticals
- Order model updated with delivery info

### Phase 2 ✅ COMPLETED  
- Merchant onboarding with business types
- Inventory management system
- Order processing with status tracking
- Email notifications
- Location-based discovery
- Vercel Blob storage configured

### Phase 3 🚧 READY TO START
- Enhanced order management
- Delivery coordination features
- Merchant analytics tools

## 🏗️ Tech Stack Summary

### Current Stack
- **Frontend**: Next.js 15 (App Router)
- **Backend**: Payload CMS + tRPC
- **Database**: MongoDB (needs migration to PostgreSQL)
- **Payment**: Stripe Connect
- **Storage**: Vercel Blob
- **Hosting**: Vercel

### Required for Delivery App
- **Mobile**: React Native (Expo) - Not yet implemented
- **Real-time**: Socket.IO + Redis - Not yet implemented
- **Maps**: Google Maps API - Not yet implemented
- **KSA Payments**: Mada, STC Pay, Apple Pay - Not yet implemented

## 🎨 Key Business Requirements

### User Roles
1. **Customer**: Order food/groceries/medicine, track delivery
2. **Merchant**: Restaurant/Pharmacy/Grocery management
3. **Rider**: Delivery driver (NOT YET IMPLEMENTED)
4. **Admin**: Platform operations and compliance

### Core Verticals
1. **Food Delivery**: Restaurants, cafes, bakeries
2. **Pharmacy**: OTC + prescription medicines (SFDA compliance needed)
3. **Grocery**: Supermarkets, convenience stores

### Saudi Arabia Specific
- **Language**: Arabic + English (RTL support needed)
- **Payment**: Mada (mandatory), STC Pay, Apple Pay
- **Compliance**: SFDA for pharmacy, ZATCA for VAT
- **Auth**: OTP via Saudi telecom providers

## 🔧 Implementation Status

### ✅ What's Working
- Multi-tenant architecture
- Basic user authentication
- Product catalog (transformed to Items)
- Shopping cart system
- Order creation with delivery details
- Admin dashboard framework
- Merchant onboarding flow

### ❌ What's Broken
- Database schema configuration (PostgreSQL/public schema issue)
- API endpoints returning HTML instead of JSON
- Payload CMS initialization
- Production deployment on Vercel

### 🚧 What's Missing
- Rider/driver management system
- Real-time order tracking
- Location-based services
- Arabic/RTL support
- KSA payment gateways
- Mobile app
- Prescription handling
- SFDA/ZATCA compliance

## 📝 Files to Focus On

### Critical Configuration Files
- Database schema files (Drizzle/Prisma config)
- `/src/app/(app)/api/trpc/[trpc]/route.ts`
- Payload configuration files
- Environment variables setup

### Business Logic
- `/src/modules/orders/` - Order processing
- `/src/modules/tenants/` - Merchant management
- `/src/modules/checkout/` - Payment flow
- `/src/collections/` - Data models

## 🚀 Immediate Priorities

1. **Fix Database Schema Error**
   - Remove 'public' schema declaration
   - Ensure proper PostgreSQL configuration
   - Test database connections

2. **Fix API Routing**
   - Ensure tRPC endpoints return JSON
   - Fix Payload CMS initialization
   - Verify API routes are accessible

3. **Stabilize Production**
   - Fix Vercel deployment issues
   - Ensure environment variables are set
   - Test all critical user flows

## 💡 Development Guidelines

### When Making Changes
1. **Preserve** working multi-tenant architecture
2. **Enhance** rather than replace existing features
3. **Test** database queries with tenant isolation
4. **Validate** Saudi Arabia requirements

### Code Patterns to Follow
- Use existing tRPC procedures as templates
- Follow Payload CMS collection patterns
- Maintain tenant isolation in all queries
- Use existing UI components from ShadcnUI

### Testing Checklist
- [ ] Database connections working
- [ ] API endpoints returning JSON
- [ ] User authentication functional
- [ ] Merchant onboarding flow
- [ ] Order creation and tracking
- [ ] Admin dashboard access

## 🔗 Quick References

### Deployed URLs
- Production: https://www.abdoutgroup.com (has errors)
- Staging: https://souq-smoky.vercel.app (has errors)

### GitHub Repository
- Reference: https://github.com/hannidinh/lexi

### Key Dependencies
- Next.js 15
- Payload CMS
- tRPC
- Drizzle ORM
- Stripe
- Vercel Blob

## 🎯 Success Metrics

### Phase 3 Goals
- Merchant order queue dashboard
- Order acceptance/rejection
- Delivery time slots
- Basic analytics

### Phase 4 Goals  
- Restaurant customizations
- Pharmacy compliance
- Grocery weight-based pricing

### Phase 5 Goals
- Cash on delivery
- KSA payment gateways
- Basic compliance features

## 🛠️ Common Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm run payload      # Payload CMS commands

# Database
pnpm run db:migrate   # Run migrations
pnpm run db:seed      # Seed database

# Testing
pnpm run test         # Run tests
pnpm run lint         # Lint code
```

## 📚 Architecture Notes

### Multi-Tenant Strategy
- Shared database with tenant field isolation
- Subdomain routing for merchant stores
- Tenant-scoped API queries

### Order Flow
1. Customer browses merchant catalog
2. Adds items to cart
3. Enters delivery address
4. Processes payment
5. Merchant receives order
6. Updates order status
7. Customer tracks delivery

### Data Flow
```
Customer App → tRPC API → Payload CMS → MongoDB
                  ↓
            Business Logic
                  ↓
         Merchant Dashboard
```

## ⚠️ Known Issues & Workarounds

1. **Public Schema Error**: Currently blocking all database operations
2. **HTML Response**: API misconfiguration causing JSON parsing errors
3. **Payload Init**: CMS not initializing due to schema issues
4. **Vercel Deployment**: Environment variables may be misconfigured

## 📈 Next Steps

1. Fix critical database errors
2. Stabilize API responses
3. Complete Phase 3 implementation
4. Begin rider management system
5. Integrate location services
6. Add Arabic language support
7. Implement KSA payment gateways

---

**Remember**: This is a transformation project. The goal is to leverage Lexi's solid multi-tenant foundation while adding delivery-specific features for the Saudi Arabian market. Focus on stability first, then enhancement.