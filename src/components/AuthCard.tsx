import React from "react";
import { Sparkles, ShieldCheck, Database, Lock, ArrowRight, MessageSquareText, Lightbulb, FileText } from "lucide-react";

interface Props {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const AuthCard: React.FC<Props> = ({ onSignIn, isLoading, error }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl w-full mx-auto space-y-12">
        {/* Main Hero Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl shadow-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
            <Sparkles className="w-8 h-8 text-indigo-100" />
          </div>

          <span className="px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100 mb-4">
            Private Reflective AI Hub
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
            Reflect, Brainstorm, and Gain Clarity with Gemini 3.6 Flash
          </h2>

          <p className="mt-4 text-base text-slate-600 max-w-xl leading-relaxed">
            A private space for multi-turn journal reflections, creative brainstorming, and structured AI summaries. Every interaction is strictly isolated to your verified Google Identity and saved in Cloud Firestore.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 p-4 max-w-md w-full bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start text-left">
              <span className="font-semibold mr-1.5">Sign In Error:</span> {error}
            </div>
          )}

          {/* Sign In CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onSignIn}
              disabled={isLoading}
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.1-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                />
              </svg>
              <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Security Transparency Bar */}
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Password Storing</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Owner-Bound Security Rules</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span>Cloud Firestore Isolation</span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Multi-Turn Journaling
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore your thoughts through conversational back-and-forth reflections. Gemini remembers conversational context within each session.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Brainstorming &amp; Synthesis
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate creative perspectives, discover hidden emotional patterns, or extract actionable growth steps tailored to your situation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Structured Summaries
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Distill lengthy reflections into key takeaways, core themes, and mindful growth questions with one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
