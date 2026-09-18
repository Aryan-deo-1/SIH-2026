# PackCheck 🛡️
### Package & Commodity Compliance Checker
> **Scan. Verify. Understand. Choose Better.**

PackCheck is a full-stack, production-grade TypeScript application built to empower consumers and compliance officers to decode packaged food nutrition, verify official FSSAI licensing evidence, spot hidden additives, evaluate deterministic quality scores, and discover healthier dietary alternatives.

---

## 🚨 Technology Architecture (100% JavaScript / TypeScript — Zero Python)

This project strictly adheres to the **Node.js + Express + TypeScript** requirement. **No Python is used anywhere in the codebase.**

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v7, `@zxing/browser`.
* **Backend**: Node.js, Express.js, TypeScript, Zod, Multer, Axios.
* **Database & ORM**: PostgreSQL 16, Prisma ORM (`prisma/schema.prisma`). Includes resilient automatic in-memory failover for instant zero-downtime offline development.
* **Optical Character Recognition (OCR)**: Tesseract.js (Pure WebAssembly / JavaScript) with regex label extraction.
* **Barcode & QR Processing**: GS1 Modulo-10 checksum validation, EAN-13, UPC-A, GTIN-14, and QR parsing.
* **External Commodity Integration**: OpenFoodFacts REST API v2 client + MockProductProvider offline fallback.
* **Containerization**: Docker, Docker Compose (`docker-compose.yml`).

---

## 🎨 Design System: White + Light Orange

PackCheck features a modern, clean, mobile-first design system with high accessibility and trustworthiness:

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **White** | `#FFFFFF` | Primary card background |
| **Canvas Background** | `#FFFDFB` / `#FAF6F0` | Warm clean canvas |
| **Soft Orange** | `#FFF4E8` | Card highlights and pill backgrounds |
| **Light Orange** | `#FFE4C7` | Accent borders and active tabs |
| **Primary Orange** | `#F59E0B` | Main brand call-to-actions and icons |
| **Dark Text** | `#1F2937` | High-contrast readable typography |
| **Secondary Text** | `#6B7280` | Subtitles, labels, and evidence details |
| **Success** | `#16A34A` | FSSAI Verified and high protein markers |
| **Warning** | `#F59E0B` | Moderate saturated fat and review alerts |
| **Danger** | `#DC2626` | High sodium and trans fat alerts |

---

## 📐 System Flow Architecture

```text
                        USER
                         ↓
               📷 Camera / 📤 Upload / 🔍 Search
                         ↓
            ┌────────────────────────────┐
            │   OCR + Barcode Engine     │
            │  (Tesseract.js + ZXing)   │
            └────────────┬───────────────┘
                         ↓
            ┌────────────────────────────┐
            │   Product Identification   │
            └────────────┬───────────────┘
                         ↓
                 Search Internal DB
                    /          \
                FOUND        NOT FOUND
                  ↓              ↓
               Analyze      External Product Provider
                            (OpenFoodFacts API v2)
                                 ↓
                           Found Externally?
                            /          \
                          YES           NO
                          ↓              ↓
                    Normalize Data   OCR Fallback
                          ↓          (Construct Record)
                    Cache to DB          ↓
                          ↓              ↓
                          └──────┬───────┘
                                 ↓
                     ┌───────────────────────┐
                     │    Analysis Engine    │
                     └───────────┬───────────┘
                    ┌────────────┼────────────┐
                    ↓            ↓            ↓
                Nutrition   Compliance   Verification
                Breakdown     Rules        (FSSAI)
                    ↓            ↓            ↓
                    └────────────┼────────────┘
                                 ↓
                    Deterministic Quality Score (0–5.0)
                                 ↓
                    Evidence Warnings & Positives
                                 ↓
                    Recommendation Engine
                    (Better Alternatives & Deltas)
                                 ↓
                    User Dashboard & History
```

---

## 🏛️ Internal DB vs Official Verification vs External Discovery

1. **Internal PostgreSQL**: Stores verified products, nutritional breakdowns, ingredients, allergens, compliance rules, user preferences, and scan history.
2. **Official FSSAI Verification**: Official 14-digit FSSAI licenses are cross-referenced with the Food Safety and Standards Authority of India (FoSCoS). Statuses: `Verified`, `Needs Review`, `Mismatch`, `Verification Unavailable`. Verification links lead directly to `https://foscos.fssai.gov.in/`.
3. **External Discovery (OpenFoodFacts)**: Used solely for discovering unknown barcodes and retrieving nutritional declarations. It is **never** conflated with official regulatory licenses.

---

## 📱 Application Pages

* `/` **Home**: Landing page with hero CTA, pipeline overview, live metrics, and featured commodities.
* `/scan` **Scanner**: Real-time camera barcode scanner, drag-and-drop packaging photo uploader, and 1-click test simulation.
* `/processing` **Processing**: Multi-stage animated pipeline checklist.
* `/product/:id` **Product Dashboard**: Comprehensive deep-dive with radial 0–5 score gauge, FSSAI verification badge, Recharts nutrition chart, warnings, positives, and better alternatives.
* `/search` **Manual Product Search**: Instant debounced search with category filter pills and external registry fallback.
* `/diet` **Diet Finder**: Interactive sliders for Min Protein, Max Sugar, Max Sodium, Max Calories, and Budget with match percentage ranking.
* `/compare` **Product Comparison**: Side-by-side metric matrix for 2 to 4 products highlighting winning attributes.
* `/history` **Scan History**: Timeline of scans with score badges and instant re-inspection.
* `/preferences` **User Preferences**: Dietary profile (Vegan, Vegetarian, Keto, General), allergen exclusions, and macro limits.
* `/admin` **Admin Panel**: System metrics, database status, external provider health, compliance rule tables, and manual product creation.

