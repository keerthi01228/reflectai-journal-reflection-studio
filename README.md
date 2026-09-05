# ReflectAI — Multi-Agent Journal & Reflection Studio with Adaptive Companion Intelligence

A production-grade, secure web application combining **Firebase Authentication (Google Sign-In)**, **Google Cloud Firestore (User-Isolated Collections)**, and a **two-agent Gemini pipeline** for reflective journaling, brainstorming, and emotionally-aware, multilingual conversation — with automatic high-stress alerting to an external channel.

Built on top of the base "Personal Gemini Journal" template for the **Google Cloud Gen AI Academy APAC — Accelerate AI with Cloud Run** challenge, then extended with two original feature layers described below.

---

## 1. What Makes This More Than the Base Template

### Feature 1 — Multi-Agent Reflection Pipeline
Every journal entry is processed by **two independent Gemini agents**, not one:

- **Agent 1 (Reflector):** generates an empathetic, thoughtful reflection in response to the user's entry.
- **Agent 2 (Classifier):** reads the entry and Agent 1's reflection, and independently classifies the emotional/stress state into a fixed enum: `calm` | `neutral` | `stressed` | `high-stress`. This classification is treated as trusted, structured output — never freeform text — and is stored alongside the reflection in Firestore.

### Feature 2 — Adaptive Companion Layer (Emotion, Language, Emoji)
The Reflector agent additionally:
- Detects the **specific emotion** in the entry (joy, sadness, grief, anxiety, anger, calm, etc.) and matches its tone accordingly (gentle for grief, grounding for anxiety, celebratory for joy).
- Responds **fluently in whatever language the user wrote in** (tested with English, Hindi, and Tamil), while the Classifier's output always stays a fixed English enum — preserving schema and downstream logic regardless of input language.
- Uses **at most 1–2 emojis**, chosen only from a small curated set mapped to the detected emotion — never freely generated.

### Feature 3 — Smart Alert Webhook
When the Classifier detects a **high-stress** entry, the backend automatically and securely notifies a private Discord channel with the mood, AI rationale, and a truncated snippet — framed as a personal check-in nudge, not surveillance. Calm/neutral entries never trigger a notification. The webhook:
- Runs entirely server-side; the webhook URL is never exposed to the client.
- Validates the target URL (HTTPS-only, blocks private/internal IP ranges) as an SSRF defense.
- Is rate-limited (max 10 alerts/hour) to prevent notification flooding.
- Fails silently (logged, never thrown) so a webhook outage can never block saving the user's reflection.

---

## 2. Architecture & Security Specifications

| Layer | Technology | Security & Isolation Strategy |
| :--- | :--- | :--- |
| **Authentication** | Firebase Auth (Google Sign-In) | Federated identity; zero custom password handling; JWT-authenticated sessions. |
| **Database** | Cloud Firestore | Owner-bound security rules (`/users/{userId}/interactions/{id}`); zero-undefined payload stripping before every write. |
| **AI Intelligence** | Gemini (`@google/genai`) | 4-tier model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`), with a per-model cooldown circuit breaker so a rate-limited model is skipped on subsequent requests instead of being retried immediately. |
| **Multi-Agent Isolation** | Agent 1 (Reflector) + Agent 2 (Classifier) | Agent 1's output is passed to Agent 2 strictly as delimited, untrusted data — never as an instruction — per OWASP LLM01 indirect prompt injection defense. |
| **Secret Management** | Cloud Run environment variables | `GEMINI_API_KEY` and `ALERT_WEBHOOK_URL` are read exclusively server-side via `process.env`; never hardcoded, never sent to the client. |
| **Hosting & Ingress** | Google Cloud Run (containerized) | Full-stack unified Express + Vite server binding on port `3000`, with the service explicitly deployed using `--port 3000` to match Cloud Run's ingress routing. |

---

## 3. Agentic Threat Model Summary

| Threat Zone | Identified Attack Vectors & Risks | Applied Countermeasure & Defense | Status |
| :--- | :--- | :--- | :--- |
| **Input Surfaces** | Malicious JSON payloads, prompt injection, oversized payloads. | Explicit Express body-parser limits, null-safe destructuring, text sanitization before model & DB sinks. | ✅ Enforced |
| **Planning & Reasoning** | System instruction bypass; a crafted journal entry attempting to manipulate the Classifier's output. | Agent 1's output and the raw user entry are passed to Agent 2 wrapped in explicit `<<<...>>>` data delimiters and instructed never to be treated as commands. | ✅ Enforced |
| **Tool Execution** | Dynamic code execution, SSRF via the outbound webhook call. | Webhook destination is validated (HTTPS-only, private/loopback IP ranges blocked) before every send. | ✅ Enforced |
| **Memory & State** | Cross-user data leakage, unauthorized document reads/writes. | Firestore Security Rules enforce `request.auth.uid == userId` on every document; undefined-value stripping before every write. | ✅ Enforced |
| **Inter-System Communication** | Gemini API key or webhook URL exposure in the browser; unhandled 429/503 model outages. | Both secrets are read server-side only via environment variables; the 4-tier fallback ladder with a cooldown map absorbs quota/availability errors automatically. | ✅ Enforced |

---

## 4. Cloud Firestore Security Rules (`firestore.rules`)

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

Each interaction document stores: `userEntry`, `reflectorOutput`, `mood`, `classifierRationale`, `classificationStatus` (`pending` | `complete` | `failed`), `detectedEmotion`, `detectedLanguage`, and a timestamp — all under the same owner-bound path above, so the new fields introduce zero additional attack surface.

---

## 5. Environment Variables & Secret Configuration

The app reads two secrets from the environment at runtime — neither is ever committed to source control (see `.env.example` for the placeholder template).

| Variable | Purpose | Where it's used |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Authenticates all Gemini API calls (Reflector, Classifier, Summarizer, Prompt Inspiration). | `server.ts`, read via `process.env.GEMINI_API_KEY`. |
| `ALERT_WEBHOOK_URL` | Discord/Slack webhook endpoint for high-stress alerts. Optional — if unset, alerts are skipped silently, never blocking a save. | `server.ts`, read via `process.env.ALERT_WEBHOOK_URL`. |

### Setting secrets on Cloud Run
```bash
gcloud run services update <SERVICE_NAME> \
  --region <REGION> \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY",ALERT_WEBHOOK_URL="YOUR_WEBHOOK_URL"
