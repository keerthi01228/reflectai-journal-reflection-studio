import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Standard Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security & CORS headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

// Lazy initialization helper for Google GenAI SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not set. API calls will fail until configured in Settings.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// Resilient Helper: Executes generation across fallback ladder
async function generateContentWithFallback(options: {
  contents: string | Array<{ role?: string; parts: Array<{ text: string }> }>;
  systemInstruction?: string;
  config?: any;
}) {
  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          ...options.config,
        },
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || (err?.message?.includes("429") ? 429 : err?.message?.includes("503") ? 503 : 500);
      console.warn(`Model ${modelName} failed with status/error: ${err?.message || err}. Attempting next model in fallback ladder...`);
      // Continue to next fallback in ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || "Unknown error"}`);
}

// Health Check API
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Multi-Turn Reflective Chat & Journaling Partner Endpoint
app.post("/api/gemini/reflect", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const { messages = [], currentEntry = "", mode = "reflection", context = "" } = body;

    if (!currentEntry && (!Array.isArray(messages) || messages.length === 0)) {
      res.status(400).json({ error: "No input text or message history provided" });
      return;
    }

    let systemPrompt = `You are a compassionate, thoughtful, and insightful AI journaling partner and reflective counselor.
Your role is to help the user unpack their thoughts, explore underlying emotions, brainstorm creative angles, discover patterns, and find clarity without judgment.

Guidelines:
- Maintain an encouraging, mindful, and constructive tone.
- Acknowledge their lived experience and highlight positive resilience where appropriate.
- Provide thoughtful inquiry or open-ended questions that provoke meaningful self-reflection.
- Format responses cleanly with Markdown (bullet points, clear paragraphs, bold emphasis) for pleasant readability.
- Mode: ${mode}
${context ? `Additional user reflection context: ${context}` : ""}`;

    if (mode === "brainstorm") {
      systemPrompt += `\nFocus heavily on creative divergent thinking, generating unique possibilities, pros/cons, and actionable stepping stones.`;
    } else if (mode === "synthesis") {
      systemPrompt += `\nFocus on synthesizing themes, identifying cognitive habits or blind spots with kindness, and providing clear distillations.`;
    }

    // Build conversation contents
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg && typeof msg.text === "string" && msg.text.trim()) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text.trim() }],
          });
        }
      }
    }

    if (currentEntry && typeof currentEntry === "string" && currentEntry.trim()) {
      contents.push({
        role: "user",
        parts: [{ text: currentEntry.trim() }],
      });
    }

    const result = await generateContentWithFallback({
      contents,
      systemInstruction: systemPrompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      reflection: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Error generating reflection:", error);
    res.status(500).json({
      error: error.message || "Failed to generate reflection from Gemini API",
    });
  }
});

// Summarization Endpoint for Reflections & Journal Entries
app.post("/api/gemini/summarize", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const { title = "", entries = [], rawText = "" } = body;

    let contentToSummarize = rawText;
    if (!contentToSummarize && Array.isArray(entries)) {
      contentToSummarize = entries
        .map((e: any) => `${e.role === "user" ? "User" : "Gemini"}: ${e.text || ""}`)
        .join("\n\n");
    }

    if (!contentToSummarize.trim()) {
      res.status(400).json({ error: "No content provided to summarize" });
      return;
    }

    const prompt = `Please analyze and summarize the following reflective journal entry / conversation titled "${title || "Untitled Reflection"}".

Provide:
1. **Core Theme / Essence**: 1-2 concise sentences summarizing the core focus.
2. **Key Takeaways & Insights**: 2-4 bullet points highlighting main feelings, realizations, or breakthroughs.
3. **Actionable Growth Steps / Questions**: 2-3 inspiring reflection questions or micro-actions for personal development.
4. **Suggested Tags**: 3-5 keywords (e.g. #mindfulness, #productivity, #gratitude).

Content:
${contentToSummarize}`;

    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction: "You are a master summarizer and thoughtful reflection coach. Provide clean, inspiring, markdown-formatted structured summaries.",
      config: {
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      summary: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Error generating summary:", error);
    res.status(500).json({
      error: error.message || "Failed to generate summary from Gemini API",
    });
  }
});

// Brainstorming & Prompt Suggestions Endpoint
app.post("/api/gemini/prompts", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const { category = "daily_reflection" } = body;

    const prompt = `Generate 4 thoughtful, inspiring, and non-generic journaling prompts for the category: "${category}".
Return a JSON array of strings containing just the 4 prompt questions, with no extra surrounding text.`;

    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction: "You are an expert mindfulness and creative writing coach. Output valid JSON only: [\"prompt 1\", \"prompt 2\", ...]",
      config: {
        responseMimeType: "application/json",
      },
    });

    let prompts: string[] = [];
    try {
      prompts = JSON.parse(result.text);
    } catch {
      prompts = [
        "What is currently energizing you, and what is subtly draining your momentum?",
        "What is a perspective shift that made you reconsider a recent challenge?",
        "If you could offer your future self one anchor of clarity today, what would it be?",
        "What is a small win or quiet moment of beauty you noticed today?",
      ];
    }

    res.json({ success: true, prompts });
  } catch (error: any) {
    console.error("Error generating prompts:", error);
    res.json({
      success: true,
      prompts: [
        "What is one emotion you haven't fully acknowledged yet today?",
        "What would your day look like if you prioritized peaceful focus over speed?",
        "What is a dilemma you are wrestling with, and what would a wise mentor say?",
        "What are three things you can let go of to create breathing room?",
      ],
    });
  }
});

// Vite Middleware & Static Server Configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
