import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  BookOpen,
  Lightbulb,
  FileText,
  Save,
  CheckCircle2,
  RefreshCw,
  Copy,
  Download,
  AlertCircle,
  Clock,
  Compass,
  CornerDownLeft,
} from "lucide-react";
import Markdown from "react-markdown";
import { JournalEntry, JournalMessage, EntryType } from "../types";

interface Props {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => void;
  onSaveEntry: (entry: JournalEntry) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
}

export const ReflectionStudio: React.FC<Props> = ({
  entry,
  onUpdateEntry,
  onSaveEntry,
  isSaving,
  saveError,
}) => {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([
    "What is something that gave you unexpected clarity or joy today?",
    "What challenge is currently on your mind, and what is one small aspect within your control?",
    "If you step back and observe today without judgment, what story does it tell?",
    "What is an idea or curiosity you've been putting off exploring?",
  ]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on message addition
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entry.messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Mode Selection
  const handleTypeChange = (newType: EntryType) => {
    onUpdateEntry({
      ...entry,
      type: newType,
      updatedAt: new Date().toISOString(),
    });
  };

  // Title Update
  const handleTitleChange = (newTitle: string) => {
    onUpdateEntry({
      ...entry,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  // Fetch Inspiration Prompts from Gemini
  const handleFetchPrompts = async (category = "daily_reflection") => {
    try {
      setIsLoadingPrompts(true);
      const res = await fetch("/api/gemini/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.prompts && Array.isArray(data.prompts)) {
        setPrompts(data.prompts);
      }
    } catch (err) {
      console.warn("Failed to load dynamic prompts:", err);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // Submit Reflection / Turn
  const handleSubmitReflection = async () => {
    if (!inputText.trim() || isGenerating) return;

    const userMessageText = inputText.trim();
    const newUserMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: "user",
      text: userMessageText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...entry.messages, newUserMessage];
    
    // Auto-derive title if currently untitled
    let updatedTitle = entry.title;
    if (!updatedTitle || updatedTitle === "Untitled Reflection" || updatedTitle === "New Reflection") {
      updatedTitle = userMessageText.length > 40
        ? userMessageText.substring(0, 37) + "..."
        : userMessageText;
    }

    const nextEntry: JournalEntry = {
      ...entry,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update entry state so user sees their input immediately
    onUpdateEntry(nextEntry);
    setApiError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/gemini/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          currentEntry: userMessageText,
          mode: entry.type,
          context: `Title: ${updatedTitle}`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate reflection from Gemini");
      }

      const geminiMessage: JournalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        role: "model",
        text: result.reflection,
        timestamp: new Date().toISOString(),
        modelUsed: result.modelUsed,
      };

      const finalEntry: JournalEntry = {
        ...nextEntry,
        messages: [...updatedMessages, geminiMessage],
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(finalEntry);
      setInputText("");

      // Guaranteed Persistence to Firestore
      await onSaveEntry(finalEntry);
    } catch (err: any) {
      console.error("Reflection generation error:", err);
      setApiError(err.message || "An unexpected error occurred while communicating with Gemini.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Summarize with Gemini
  const handleSummarize = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;

    setIsSummarizing(true);
    setApiError(null);

    try {
      const response = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: entry.title,
          entries: entry.messages,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate summary");
      }

      const updatedWithSummary: JournalEntry = {
        ...entry,
        summary: result.summary,
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(updatedWithSummary);
      await onSaveEntry(updatedWithSummary);
    } catch (err: any) {
      console.error("Summarization error:", err);
      setApiError(err.message || "Failed to generate AI summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Export current entry to Markdown
  const handleExportMarkdown = () => {
    let md = `# ${entry.title || "Reflective Journal"}\n\n`;
    md += `**Date:** ${new Date(entry.createdAt).toLocaleDateString()} | **Type:** ${entry.type}\n\n`;
    
    if (entry.summary) {
      md += `## AI Summary & Synthesis\n\n${entry.summary}\n\n---\n\n`;
    }

    md += `## Reflection Dialogue\n\n`;
    entry.messages.forEach((msg) => {
      md += `### ${msg.role === "user" ? "👤 Personal Entry" : "✨ Gemini Reflection"}\n`;
      md += `*${new Date(msg.timestamp).toLocaleTimeString()}*\n\n`;
      md += `${msg.text}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(entry.title || "reflection").toLowerCase().replace(/[^a-z0-9]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Handle keyboard shortcut (Cmd+Enter or Ctrl+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmitReflection();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title Input & Type Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <input
              type="text"
              value={entry.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title your reflection..."
              className="text-lg font-bold text-slate-900 placeholder-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors w-full max-w-md truncate"
            />
          </div>
          <p className="text-xs text-slate-400 flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>Started {new Date(entry.createdAt).toLocaleString()}</span>
          </p>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Mode Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs">
            <button
              onClick={() => handleTypeChange("reflection")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                entry.type === "reflection"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reflection</span>
            </button>
            <button
              onClick={() => handleTypeChange("brainstorm")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                entry.type === "brainstorm"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Brainstorm</span>
            </button>
            <button
              onClick={() => handleTypeChange("synthesis")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                entry.type === "synthesis"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Synthesis</span>
            </button>
          </div>

          {/* AI Summarize Button */}
          <button
            onClick={handleSummarize}
            disabled={isSummarizing || entry.messages.length === 0}
            title="Summarize key insights and action items with Gemini"
            className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? "animate-spin" : ""}`} />
            <span>{isSummarizing ? "Summarizing..." : "AI Summarize"}</span>
          </button>

          {/* Export Markdown */}
          <button
            onClick={handleExportMarkdown}
            title="Export as Markdown document"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Manual Save Button */}
          <button
            onClick={() => onSaveEntry(entry)}
            disabled={isSaving}
            title="Explicitly save reflection to Firestore"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-pulse" : ""}`} />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Error Banners */}
      {(apiError || saveError) && (
        <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              {apiError ? `AI Error: ${apiError}` : `Firestore Save Error: ${saveError}`}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {saveError && (
              <button
                onClick={() => onSaveEntry(entry)}
                className="px-2.5 py-1 bg-rose-600 text-white font-medium rounded hover:bg-rose-700 transition-colors"
              >
                Retry Save
              </button>
            )}
            <button
              onClick={() => {
                setApiError(null);
              }}
              className="text-rose-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Dialogue and Reflection Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* AI Summary Section Card if generated */}
        {entry.summary && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/50 border border-purple-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-purple-950">
                  Gemini Reflection Synthesis &amp; Takeaways
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider bg-purple-100/60 px-2 py-0.5 rounded">
                AI Summary
              </span>
            </div>
            <div className="text-xs text-slate-800 leading-relaxed markdown-body">
              <Markdown>{entry.summary}</Markdown>
            </div>
          </div>
        )}

        {/* Empty state / Welcome prompt helper */}
        {entry.messages.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Begin Your Reflection Journey
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Write freely about what is happening in your life, your thoughts, or a creative project. Gemini will provide thoughtful insights, reframing, and structure.
              </p>
            </div>

            {/* Inspiration Prompt Pills */}
            <div className="w-full pt-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">
                  Inspiring Prompts:
                </span>
                <button
                  onClick={() => handleFetchPrompts()}
                  disabled={isLoadingPrompts}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingPrompts ? "animate-spin" : ""}`} />
                  <span>Refresh prompts</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {prompts.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setInputText(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 text-left text-xs bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 rounded-xl text-slate-700 transition-all cursor-pointer group"
                  >
                    <span className="group-hover:text-indigo-900 transition-colors">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Multi-turn Messages */}
        {entry.messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id || idx}
              className={`flex items-start gap-3.5 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-semibold ${
                  isUser
                    ? "bg-slate-900 text-white"
                    : "bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white"
                }`}
              >
                {isUser ? "You" : <Sparkles className="w-4 h-4 text-indigo-100" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 shadow-xs relative group ${
                  isUser
                    ? "bg-slate-900 text-white rounded-tr-xs"
                    : "bg-slate-50/90 text-slate-800 border border-slate-200/80 rounded-tl-xs"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-80">
                  <span className="font-semibold">
                    {isUser ? "Journal Entry" : "Gemini Reflection"}
                  </span>
                  <div className="flex items-center space-x-2">
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 text-indigo-800">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "whitespace-pre-wrap font-sans text-slate-100"
                      : "markdown-body text-slate-800"
                  }`}
                >
                  {isUser ? (
                    msg.text
                  ) : (
                    <Markdown>{msg.text}</Markdown>
                  )}
                </div>

                {/* Copy Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyMessage(msg.text, idx)}
                    title="Copy message"
                    className={`p-1 rounded-md text-xs transition-colors ${
                      isUser
                        ? "text-slate-300 hover:text-white hover:bg-slate-800"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {copiedIndex === idx ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner for Reflection Generation */}
        {isGenerating && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-100" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs max-w-sm flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-slate-600 font-medium">
                Gemini is reflecting on your thoughts...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Prompt suggestions bar if dialogue is active */}
          {entry.messages.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 shrink-0">Quick follow-ups:</span>
              {[
                "Can you help me reframe this positively?",
                "What blind spots might I be missing?",
                "What are 3 practical next steps?",
                "How does this relate to my long-term clarity?",
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(pill)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Textarea + Action buttons */}
          <div className="relative rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xs transition-all">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                entry.type === "brainstorm"
                  ? "Describe the idea, dilemma, or concept you want to brainstorm..."
                  : entry.type === "synthesis"
                  ? "Write down your raw thoughts to synthesize..."
                  : "Reflect on your day, feelings, challenges, or aspirations... (Cmd+Enter to reflect)"
              }
              rows={2}
              className="w-full px-4 pt-3.5 pb-12 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent resize-none focus:outline-none"
            />

            {/* Bottom bar inside textarea */}
            <div className="absolute bottom-2.5 left-4 right-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <span>{inputText.length} characters</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline flex items-center">
                  Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] mx-1 font-mono">⌘+Enter</kbd>
                </span>
              </span>

              <button
                onClick={handleSubmitReflection}
                disabled={!inputText.trim() || isGenerating}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Reflect</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
