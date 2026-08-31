import React from "react";
import { CheckCircle2, ListChecks, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WalkthroughGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const testCases = [
    {
      id: "TC-01",
      title: "Firebase Authentication & Session Persistence",
      description: "Verify secure Google Sign-In, profile rendering, and isolated session instantiation without password handling.",
      steps: [
        "Click the 'Sign in with Google' button on the landing page.",
        "Complete Google authentication popup/flow.",
        "Confirm automatic transition to the private dashboard with user avatar and display name in the top navigation.",
      ],
      expected: "User session is established; auth state listener detects UID and binds database queries to /users/{uid}."
    },
    {
      id: "TC-02",
      title: "Multi-Turn Journal Reflection with Gemini 3.6 Flash",
      description: "Ensure user thoughts are processed by the server-side Gemini fallback ladder with markdown formatting.",
      steps: [
        "Select a reflection mode (Journal, Brainstorm, or Synthesis).",
        "Type a reflection or click an inspiration prompt pill, then click 'Reflect with Gemini' (or press Cmd+Enter).",
        "Observe the loading indicator and review the multi-turn conversational response rendered in rich markdown.",
        "Add a follow-up response in the multi-turn thread and verify conversation context preservation.",
      ],
      expected: "Gemini responds with compassionate inquiry; model fallback ladder guarantees uptime; token usage remains server-secured."
    },
    {
      id: "TC-03",
      title: "AI Summarization & Key Takeaways Extraction",
      description: "Verify structured AI summarization of journal entries into essence, bullet insights, and actionable growth questions.",
      steps: [
        "With one or more entries in the active reflection, click 'AI Summarize'.",
        "Verify the summary drawer appears with Core Theme, Key Takeaways, and Growth Steps.",
      ],
      expected: "Server invokes /api/gemini/summarize and populates the summary card with structured insights."
    },
    {
      id: "TC-04",
      title: "Isolated Cloud Firestore Persistence & Zero-Crash Hygiene",
      description: "Confirm inputs and responses are persisted strictly to the user's isolated subcollection with undefined-stripping.",
      steps: [
        "Click 'Save to Firestore' or observe automatic autosave.",
        "Check that the status pill displays 'Synced with Firestore' with timestamp.",
        "Refresh the browser or switch entries; verify past entries remain fully restored in the history sidebar.",
      ],
      expected: "Document saved at /users/{userId}/interactions/{interactionId}; zero undefined property runtime errors."
    },
    {
      id: "TC-05",
      title: "History Management, Search, & Export",
      description: "Validate entry search, category filtering, deletion with confirmation, and Markdown/JSON export.",
      steps: [
        "Create 2-3 distinct reflections with different tags or modes.",
        "Use the search bar in the history sidebar to filter entries by keyword.",
        "Click 'Export Reflection' to download Markdown or JSON representation.",
        "Click 'Delete' on an entry, confirm the deletion modal, and verify it is permanently removed from Firestore.",
      ],
      expected: "Real-time snapshot listener updates sidebar list seamlessly; document is removed from user's isolated path."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Functional Stability &amp; Verification Walkthrough
              </h2>
              <p className="text-xs text-slate-500">
                Step-by-Step Test Suites for User Journey and Security Verification
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
            This verification walkthrough breaks down all functional processes, AI fallback ladders, and Firestore user isolation paths into concrete test scenarios.
          </p>

          <div className="space-y-4">
            {testCases.map((tc) => (
              <div key={tc.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-xs font-semibold">
                      {tc.id}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900">{tc.title}</h3>
                  </div>
                  <span className="flex items-center text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Interactive
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">{tc.description}</p>
                
                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2 mb-2 border border-slate-100">
                  <span className="font-semibold text-slate-700 block">Verification Steps:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    {tc.steps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-emerald-900">Expected Criterion: </span>
                  {tc.expected}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
