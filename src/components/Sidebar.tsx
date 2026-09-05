import React, { useState } from "react";
import {
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Lightbulb,
  FileText,
  Trash2,
  Download,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { JournalEntry, EntryType } from "../types";

interface Props {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isLoading: boolean;
}

export const Sidebar: React.FC<Props> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDeleteClick = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this reflection? This action cannot be undone.")) {
      try {
        setDeletingId(entryId);
        await onDeleteEntry(entryId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `reflectai_all_entries_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTypeIcon = (type: EntryType) => {
    switch (type) {
      case "brainstorm":
        return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
      case "synthesis":
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
      case "reflection":
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-88 flex flex-col bg-slate-50/70 border-r border-slate-200/80 h-full">
      {/* Top Action & New Entry Button */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <button
          onClick={onNewEntry}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium text-xs shadow-xs hover:shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Reflection</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
          {[
            { id: "all", label: "All" },
            { id: "reflection", label: "Reflections" },
            { id: "brainstorm", label: "Brainstorms" },
            { id: "journal", label: "Journals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? "bg-slate-900 text-white font-medium shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading entries from Firestore...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-600">No reflections found</p>
            <p className="text-[11px] text-slate-400">
              {searchTerm ? "Try adjusting your search query." : "Start your first reflection with Gemini above."}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const msgCount = entry.messages ? entry.messages.length : 0;
            const isDeleting = deletingId === entry.id;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white border-indigo-300 shadow-xs ring-1 ring-indigo-500/20"
                    : "bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center space-x-1.5 overflow-hidden">
                    {getTypeIcon(entry.type)}
                    <h4 className="text-xs font-semibold text-slate-800 truncate">
                      {entry.title || "Untitled Reflection"}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center shrink-0">
                    <Calendar className="w-3 h-3 mr-0.5" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {entry.summary
                    ? entry.summary.replace(/[#*`]/g, "").slice(0, 90) + "..."
                    : entry.messages && entry.messages[0]
                    ? entry.messages[0].text.slice(0, 90) + "..."
                    : "Empty entry..."}
                </p>

                <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-100/80">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {msgCount} {msgCount === 1 ? "turn" : "turns"}
                    </span>
                    {entry.mood && (
                      <span
                        title={entry.classifierRationale || `Mood: ${entry.mood}`}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          entry.mood === "high-stress"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : entry.mood === "stressed"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : entry.mood === "calm"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {entry.mood === "high-stress"
                          ? "High Stress"
                          : entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                      </span>
                    )}
                    {entry.detectedEmotion && (
                      <span
                        title={`Detected Emotion: ${entry.detectedEmotion}`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize"
                      >
                        {entry.detectedEmotion}
                      </span>
                    )}
                    {entry.summary && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700">
                        Summarized
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteClick(e, entry.id)}
                      disabled={isDeleting}
                      title="Delete Entry"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Export */}
      {entries.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-white/80 flex items-center justify-between text-xs text-slate-500">
          <span>{entries.length} {entries.length === 1 ? "reflection" : "reflections"} saved</span>
          <button
            onClick={handleExportAll}
            title="Export all entries to JSON"
            className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All</span>
          </button>
        </div>
      )}
    </aside>
  );
};
