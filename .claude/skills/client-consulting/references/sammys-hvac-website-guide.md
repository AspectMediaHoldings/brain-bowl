# Sammy's Heating & Cooling Website Build Guide
## AI Website Builder Project for Local HVAC Business

---

## Table of Contents
1. [Business Intelligence Summary](#business-intelligence-summary)
2. [Platform Recommendation](#platform-recommendation)
3. [Pre-Build Checklist](#pre-build-checklist)
4. [Master Prompt Templates](#master-prompt-templates)
5. [Integration Strategy](#integration-strategy)
6. [Domain & Hosting](#domain--hosting)
7. [Post-Build Checklist](#post-build-checklist)

---

## Business Intelligence Summary

### Company Profile
- **Business Name:** Sammy's Heating & Cooling, LLC
- **Owner:** Ramon F. Morales (Sammy)
- **Established:** September 2014 (11 years in business)
- **Location:** 2982 Sunrise Dr, Marianna, FL 32448
- **Phone:** (850) 573-2084
- **Service Area:** Jackson County, Florida (Marianna and surrounding areas)
- **Employees:** ~7 people

### Credentials & Trust Signals
- BBB A+ Rating
- Voted "Best in Jackson County" for 5 consecutive years
- Authorized Bryant® HVAC Dealer
- BuildZoom Score: 97 (top 18% of Florida contractors)
- Florida Licenses:
  - RM14017018 (Registered Mechanical Contractor)
  - RA13067546 (Registered Air Conditioning Contractor)
  - BC005894 (Construction Business Information)

### Services Offered
- New Unit Installation (Residential & Commercial)
- AC/HVAC System Repairs (all makes/models)
- Preventative Maintenance Plans
- Mini Split Systems
- Air Duct Installation
- Unit Relocation
- New Construction Installations
- Emergency/After-Hours Service
- Indoor Air Quality Solutions

### Hours of Operation
- Monday - Friday: 8:00 AM - 5:00 PM
- Saturday - Sunday: Closed
- Emergency after-hours available

### Key Differentiators
- Local, family-owned business serving the community
- Bryant® certified dealer with factory-trained technicians
- Free estimates on new systems
- Financing options available
- 10-year limited warranty on Bryant equipment
- Twice-yearly maintenance recommended (industry standard)

### Current Reviews/Testimonials
- Yelp: 5.0 stars
- Porch: 4.2 stars (65 reviews)
- Customer feedback highlights: fast response, professional, friendly, methodical work

---

## Platform Recommendation

### For This Project: **Bolt.new** (Primary) + **Lovable** (Backup/Comparison)

#### Why Bolt for Sammy's HVAC:

| Factor | Bolt Advantage |
|--------|----------------|
| **Integrations** | Better support for Stripe payments, Supabase databases, and third-party booking tools |
| **Full-Stack** | Handles frontend + backend in one environment (needed for payment/booking) |
| **Export Options** | Clean code export to GitHub, deploy anywhere |
| **Complexity** | Better suited for apps with backend requirements (booking, payments) |
| **Learning Curve** | More technical control for adding integrations |

#### When to Use Lovable Instead:
- If Bolt struggles with design aesthetics
- For rapid prototyping/testing different layouts
- If you want a simpler static site first, then add features

#### Recommended Approach:
1. **Start with Bolt** for the full-featured site (booking, chat, payments)
2. **Use Lovable** to prototype design concepts if Bolt's output needs aesthetic improvement
3. **Consider hybrid**: Design in Lovable, then rebuild in Bolt with functionality

#### Budget Considerations:

| Platform | Free Tier | Pro Tier | Best For |
|----------|-----------|----------|----------|
| Bolt.new | 1M tokens/month, daily limits | $25/month (10M+ tokens, custom domains) | Full builds with backend |
| Lovable | 5 prompts/day, 30 credits/month | $25/month (100 credits) | Design iteration, simpler sites |

**Recommendation:** Start with Bolt free tier. Upgrade to Pro if you exhaust tokens during initial build.

---

## Pre-Build Checklist

### Information to Gather from Sammy

#### Business Basics (Confirm/Update)
- [ ] Verify phone number is still (850) 573-2084
- [ ] Confirm address: 2982 Sunrise Dr, Marianna, FL 32448
- [ ] Email address for contact form/inquiries
- [ ] Any additional phone numbers (office vs. mobile)?
- [ ] Updated business hours (any changes?)

#### Branding Assets
- [ ] Logo (high-resolution PNG or SVG preferred)
- [ ] Brand colors (if any established preferences)
- [ ] Existing photos of:
  - [ ] Sammy/team members
  - [ ] Service vehicles/trucks
  - [ ] Completed installations
  - [ ] Equipment/showroom
- [ ] "Best in Jackson County" award logos/badges
- [ ] Bryant® dealer logo (get from Bryant or existing materials)

#### Service Details
- [ ] Complete list of services with descriptions
- [ ] Pricing structure (if displaying ranges)
- [ ] Service area map (specific cities/zip codes served)
- [ ] Emergency service details (how to reach after hours?)
- [ ] Maintenance plan details and pricing tiers

#### Financing Information
- [ ] Financing partner (Synchrony, GreenSky, etc.?)
- [ ] Available financing terms (0% for X months?)
- [ ] Link to financing application if applicable

#### Online Booking Requirements
- [ ] What types of appointments can be booked online?
  - [ ] Free estimates
  - [ ] Service calls
  - [ ] Maintenance visits
  - [ ] Emergency requests
- [ ] Required information from customers:
  - [ ] Name, phone, email, address
  - [ ] Type of service needed
  - [ ] System type/brand
  - [ ] Preferred date/time
- [ ] Who receives booking notifications?
- [ ] Existing scheduling software in use?

#### Bill Payment Requirements
- [ ] Current payment methods accepted
- [ ] Does Sammy use invoicing software (QuickBooks, etc.)?
- [ ] Want customers to pay invoices online?
- [ ] Need recurring payment setup for maintenance plans?

#### Content/Copy
- [ ] "About Us" story - how did Sammy start the business?
- [ ] Team member bios (if featuring staff)
- [ ] Customer testimonials (written permission needed)
- [ ] FAQ list (common customer questions)
- [ ] Special offers or promotions to feature

#### Legal/Compliance
- [ ] Privacy policy requirements
- [ ] License numbers to display
- [ ] Insurance information
- [ ] Any specific disclaimers needed

---

## Master Prompt Templates

### BOLT.NEW - Initial Architecture Prompt

**Step 1: Use this as your opening prompt**

```
I want to build a professional 6-page website for Sammy's Heating & Cooling, LLC - a local HVAC company in Marianna, Florida that's been in business for 11 years.

BUSINESS CONTEXT:
- Authorized Bryant® dealer serving Jackson County, FL
- Voted "Best in Jackson County" 5 years in a row
- BBB A+ rated
- Family-owned, ~7 employees
- Services: installations, repairs, maintenance, mini splits, commercial/residential

WEBSITE REQUIREMENTS:

Pages needed:
1. Homepage - hero with CTA, trust badges, services overview, testimonials, emergency service callout
2. Services - detailed service descriptions with individual sections
3. About Us - company story, team, credentials, why choose us
4. Contact/Book Online - contact form, booking scheduler, map, hours
5. Financing - financing options, application link
6. Reviews/Testimonials - customer reviews display

Core Features:
- Online appointment booking system (service requests, free estimates)
- Live chat widget integration
- Online bill payment capability
- Click-to-call buttons (mobile)
- Contact forms with email notifications
- Responsive design (mobile-first for local searches)

Design Direction:
- Professional, trustworthy, approachable
- Color scheme: Use blues (trust/reliability) with orange or yellow accents (warmth/energy)
- Clean, modern layout - not cluttered
- Large, easy-to-read fonts
- Prominent phone number and CTAs throughout
- Local/community feel - this is a small-town Florida business

Technical Requirements:
- React/Next.js with Tailwind CSS
- Mobile-responsive
- Fast loading (optimize images)
- SEO-friendly structure
- Supabase for backend/database (booking submissions, contact forms)

Please ask me any clarifying questions before you begin building to ensure you fully understand the requirements.
```

**Step 2: After Bolt asks questions, provide specifics**

**Step 3: Enhancement prompt for design polish**

```
The structure is good. Now let's enhance the design:

1. Make it look more premium and trustworthy - this should impress a homeowner comparing HVAC companies
2. Add subtle animations on scroll for engagement
3. Improve the hero section - add a background image placeholder, overlay, and strong headline
4. Add trust badges section (BBB A+, 5x Best in Jackson County, Bryant Dealer, 11 Years in Business)
5. The CTAs should be more prominent - use contrasting colors
6. Add an "Emergency Service" banner that's always visible
7. Improve typography hierarchy - headlines should be impactful
8. Add hover effects on service cards and buttons
```

**Step 4: Integration prompts (one at a time)**

```
BOOKING SYSTEM:
Add an appointment booking form with these fields:
- Service type dropdown (Free Estimate, AC Repair, Heating Repair, Maintenance, Other)
- Name, phone, email, address
- Preferred date picker
- Preferred time slot (Morning 8-12, Afternoon 12-5)
- Description of issue (textarea)
- Submit button

Store submissions in Supabase and send email notification to [EMAIL].
Show success message after submission.
```

```
CONTACT FORM:
Add a simple contact form with:
- Name, phone, email
- Message textarea
- Submit to Supabase with email notification
```

```
CHAT WIDGET:
Add a placeholder for a live chat widget. Create a floating chat button in the bottom right corner. For now, make it open a contact modal. Later we'll integrate a real chat service like Tawk.to or Tidio.
```

---

### LOVABLE - Alternative Initial Prompt

```
Build a professional HVAC company website for Sammy's Heating & Cooling in Marianna, Florida.

CONTEXT:
- 11-year-old local business, BBB A+ rated
- Authorized Bryant® dealer
- Voted "Best in Jackson County" 5 consecutive years
- Family-owned serving Jackson County, FL

DESIGN REQUIREMENTS:
- Style: Professional, trustworthy, modern but approachable small-town feel
- Colors: Blues for trust, warm accent color (orange or gold)
- Must feel premium but not corporate - this is a family business
- Mobile-first responsive design
- Large tap targets and easy navigation

PAGES:
1. Home - hero with phone number CTA, services grid, trust badges, testimonials
2. Services - AC repair, heating, installations, maintenance, mini splits
3. About - company story, team, credentials
4. Contact - form, map, hours, phone

KEY ELEMENTS:
- Phone number (850) 573-2084 prominently displayed
- "Call Now" and "Book Online" CTAs
- Trust indicators throughout (BBB badge, awards, years in business)
- Emergency service callout
- Financing available messaging

Ask me questions to clarify requirements before building.
```

---

### Iterative Refinement Prompts (Use for Both Platforms)

**For Design Issues:**
```
The [specific element] doesn't look quite right. I want it to:
- [Specific visual change]
- [Specific layout change]
- Reference: [describe a site or style you like]

Only modify this element - don't change anything else.
```

**For Adding Sections:**
```
Add a new section to the [page name] page:
- Section name: [name]
- Purpose: [what it should accomplish]
- Content: [specific content]
- Design: [how it should look]
- Position: [where on the page]
```

**For Bug Fixes:**
```
There's an issue with [specific element]:
- Expected behavior: [what should happen]
- Actual behavior: [what's happening]
- Steps to reproduce: [how to see the bug]

Please fix only this issue.
```

---

## Integration Strategy

### Online Booking Options (Pick One)

| Option | Complexity | Cost | Best For |
|--------|------------|------|----------|
| **Calendly** | Easy | Free-$12/mo | Simple scheduling |
| **Housecall Pro** | Medium | $59/mo+ | Full HVAC business management |
| **ServiceTitan** | Complex | Custom pricing | Large operations |
| **Custom Supabase Form** | Medium | Free (Supabase tier) | Budget-conscious |

**Recommendation for Sammy:** Start with custom Supabase form (Bolt can build this). Consider Housecall Pro later if they want full business management.

### Chat Widget Options

| Option | Cost | Features |
|--------|------|----------|
| **Tawk.to** | Free | Live chat, ticketing |
| **Tidio** | Free-$29/mo | Chat + chatbot |
| **LiveChat** | $20/mo+ | Premium features |

**Recommendation:** Tawk.to (free, easy embed code)

### Payment Integration Options

| Option | Transaction Fee | Best For |
|--------|-----------------|----------|
| **Stripe** | 2.9% + $0.30 | Direct website payments |
| **Square Invoices** | 2.9% + $0.30 | Invoice payments |
| **QuickBooks Payments** | 2.9% + $0.25 | If already using QuickBooks |

**Recommendation:** Ask Sammy what invoicing system he uses. Match the payment integration to that. Stripe is easiest to integrate with Bolt.

### Implementation Order:
1. Build core website first
2. Add contact/booking forms (Supabase)
3. Integrate chat widget (Tawk.to embed)
4. Add payment solution last (requires Sammy's merchant account)

---

## Domain & Hosting

### Domain Status
Current domain: `sammysheatingandcooling.com` (already owned)

**Action Items:**
- [ ] Confirm Sammy has access to domain registrar (GoDaddy, Namecheap, etc.)
- [ ] Get login credentials or have Sammy update DNS
- [ ] After build, point domain to new hosting

### Hosting Options

| Option | Monthly Cost | Ease | Best For |
|--------|--------------|------|----------|
| **Vercel** | Free tier available | Easy | React/Next.js sites |
| **Netlify** | Free tier available | Easy | Static + serverless |
| **Bolt Hosting** | Included in Pro | Easiest | Keep everything in Bolt |

**Recommendation:** 
- Use Bolt's built-in hosting during development
- Deploy to Vercel for production (free tier should work)
- OR keep on Bolt Pro if subscription continues

### DNS Changes Required
After deployment, update these DNS records:
- A record or CNAME pointing to hosting provider
- Bolt/Vercel/Netlify will provide specific values

---

## Post-Build Checklist

### Before Launch
- [ ] All links work (internal and external)
- [ ] Forms submit correctly and send notifications
- [ ] Mobile responsive on multiple devices
- [ ] Page load speed acceptable (<3 seconds)
- [ ] All images have alt text (SEO)
- [ ] Phone numbers are click-to-call on mobile
- [ ] Google Maps embed works
- [ ] Contact information is accurate everywhere
- [ ] License numbers displayed correctly
- [ ] SSL certificate active (https)

### SEO Essentials
- [ ] Page titles include "Marianna FL" and service keywords
- [ ] Meta descriptions written for each page
- [ ] H1 tags used properly
- [ ] Google Business Profile updated with new website URL
- [ ] Submit sitemap to Google Search Console

### Analytics & Tracking
- [ ] Google Analytics 4 installed
- [ ] Google Search Console verified
- [ ] Facebook Pixel (if running ads)
- [ ] Call tracking (optional - CallRail, etc.)

### Legal/Compliance
- [ ] Privacy policy page
- [ ] Terms of service (if taking payments)
- [ ] Cookie consent banner (if required)
- [ ] ADA accessibility basics met

### Handoff to Sammy
- [ ] Document how to access website admin
- [ ] Create simple guide for updating content
- [ ] Set up hosting account under Sammy's business email
- [ ] Transfer domain management if needed
- [ ] Provide contact for ongoing support

---

## Notes for Your Business

This project gives you:
1. **Portfolio piece** - Document the before/after
2. **Process template** - Reuse this guide for other local businesses
3. **Pricing benchmark** - HVAC websites typically run $1,500-$5,000+
4. **Testimonial opportunity** - Ask Sammy for a review

Consider creating a case study documenting:
- Time invested
- Tools used
- Results achieved
- Client feedback

This demonstrates your capability to future paying clients in Marianna and Jackson County.

---

*Guide created: January 2026*
*For: Nathan - Sammy's Heating & Cooling Website Project*
