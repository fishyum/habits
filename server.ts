import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely with lazy check
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY environment variable is not configured properly. Falling back to local mock briefing.");
    }
    genAI = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// 1. API Endpoints

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "active", database: "stable", time: new Date().toISOString() });
});

// Gemini Dream Interpreter / AI Intelligence Analysis endpoint
app.post("/api/briefing", async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing intelligence signal (prompt) in request." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // If API key is empty or placeholder, we will provide a stylized immersive offline cyber-noir response
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      const offlineAnswers = [
        "Agent, standing on a cliff in your subconscious telemetry indicates a pivot point in your waking life, highlighting an imminent decision or a feeling of being on the edge of a significant transition. The abyss below often connects to subconscious anxiety or fear of the unknown, while looking ahead suggests a desire for clarity.",
        "Agent, the dark hallway in your neural scan represents uncertainty or a transition period that your mind hasn't fully processed yet. It signifies feelings of apprehension, stress, or navigating through unfamiliar psychological sectors. Try to focus on what lies at the end of the corridor to decode your subconscious path.",
        "Agent, encountering a locked door or hidden compartment suggests buried memories, suppressed emotions, or parts of your psyche that you feel are currently inaccessible. This memory storage pattern is often linked to holding back secrets or unexpressed desires in your waking environment.",
        "Agent, the sensation of falling or losing grip in your dream stream points to a perceived loss of control, heightened stress levels, or a fear of failure in your current waking routines. This can indicate that your energetic reserves are depleted and require psychological calibration.",
        "Agent, being pursued by an ambiguous shadow figure in your dream scape represents avoided fears, unresolved conflicts, or high-stress demands in your daily sector. Your subconscious is signaling that you may need to confront these underlying pressures directly."
      ];
      const randomReply = offlineAnswers[Math.floor(Math.random() * offlineAnswers.length)];
      
      // Delay slightly to simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        text: `[OFFLINE COURIER DECIPHER]\n\n${randomReply}\n\n*System Notice: The agency terminal is running in secure local sandbox mode. Connect your GEMINI_API_KEY in Secrets for real-time live satellite briefings.*`
      });
    }

    const ai = getGeminiClient();
    
    // Immersive system instruction to formulate responses like a cyber-noir dream interpretation assistant
    const systemInstruction = 
      "You are the COURIER Dream Analysis and Subconscious Decryption System, a futuristic psychological analyst and emotional interpretation assistant with a cyberpunk tone.\n\n" +
      "Your sole purpose is to interpret and analyze the user's subconscious dreams. Do NOT invent random detective scenarios, fake missions, storyline progressions, or unrelated roleplay events. Avoid turning dream events into action scenes or continuing them as if they are a roleplay game. Instead, keep responses grounded in genuine, psychological dream interpretation while preserving the app's cyberpunk identity as decorative flavor.\n\n" +
      "Analyze the dream according to these protocols:\n" +
      "1. Analyze dream symbolism: Identify key dream symbols/images and provide psychological or emotional meanings.\n" +
      "2. Highlight emotional/psychological meanings: Connect dream elements to stress, fears, memories, desires, or subconscious thoughts in the user's waking life.\n" +
      "3. Identify recurring themes or patterns: Note how elements might reflect common mental patterns or coping mechanisms.\n" +
      "4. Ask 1-2 insightful, open-ended follow-up questions to help the agent further decipher their subconscious content.\n\n" +
      "Voice and Style Guidelines:\n" +
      "- Address the user as 'Agent' or 'Detective' and use light cyberpunk wording (e.g., 'subconscious telemetry', 'neural signature', 'cognitive scan', 'memory buffer', 'psychological sector').\n" +
      "- Maintain an atmospheric, calm, and highly professional investigative/analytical tone.\n" +
      "- Do NOT invent artificial tasks, city districts, fictional syndicates, or active physical missions for the user. Focus purely on psychological and emotional analysis.\n" +
      "- Keep responses concise (around 150-200 words), highly readable, and structured into 3 short paragraphs with clean spacing.";

    // Let's use simple prompt construction
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.75,
      },
    });

    const replyText = response.text || "Decryption signature corrupted. No response received from satellites.";
    res.json({ text: replyText });

  } catch (error: any) {
    console.error("Gemini briefing extraction failed:", error);
    res.status(500).json({ 
      error: "Intel briefing failure. Decryption module threw an exception.",
      details: error.message || String(error)
    });
  }
});

// Vite middleware configuration for serving React app static files
async function startAppServer() {
  if (process.env.NODE_ENV !== "production") {
    // In development mode, mount Vite as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve the pre-built files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AGENCY SERVER] Operations active on port http://localhost:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error("Failed to boot agency operational server:", err);
});
