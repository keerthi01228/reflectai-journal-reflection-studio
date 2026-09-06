import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  auth,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
  getIdTokenResult,
  type User,
} from "./lib/firebase";
import {
  saveInteraction,
  deleteInteraction,
  subscribeUserInteractions,
} from "./lib/firestoreService";
import { JournalEntry, UserProfile } from "./types";
import { Navbar } from "./components/Navbar";
import { AuthCard } from "./components/AuthCard";
import { Sidebar } from "./components/Sidebar";
import { ReflectionStudio } from "./components/ReflectionStudio";
import { ThreatModelModal } from "./components/ThreatModelModal";
import { WalkthroughGuideModal } from "./components/WalkthroughGuideModal";
import { AdminStatsModal } from "./components/AdminStatsModal";
import { Menu, X, PlusCircle } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "unsaved" | "error">("synced");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Keep ref of activeEntryId to preserve active entry across real-time snapshot sync
  const activeEntryIdRef = useRef<string | null>(null);
  activeEntryIdRef.current = activeEntry?.id || null;

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
          setAuthError(null);

          // Directive 12: Verify custom claim role == 'admin' via getIdTokenResult()
          try {
            const tokenResult = await getIdTokenResult(user);
            setIsAdmin(tokenResult.claims?.role === "admin");
          } catch (tokenErr) {
            console.warn("Could not retrieve custom claims for user:", tokenErr);
            setIsAdmin(false);
          }
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
          setEntries([]);
          setActiveEntry(null);
        }
        setAuthLoading(false);
      },
      (error) => {
        console.error("Auth listener error:", error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper to create a blank initial entry
  const createNewBlankEntry = useCallback((userId: string): JournalEntry => {
    const newId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: newId,
      userId,
      title: "New Reflection",
      type: "reflection",
      messages: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  // Subscribe to user's Firestore collection when authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    setEntriesLoading(true);
    const unsubscribe = subscribeUserInteractions(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setEntriesLoading(false);

        // If no active entry is selected, or current active was updated
        if (activeEntryIdRef.current) {
          const matching = fetchedEntries.find((e) => e.id === activeEntryIdRef.current);
          if (matching) {
            setActiveEntry(matching);
          }
        } else if (fetchedEntries.length > 0) {
          setActiveEntry(fetchedEntries[0]);
        } else {
          // If no entries exist in Firestore, start with a fresh one
          setActiveEntry(createNewBlankEntry(currentUser.uid));
        }
      },
      (err) => {
        console.error("Error fetching entries:", err);
        setSaveError("Failed to sync entries with Firestore.");
        setSyncStatus("error");
        setEntriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, createNewBlankEntry]);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setAuthError(err.message || "Failed to sign in with Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Sign-out
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err: any) {
      console.error("Sign-out error:", err);
    }
  };

  // Guaranteed Firestore Persistence Handler
  const handleSaveEntry = async (entryToSave: JournalEntry) => {
    if (!currentUser?.uid) return;

    setSyncStatus("saving");
    setSaveError(null);

    try {
      await saveInteraction(currentUser.uid, entryToSave);
      setSyncStatus("synced");
    } catch (err: any) {
      console.error("Failed to save to Firestore:", err);
      setSyncStatus("error");
      setSaveError(err.message || "Failed to save reflection to Firestore. Please retry.");
    }
  };

  // Handle creating a new entry
  const handleNewEntry = () => {
    if (!currentUser?.uid) return;
    const fresh = createNewBlankEntry(currentUser.uid);
    setActiveEntry(fresh);
    setIsMobileSidebarOpen(false);
  };

  // Handle selecting an existing entry
  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setIsMobileSidebarOpen(false);
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteInteraction(currentUser.uid, entryId);
      if (activeEntry?.id === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          setActiveEntry(createNewBlankEntry(currentUser.uid));
        }
      }
    } catch (err: any) {
      console.error("Failed to delete entry:", err);
      setSaveError("Failed to delete reflection from Firestore.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Header */}
      <Navbar
        user={currentUser}
        isAdmin={isAdmin}
        onOpenAdminStats={() => setIsAdminModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenThreatModel={() => setIsThreatModalOpen(true)}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        syncStatus={syncStatus}
        onSaveNow={() => activeEntry && handleSaveEntry(activeEntry)}
      />

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-500 font-medium">
              Verifying Google Authentication &amp; Firestore Connection...
            </p>
          </div>
        ) : !currentUser ? (
          <AuthCard
            onSignIn={handleSignIn}
            isLoading={authLoading}
            error={authError}
          />
        ) : (
          <div className="flex-1 flex relative overflow-hidden">
            {/* Mobile Sidebar Toggle Button */}
            <div className="md:hidden absolute top-3 left-4 z-20">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="p-2 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg text-slate-700 shadow-xs"
              >
                {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

            {/* Desktop & Mobile Responsive Sidebar */}
            <div
              className={`fixed inset-y-0 left-0 z-40 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
              }`}
            >
              <Sidebar
                entries={entries}
                selectedEntryId={activeEntry?.id || null}
                onSelectEntry={handleSelectEntry}
                onNewEntry={handleNewEntry}
                onDeleteEntry={handleDeleteEntry}
                isLoading={entriesLoading}
              />
            </div>

            {/* Backdrop for mobile drawer */}
            {isMobileSidebarOpen && (
              <div
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 z-30 bg-slate-900/40 md:hidden backdrop-blur-2xs"
              />
            )}

            {/* Active Reflection Studio Workspace */}
            {activeEntry ? (
              <ReflectionStudio
                key={activeEntry.id}
                entry={activeEntry}
                onUpdateEntry={(updated) => {
                  setActiveEntry(updated);
                  setSyncStatus("unsaved");
                }}
                onSaveEntry={handleSaveEntry}
                isSaving={syncStatus === "saving"}
                saveError={saveError}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <PlusCircle className="w-12 h-12 mb-3 text-indigo-400 stroke-[1.5]" />
                <h3 className="text-sm font-semibold text-slate-700">No active reflection</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Select an entry from your history or start a new reflection.
                </p>
                <button
                  onClick={handleNewEntry}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Create New Reflection
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Threat Modeling & Security Review Modal */}
      <ThreatModelModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
      />

      {/* Step-by-Step Functional Walkthrough Modal */}
      <WalkthroughGuideModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />

      {/* Admin Aggregate Telemetry Modal (Directive 12: Admin only) */}
      {isAdmin && (
        <AdminStatsModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}
    </div>
  );
}