---

## 📁 Repository Structure

```text
SIH project/
├── docker-compose.yml         # Container definitions: postgres, backend, frontend
├── package.json               # Monorepo scripts (dev, build, test)
├── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── server.ts          # Server entrypoint
│   │   ├── app.ts             # Express application & middleware
│   │   ├── config/env.ts      # Environment configurations
│   │   ├── types/index.ts     # Core TypeScript domain types
│   │   ├── data/seed-data.ts  # 25+ realistic Indian packaged commodities
│   │   ├── services/
│   │   │   ├── db.service.ts              # Resilient DB service with fallback
│   │   │   ├── product.service.ts         # Product orchestrator & analysis
│   │   │   ├── ocr.service.ts             # Tesseract.js OCR & regex extraction
│   │   │   ├── barcode.service.ts         # EAN-13, UPC-A, GTIN-14, QR validation
│   │   │   ├── scoring.service.ts         # Deterministic 0-5 Quality Score
│   │   │   ├── warning.service.ts         # Evidence-based warning engine
│   │   │   ├── positives.service.ts       # Data-backed positive highlights
│   │   │   ├── verification.service.ts    # FSSAI 14-digit FoSCoS analyzer
│   │   │   ├── recommendation.service.ts  # Weighted better-match recommender
│   │   │   ├── diet.service.ts            # Multi-macro goal ranking
│   │   │   ├── compare.service.ts         # 2-4 product side-by-side report
│   │   │   └── normalization.service.ts   # External schema normalizer
│   │   ├── providers/
│   │   │   ├── product-provider.interface.ts
│   │   │   ├── external-product.provider.ts # OpenFoodFacts REST API
│   │   │   └── mock-product.provider.ts     # Zero-credential demo fallback
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── schemas/
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL models, relationships, and indexes
│   │   └── seed.ts            # Database seed script
│   ├── tests/                 # Vitest automated test suites
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.tsx            # Routes configuration
    │   ├── main.tsx           # Entrypoint
    │   ├── index.css          # Tailwind directives & scan animations
    │   ├── types/index.ts     # Frontend domain interfaces
    │   ├── services/api.ts    # Centralized Axios API client
    │   ├── components/
    │   │   ├── Navbar.tsx             # Desktop header + Mobile bottom navigation
    │   │   ├── Footer.tsx             # Regulatory disclaimer & links
    │   │   ├── BarcodeScanner.tsx     # ZXing camera & file upload dropzone
    │   │   ├── ProcessingAnimation.tsx# Animated pipeline checklist
    │   │   ├── ProductCard.tsx        # Reusable commodity card
    │   │   ├── ScoreCard.tsx          # 0-5 Circular score gauge with factors
    │   │   ├── VerificationBadge.tsx  # FSSAI licensing badge + FoSCoS link
    │   │   ├── NutritionCard.tsx      # Recharts bar chart & declaration table
    │   │   ├── WarningCard.tsx        # Evidence-backed warnings
    │   │   ├── PositivesCard.tsx      # Positive health highlights
    │   │   ├── RecommendationCard.tsx # Better alternatives comparison card
    │   │   └── ComplianceCard.tsx     # Rule compliance checklist
    │   └── pages/
    │       ├── Home.tsx
    │       ├── Scanner.tsx
    │       ├── Processing.tsx
    │       ├── ProductDashboard.tsx
    │       ├── Search.tsx
    │       ├── DietFinder.tsx
    │       ├── Compare.tsx
    │       ├── History.tsx
    │       ├── Preferences.tsx
    │       └── Admin.tsx
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── Dockerfile
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20 or higher (`node -v`)
* **npm**: v9 or higher (`npm -v`)
* *(Optional)* Docker & Docker Compose for containerized deployment

---

### Local Installation (Fast Setup)

1. **Clone or navigate to the repository:**
   ```bash
   cd "c:/Users/hp/OneDrive/Desktop/SIH project"
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables:**
   In `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://packcheck:packcheck_password@localhost:5432/packcheck_db?schema=public
   JWT_SECRET=packcheck_jwt_secret_dev_key_2025_secure
   EXTERNAL_PRODUCT_API_URL=https://world.openfoodfacts.org/api/v2
   EXTERNAL_PRODUCT_API_KEY=
   CLIENT_URL=http://localhost:5173
   ```

4. **Generate Prisma client & seed data:**
   ```bash
   cd backend
   npx prisma generate
   # If PostgreSQL is running locally:
   # npx prisma db push
   # npm run prisma:seed
   cd ..
   ```

5. **Run the full stack concurrently:**
   ```bash
   npm run dev
   ```
   * **Frontend**: `http://localhost:5173`
   * **Backend API**: `http://localhost:5000`
   * **Health Check**: `http://localhost:5000/api/health`

---

## 🐳 Docker Deployment

Run the complete multi-container stack with PostgreSQL, Backend, and Frontend:

```bash
docker-compose up --build -d
```

* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000/api`
* **PostgreSQL Database**: `localhost:5432`

To stop:
```bash
docker-compose down
```

---

## 🧪 Automated Testing

Run the Vitest test suites covering scoring algorithms, warning rules, normalization, and barcode validation:

```bash
cd backend
npm test
```

---

## 📄 Compliance & Legal Notice

PackCheck provides automated nutritional analysis based on declared packaging information, OCR extracts, and official regulatory registries. Government verification claims are displayed strictly when backed by public FoSCoS/FSSAI records. This software is an informational aid and does not constitute clinical medical advice.
