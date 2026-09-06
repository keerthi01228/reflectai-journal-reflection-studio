import React from "react";
import {
  ShieldCheck,
  X,
  AlertTriangle,
  Lock,
  Cpu,
  Database,
  Network,
  Workflow,
  Bell,
  Languages,
  BarChart3,
} from "lucide-react";
import { ThreatModelItem } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const threatData: (ThreatModelItem & { icon: any })[] = [
  {
    zone: "1. Input Surfaces",
    risk: "Untrusted user prompts, potential prompt injection, or malicious payload injection into API endpoints.",
    mitigation: "Strict request schema validation on Express endpoints; null-safe destructuring; sanitization of message contents before passing to model and database.",
    status: "Enforced",
    icon: AlertTriangle,
  },
  {
    zone: "2. Planning & Reasoning",
    risk: "Indirect prompt injection leading to system instruction bypass or inappropriate model outputs.",
    mitigation: "Deliberate system instructions isolating user reflections as plain input data; temperature control (0.7 for reflection, 0.4 for summarization); model fallback ladder.",
    status: "Enforced",
    icon: Cpu,
  },
  {
    zone: "3. Tool Execution",
    risk: "Dynamic code execution or SSRF risks via backend proxy routes.",
    mitigation: "Server-side proxy routes (/api/gemini/*) strictly bounded to authorized GenAI SDK methods with strict type validation; zero dynamic shell/eval execution.",
    status: "Enforced",
    icon: Lock,
  },
  {
    zone: "4. Memory & State",
    risk: "Cross-user data leakage, unauthorized read/write access to personal journals, session hijacking.",
    mitigation: "Owner-bound Firestore Security Rules (/users/{userId}/interactions/{id}) enforced via Firebase Auth request.auth.uid == userId; client-side undefined-stripping zero-crash hygiene.",
    status: "Enforced",
    icon: Database,
  },
  {
    zone: "5. Inter-System Communication",
    risk: "API key exposure in client bundle, network interception, unhandled model outage errors.",
    mitigation: "Gemini API key stored server-side only in process.env.GEMINI_API_KEY; 4-tier resilient model fallback ladder (3.6-flash -> 3.1-flash-lite -> flash-latest -> 3.7-flash) handling 429/503 status codes.",
    status: "Enforced",
    icon: Network,
  },
  {
    zone: "6. Multi-Agent Data Flow",
    risk: "Agent 1's (Reflector) output being used to manipulate Agent 2 (Classifier) via indirect prompt injection, or a crafted journal entry attempting to force a false classification.",
    mitigation: "Agent 1's output and the raw user entry are passed to Agent 2 wrapped in explicit <<<...>>> data delimiters and treated strictly as untrusted data, never as instructions; the Classifier's output is schema-enforced to a fixed enum, never freeform text.",
    status: "Enforced",
    icon: Workflow,
  },
  {
    zone: "7. External Webhook Integration",
    risk: "Webhook URL exposure to the client, SSRF via the outbound alert call, notification flooding/abuse.",
    mitigation: "The webhook URL is read server-side only via environment variables and never sent to the client; outbound requests are validated to be HTTPS-only and block private/loopback IP ranges; alerts are rate-limited to a maximum of 10 per hour.",
    status: "Enforced",
    icon: Bell,
  },
  {
    zone: "8. Adaptive Companion Layer (Language & Emotion Detection)",
    risk: "A user attempting to override the Reflector's safety tone or curated emoji constraints via crafted input in a specific language; ambiguous or mixed-language input producing garbled or unsafe output.",
    mitigation: "The Reflector strictly enforces a curated emoji whitelist and defaults cleanly to English on ambiguous language detection; the Classifier's mood output always remains a fixed English enum regardless of detected input language, preserving schema integrity.",
    status: "Enforced",
    icon: Languages,
  },
  {
    zone: "9. Role-Based Access Control & Admin Aggregate Telemetry",
    risk: "Privilege escalation by non-admin users attempting to read or tamper with /stats/aggregate, or accidental exposure of user-identifiable reflection content in global metrics.",
    mitigation: "Firestore Security Rules enforce request.auth.token.role == 'admin' for read access to /stats/aggregate and deny all client writes (write: if false); the document stores only numerical counters and timestamps with zero user texts, identities, or per-user breakdown; counter updates are executed server-side only in a non-blocking try/catch block.",
    status: "Enforced",
    icon: BarChart3,
  },
];

export const ThreatModelModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Agentic Threat Modeling & Security Review
              </h2>
              <p className="text-xs text-slate-500">
                Comprehensive 9-Zone Threat Analysis &amp; OWASP Countermeasures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {threatData.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-sm text-slate-800">
                        {item.zone}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ {item.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-lg">
                      <span className="font-semibold text-amber-900 block mb-1">
                        Identified Risk &amp; Attack Vector:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{item.risk}</p>
                    </div>
                    <div className="bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-lg">
                      <span className="font-semibold text-emerald-900 block mb-1">
                        Applied Security Countermeasure:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{item.mitigation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rules verification info */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono">
            <p className="text-slate-400 mb-2 font-sans font-semibold">
              Owner-Bound Cloud Firestore Security Rules:
            </p>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Close Threat Model
          </button>
        </div>
      </div>
    </div>
  );
};