```

### (Alternative, more production-hardened) Google Secret Manager path
```bash
gcloud services enable secretmanager.googleapis.com

gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 6. Cloud Run Deployment Flow

> **Important:** `server.ts` listens on a fixed port `3000`. When deploying with `gcloud run deploy`, you must explicitly pass `--port 3000` so Cloud Run routes ingress traffic correctly — without it, the container will fail its startup health check.

### Step 1 — Build the container image
```bash
gcloud builds submit --pack image=gcr.io/<PROJECT_ID>/<SERVICE_NAME>
```

### Step 2 — Deploy to Cloud Run
```bash
gcloud run deploy <SERVICE_NAME> \
  --image gcr.io/<PROJECT_ID>/<SERVICE_NAME> \
  --region <REGION> \
  --allow-unauthenticated \
  --port 3000
```

### Step 3 — Set environment variables (see Section 5)

### Step 4 — Apply the mandatory campaign label
```bash
gcloud run services update <SERVICE_NAME> \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=<REGION>
```

### Step 5 — Wire up Firebase Authentication for the new domain
Once deployed, add the Cloud Run service URL to all three of the following, so Google Sign-In works on the live domain:
1. **Firebase Console → Authentication → Settings → Authorized domains** — add the bare domain (no `https://`, no trailing slash).
2. **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized JavaScript origins** — add the full origin (`https://your-service-url`).
3. *(Optional)* If restricting your Firebase browser API key by website, add the origin with a trailing `/*` wildcard under **Website restrictions**.

---

## 7. Local Development & Testing

1. **Install dependencies**
```bash
   npm install
```
2. **Configure environment variables** — create `.env` from `.env.example` and fill in `GEMINI_API_KEY` (and optionally `ALERT_WEBHOOK_URL`).
3. **Start the development server**
```bash
   npm run dev
```
   The full-stack app boots at `http://localhost:3000`.
4. **Production build & local verification**
```bash
   npm run build
   npm start
```

---

## 8. Functional Verification Checklist

- [x] **Google Sign-In** — authenticates users without ever handling passwords.
- [x] **Multi-turn reflective dialogue** — conversational memory, markdown rendering, emotion- and language-adaptive tone.
- [x] **Multi-agent classification** — every entry is independently tagged `calm` / `neutral` / `stressed` / `high-stress`, with a stored rationale.
- [x] **Smart alert webhook** — fires exactly once per high-stress entry, rate-limited, fails silently on error.
- [x] **Isolated Firestore storage** — real-time sync to `/users/{userId}/interactions/{id}`, zero cross-user leakage.
- [x] **Resilient Gemini fallback ladder** — verified live under real `429`/`503` upstream errors; automatically retries the next model without surfacing an error to the user.
- [x] **History management & export** — search, filter, deletion with confirmation, Markdown/JSON export.

---

## 9. Live Deployment

- **Live app:** `https://reflectai-reflection-studio-v2-938456706251.asia-southeast1.run.app`
- **Cloud Run service:** `reflectai-reflection-studio-v2` (region: `asia-southeast1`)
- **Firebase / GCP project:** `genai-academy-t1`
