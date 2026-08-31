# ReflectAI — User-Authenticated Multi-Turn Journal & Gemini Reflection Studio

A production-grade, secure web application combining **Firebase Authentication (Google Sign-In)**, **Google Cloud Firestore (User-Isolated Collections)**, and **Gemini 3.6 Flash API (Resilient Server-Side Fallback Ladder)** for reflective journaling, creative brainstorming, and structured AI summarization.

---

## 1. Architecture & Security Specifications

| Layer | Technology | Security & Isolation Strategy |
| :--- | :--- | :--- |
| **Authentication** | Firebase Auth (Google Sign-In) | Federated identity; zero custom password handling; JWT-authenticated sessions. |
| **Database** | Cloud Firestore | Owner-bound security rules (`/users/{userId}/interactions/{id}`); zero undefined payload stripping. |
| **AI Intelligence** | Gemini 3.6 Flash (`@google/genai`) | 4-tier model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **Secret Management** | Google Secret Manager / Env | `GEMINI_API_KEY` secured exclusively on the backend server; zero client exposure. |
| **Hosting & Ingress** | Google Cloud Run (Containerized) | Full-stack unified Express + Vite server binding on port 3000. |

---

## 2. Agentic Threat Model Summary (5 Threat Zones)

| Threat Zone | Identified Attack Vectors & Risks | Applied Countermeasure & Defense | Verification Status |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious JSON payloads, prompt injection, oversized payload injection. | Explicit Express body parser limits, null-safe destructuring, text sanitization before model & DB sinks. | ✅ Enforced |
| **2. Planning & Reasoning** | System instruction bypass, toxic/unhelpful generation. | Isolated prompt templates separating user thoughts as plain data; temperature boundaries (0.7 / 0.4). | ✅ Enforced |
| **3. Tool Execution** | Dynamic code execution, SSRF via backend proxies. | Hardcoded GenAI SDK model dispatchers; strictly bounded `/api/gemini/*` endpoints without arbitrary shell calls. | ✅ Enforced |
| **4. Memory & State** | Cross-user data leakage, unauthorized document writes/reads. | Enforced Firestore Security Rules checking `request.auth.uid == userId` for every document; undefined stripping. | ✅ Enforced |
| **5. Inter-System Communication** | Gemini API key exposure in browser, unhandled 429/503 outages. | Server-side only key ingestion; 4-tier model fallback ladder with automatic status code retry. | ✅ Enforced |

---

## 3. Cloud Firestore Security Rules (`firestore.rules`)

The application enforces owner-bound access control so that each authenticated user can read and write **only** their own journal reflections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 4. Secret Manager & IAM Configuration

### Step 1: Create and Populate `GEMINI_API_KEY` in Google Secret Manager
```bash
# Enable Google Cloud Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add your Gemini API key version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Step 2: Grant Secret Accessor IAM Role to the Cloud Run Service Account
```bash
# Retrieve your project number
export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Secret Accessor role to the default Compute / Cloud Run service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Cloud Run Deployment Flow

### Step 1: Build & Deploy to Cloud Run with Secret Ingestion
```bash
# Enable Cloud Run and Artifact Registry APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# Deploy the full-stack container to Cloud Run
gcloud run deploy reflect-ai-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Step 2: Apply Mandatory Campaign Label
```bash
# Apply the challenge verification label
gcloud run services update reflect-ai-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Local Development & Testing

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Ensure `.env` contains your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The full-stack application will boot at `http://localhost:3000`.

4. **Production Build & Verification**:
   ```bash
   npm run build
   npm start
   ```

---

## 7. Functional Verification Checklist

- [x] **Google Sign-In**: Authenticates users without saving passwords, securely populating user profiles.
- [x] **Multi-Turn Reflective Dialogue**: Converses with Gemini 3.6 Flash with conversational memory and rich markdown rendering.
- [x] **AI Summarization**: Generates essence, core themes, key takeaways, and growth steps via `/api/gemini/summarize`.
- [x] **Isolated Firestore Storage**: Real-time synchronization to `/users/{userId}/interactions/{id}` with zero undefined property errors.
- [x] **History Management & Export**: Search, category filters, deletion with confirmation, and Markdown/JSON export.
