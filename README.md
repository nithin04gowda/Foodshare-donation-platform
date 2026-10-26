# FoodShare India - Food Waste Donation Platform

A full-stack, India-restricted surplus food waste redistribution platform designed in compliance with:
- **Food Safety and Standards Authority of India (FSSAI)** regulations on surplus food distribution.
- **Digital Personal Data Protection (DPDP) Act 2023** for secure identity verification and data retention.
- **Transactional quantity reservation** ensuring race-free pickups and atomic partial collection.

---

## 🚀 Key Feature Implementations

### 1. India-Only Registration and Identity Verification
- **Geographic Restrictions**: Registration is strictly validated for the Republic of India.
- **Postal & Phone Validation**:
  - 6-digit Indian PIN code validation via regex `^[1-9][0-9]{5}$` (disallows leading 0).
  - 10-digit Indian mobile number validation `^[6-9][0-9]{9}$`.
- **Role Support**:
  - **Individual Donors**: Commercial banquets, bakeries, restaurants, households.
  - **Individual Recipients**: Shelter coordinators, relief volunteers, community families.
  - **Registered NGOs / Charities**: Includes NITI Aayog NGO Darpan unique ID, Society/Trust registration number, beneficiary capacity, and Section 12A/80G status.
- **Security & DPDP 2023 Compliance**:
  - Identity proofs (Aadhaar, PAN, Voter ID, Darpan certificate, FSSAI license) are uploaded to private encrypted storage directories outside the public web root.
  - Document upload does NOT auto-grant authenticity; accounts remain in **Pending Verification** until approved by administrators.
  - Non-verified users are gated from requesting or collecting food.
  - Document retention policy with automated erasure on account termination.
  - Passwords hashed using salted hashing; ID numbers never leaked in public logs.

### 2. Nearby Food Discovery (Haversine Formula)
- **Geospatial Distance**: Calculations use the real Great-Circle Haversine formula across latitude and longitude (not crude PIN code string matching).
- **Radius Options**: Default 5 km radius, with 10 km, 20 km, and 50 km filters.
- **Distance Sorting**: Automatically sorts listings nearest-first.
- **Donor Privacy**: Exact street address and donor phone number remain hidden in public discovery. Only the city/approximate distance is disclosed until the donor approves a request.
- **Food Safety Badges**: Real-time pickup deadline countdown, storage condition (heated, refrigerated, ambient), packaging type (foil containers, meal boxes, bring own vessel), dietary type (FSSAI green/red dot indicators), and allergens.

### 3. Food Request & Pickup (Transactional Reservations)
- **Request Form Requirements**:
  - Meaningful reason (minimum 15 characters).
  - Intended beneficiaries (e.g. night shelter occupants, daily wage workers).
  - Number of people to serve.
  - Proposed pickup time before the food safety expiration deadline.
  - Vessel/transport preparedness notes.
- **Status Lifecycle**:
  - `Available` → `Requested` → `Accepted` → `Partially Collected` → `Completed` → `Expired` / `Cancelled`.
- **Atomic Reservation**:
  - Prevents multiple claimants from claiming the same portion.
  - Partial collections decrement available quantity; full collections mark donation `Completed` and remove it from public discovery.
  - Cancellations or donor rejections release reserved portions back to the available pool.
  - Food past its pickup deadline is flagged as `Expired` to prevent unsafe consumption.

### 4. Non-Monetary Donor Recognition & Certificates
- Real-time impact calculated purely from verified database completions:
  - Total meals shared (servings)
  - Total food rescued (kg)
  - People fed
  - Greenhouse gas CO2 emissions prevented ($1\text{ kg food waste} \approx 2.5\text{ kg CO}_2\text{e}$)
  - Non-monetary merit points (no artificial points or cash schemes)
- Badges: *First Harvest*, *Hunger Hero*, *Zero Waste Warrior*, *Community Pillar*, *Century Feeder*.
- Printable Official Certificate of Appreciation with Certificate ID, date, and verified metrics.

### 5. Dashboards & Administration
- **User Dashboard**: Real-time status of submitted requests, active donations, and pickup history.
- **Donor Dashboard**: Incoming requests review with Accept / Reject buttons and handover OTP verification.
- **Admin Moderation Desk**:
  - Private verification audit queue with document inspection.
  - One-click Approve or Reject (with justification).
  - Real platform statistics computed from database queries.

---

## 🛠️ Architecture & Standalone Deployment

### 1. Web Applet (Active Container)
- Full-stack Node + Express (`server.ts`) running on port 3000 with persistent data storage (`foodshare_data.json`) and mounted Vite React frontend.
- Launch: `npm run dev` or `npm start`.

### 2. Python Flask Backend (`flask_backend/`)
- Contains the preserved Python Flask backend (`app.py`), MySQL 8.0 schema (`schema.sql`), and test suite (`test_foodshare.py`).
- Run Flask unit tests:
  ```bash
  python3 flask_backend/test_foodshare.py
  ```
- Deploy standalone Flask server:
  ```bash
  pip install flask pymysql
  python3 flask_backend/app.py
  ```

### 3. MySQL Database Setup (`flask_backend/schema.sql`)
- Import schema into MySQL 8.0+:
  ```bash
  mysql -u root -p < flask_backend/schema.sql
  ```
- Includes indexes on `(latitude, longitude)`, foreign keys, check constraints, and the `ReserveFoodQuantity` stored procedure.

---

## 🧪 Automated Test Verification

Run TypeScript tests:
```bash
npx --yes tsx --test src/utils/foodshare-logic.test.ts
```
Run Python tests:
```bash
python3 flask_backend/test_foodshare.py
```
