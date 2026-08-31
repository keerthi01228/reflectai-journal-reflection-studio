import React from "react";
import { Sparkles, LogOut, Shield, Database, ListChecks, CheckCircle2, User as UserIcon } from "lucide-react";
import { UserProfile } from "../types";

interface Props {
  user: UserProfile | null;
  onSignOut: () => void;
  onOpenThreatModel: () => void;
  onOpenWalkthrough: () => void;
  syncStatus: "synced" | "saving" | "unsaved" | "error";
  onSaveNow?: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  onSignOut,
  onOpenThreatModel,
  onOpenWalkthrough,
  syncStatus,
  onSaveNow,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                ReflectAI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Journaling, Brainstorming &amp; Isolated Firestore Hub
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Security & Threat Model CTA */}
          <button
            onClick={onOpenThreatModel}
            title="Open Threat Model Analysis"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Threat Model</span>
          </button>

          {/* Verification Walkthrough CTA */}
          <button
            onClick={onOpenWalkthrough}
            title="Open Functional Walkthrough"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Walkthrough</span>
          </button>

          {/* Sync Status Badge */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              {syncStatus === "synced" && (
                <span className="text-emerald-700 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Synced
                </span>
              )}
              {syncStatus === "saving" && (
                <span className="text-indigo-600 animate-pulse">Saving...</span>
              )}
              {syncStatus === "unsaved" && (
                <button
                  onClick={onSaveNow}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  Unsaved changes (Save)
                </button>
              )}
              {syncStatus === "error" && (
                <span className="text-rose-600">Sync Error</span>
              )}
            </div>
          )}

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              )}

              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-medium text-slate-800 leading-tight truncate max-w-[130px]">
                  {user.displayName || "Authenticated User"}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {user.email || user.uid.substring(0, 10) + "..."}
                </p>
              </div>

              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Not signed in</div>
          )}
        </div>
      </div>
    </header>
  );
};
