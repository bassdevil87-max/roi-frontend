# ROI Frontend

Mobile-first Next.js app for the ROI real estate investment platform.
Built from the Figma designs. Wired to the Phase 1 FastAPI backend.

---

## Quick start

```bash
cd roi-frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The app redirects to `/onboarding`.

No API keys required — the frontend runs against mock data by default. To wire it to the Phase 1 backend, set `NEXT_PUBLIC_ROI_API_BASE=http://localhost:8000` in `.env.local`.

---

## App structure

```
app/
├── page.tsx                     → redirects to /onboarding
├── onboarding/
│   ├── page.tsx                 Welcome landing
│   ├── phone/page.tsx           Phone number entry
│   ├── otp/page.tsx             6-digit OTP verification
│   └── profile/page.tsx         Name + email
├── thesis/
│   ├── goal/page.tsx            Step 1: cash_flow | appreciation | balanced
│   ├── geography/page.tsx       Step 2: state selection
│   ├── budget/page.tsx          Step 3: price range + property type
│   └── scanning/page.tsx        Loading animation while on-demand pipeline runs
├── feed/page.tsx                Main feed — all surviving deals
└── property/[id]/page.tsx       Full property detail view
```

---

## Property page sections

The property page is the most complex screen in the design. It renders, top to bottom:

1. **PropertyHero** — address, price, save, share
2. **MonthlyProfitCard** — $184.00/mo, Mortgage/All Cash toggle, financing inputs, AI Insight
3. **WhereMoneyGoes** — animated donut chart, collapsible income and expense rows with every line item
4. **TenantStatus** — tenant in place, lease until, upfront savings callout
5. **Section8Card** — FMR vs market rent bars, waitlist, profit per year
6. **VacancyCard** — This Property vs NJ Average vs US Average comparison
7. **DemandAnchors** — universities, hospitals, transit with distances
8. **GrowthOutlook** — Value/Percentage/Rent tabs, projection area chart, reasons list
9. **RisksSection** — flood zone, high tax, pre-1950, crime with impact badges
10. **PropertyCTA** — sticky bottom: monthly profit + "I want this Property"

---

## Design tokens

Everything lives in `tailwind.config.ts` and `app/globals.css`.

| Token | Value | Use |
|-------|-------|-----|
| `font-display` | Fraunces | Hero numbers, headlines |
| `font-sans` | Geist | Body, UI |
| `font-mono` | Geist Mono | Stat blocks |
| `money` | `#0C7C3D` | Positive cash flow, growth |
| `signal` | `#2F6BFF` | Primary actions, links |
| `ink` | `#0A0A0A` | Primary text |
| `paper.card` | `#F5F5F4` | Subtle surfaces |

All numeric values use `tabular` class for aligned digits. The `.num` and `[data-num]` selectors apply `font-variant-numeric: tabular-nums` automatically.

---

## Component library

### `components/ui/`
- `Button` — xs/s/m/l sizes, primary/secondary/ghost/dark variants, disabled state
- `Badge` — low-risk, medium-risk, high-risk, high-cost, verified, section8, tenant-in-place
- `Segmented` — animated-indicator segmented control (Mortgage/All Cash, Value/Percentage/Rent)
- `AIInsight` — dashed-border card with sparkle icon, default and warm tones
- `StatusBar` — iOS 9:41 status bar
- `AppHeader` — back button + title + optional actions
- `AnimatedNumber` — counts up with Framer Motion spring

### `components/property/`
Property page sections — see list above.

### `components/feed/`
- `PropertyCard` — hero image, match %, save, monthly profit chip, stats

### `components/thesis/`
- `ThesisProgress` — three-segment progress indicator
- `ChoiceCard` — large tappable option card

---

## Backend integration

`lib/api.ts` exposes three functions:

- `getFeed(params)` → `GET /feed` — main feed, filterable by thesis and match score
- `getProperty(id)` → `GET /property/{id}` — triggers Layer 4 on-demand enrichment
- `createThesis(thesis)` → `POST /thesis` — fires the on-demand pipeline

All three fall back to `lib/mock-data.ts` when `NEXT_PUBLIC_ROI_API_BASE` is empty.

Types in `types/roi.ts` mirror the Phase 1 backend exactly — field names, structure, and enum values are identical so there's zero translation layer between the frontend and FastAPI.

---

## Running against the Phase 1 backend

```bash
# Terminal 1 — run the FastAPI backend
cd ../roi
pip install -r requirements.txt
uvicorn api.app:create_app --factory --host 0.0.0.0 --port 8000

# Terminal 2 — run the frontend pointing at it
cd roi-frontend
echo "NEXT_PUBLIC_ROI_API_BASE=http://localhost:8000" > .env.local
npm run dev
```

The thesis created in the onboarding flow will trigger the on-demand pipeline in the backend. The scanning page waits ~5 seconds and then lands on the feed with fresh results.

---

## Build

```bash
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # strict TypeScript check
npm run lint         # ESLint
```

Output is static where possible. The property page is `dynamic = "force-dynamic"` because it reads from the Layer 4 on-demand trigger.

---

## Mobile-first constraints

- Viewport locked to 430px max-width (iPhone 14 Pro Max), centered on desktop inside a white frame
- Safe-area insets respected top and bottom
- Sticky bottom CTA sits above the home indicator
- Tap targets all 44px minimum
- Tap highlights disabled globally — active states use scale animations instead
