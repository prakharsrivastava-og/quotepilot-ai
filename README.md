# QuotePilot AI

### Turn Every Inquiry Into an Opportunity.

QuotePilot AI is an AI-powered sales assistant designed to help small businesses manage customer inquiries, qualify leads, generate professional quotations, and organize customer follow-ups.

## Features
- AI-powered customer inquiry analysis
- Intelligent lead qualification
- AI-generated customer response drafts
- Lead and customer management
- Professional quotation generation
- PDF quotation export
- Follow-up reminders
- Sales analytics
- Subscription and payment management

*Features are under development and will be updated as they are implemented.*

## Technology Stack
- React
- JavaScript
- Firebase
- Google Gemini AI
- Razorpay

## Our Vision
To simplify sales management for small businesses by bringing AI intelligence and customer management into one platform.

## Project Status
🚧 Under Development

## Team

- Prakhar Srivastava — 26U020115
- Prakhar Srivastava — 26U020165
- Shreyash Seth — 26U020157

**Subject:** FoCP (CSE-1003)

# QuotePilot AI — Turn Every Inquiry Into an Opportunity

Academic Project for **FoCP (CSE-1003)**
Team Members:
- Prakhar Srivastava — Scholar No. 26U020115
- Prakhar Srivastava — Scholar No. 26U020165
- Shreyash Seth — Scholar No. 26U020157

## 1. Install Dependencies
```bash
npm run setup
```

## 2. Configure Environment Variables
1. Copy `.env.example` to `.env` and add your Firebase Web App credentials (Authentication + Firestore enabled in Firebase Console).
2. Copy `server/.env.example` to `server/.env` and add:
   - `GEMINI_API_KEY` from Google AI Studio (https://aistudio.google.com/apikey)
   - `FIREBASE_WEB_API_KEY` (same Firebase Web API key, used server-side to verify caller ID tokens)

## 3. Run Locally
```bash
npm run dev
```
- Frontend runs at http://localhost:5173
- Backend Gemini API server runs at http://localhost:3001

## 4. Deploy to Firebase Hosting & Firestore
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login and link project:
   - `firebase login`
   - Copy `.firebaserc.example` to `.firebaserc` and set your Firebase Project ID.
3. Deploy Firestore rules & React app:
   ```bash
   npm run build
   firebase deploy --only firestore:rules,hosting
   ```
4. Deploy `server/index.js` to a free Node host (e.g. Render/Railway) and set `VITE_API_BASE_URL` in `.env` before running `npm run build`, OR upgrade Firebase to the **Blaze** plan if you want to run backend logic inside Cloud Functions v2.

## 5. Free-Tier Limits & Billing Notes
- **Firebase Spark (Free)**: Includes Firebase Auth, 1 GiB Firestore storage / 50k reads + 20k writes per day, and Firebase Hosting. Cloud Functions v2 requires upgrading to the pay-as-you-go Blaze plan, which is why the Express backend in `server/index.js` is provided separately.
- **Google Gemini API Free Tier**: Subject to Google AI Studio RPM/RPD rate limits and prompt logging terms on free tier.
- **Email / WhatsApp / Stripe**: Integration status checks and UI are built; actual delivery/billing requires SMTP, Meta WhatsApp Cloud API, and Stripe credentials in `server/.env`.
