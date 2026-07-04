import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { db } from "./db";
import { diagrams } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const PORT = parseInt(process.env.BACKEND_PORT || "3001", 10);

  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
  app.use(express.json());

  const rooms = new Map<string, Set<WebSocket>>();

  wss.on("connection", (ws, req) => {
    let currentRoom: string | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join") {
          const roomId = message.roomId;
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(ws);
          currentRoom = roomId;
          console.log(`User joined room: ${roomId}`);
        }

        if (message.type === "update" && currentRoom) {
          const room = rooms.get(currentRoom);
          if (room) {
            room.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "update",
                  code: message.code,
                  userId: message.userId
                }));
              }
            });
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom)!.delete(ws);
        if (rooms.get(currentRoom)!.size === 0) rooms.delete(currentRoom);
      }
    });
  });

  const getAuthUser = async (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];

    try {
      const decoded = await clerk.verifyToken(token);
      return decoded;
    } catch (err) {
      return null;
    }
  };

  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = await clerk.verifyToken(token);
        res.locals.user = decoded;
      } catch (err) {
        res.locals.user = null;
      }
    } else {
      res.locals.user = null;
    }
    return next();
  });

  app.get("/api/diagrams", async (req, res) => {
    if (!res.locals.user) return res.status(401).json({ error: "Unauthorized" });
    const userDiagrams = await db.query.diagrams.findMany({
      where: eq(diagrams.userId, res.locals.user.sub),
      orderBy: [desc(diagrams.updatedAt)]
    });
    res.json(userDiagrams);
  });

  app.post("/api/diagrams", async (req, res) => {
    if (!res.locals.user) return res.status(401).json({ error: "Unauthorized" });
    const { name, code, theme, folderId } = req.body;
    const { v4: uuidv4 } = await import("uuid");
    const id = uuidv4();
    await db.insert(diagrams).values({
      id,
      userId: res.locals.user.sub,
      name: name || "Untitled Diagram",
      code: code || "",
      theme: theme || "dark",
      folderId
    });
    res.json({ id });
  });

  app.post("/api/generate-diagram", async (req, res) => {
    try {
      const { prompt, type } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const systemInstruction = `You are a Mermaid.js diagram expert. 
Generate ONLY valid Mermaid code for the following request. 
Do not include any explanations, markdown code blocks (like \`\`\`mermaid), or any text other than the mermaid code itself.
The diagram type requested is: ${type || 'auto-detect'}.
Request: ${prompt}`;

      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: systemInstruction,
      });

      let text = response.text || "";
      text = text.trim();
      text = text.replace(/^```mermaid\n?/, "").replace(/\n?```$/, "");

      res.json({ mermaid: text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, currentCode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const model = "gemini-1.5-flash";
      const systemInstruction = `You are an expert diagram assistant using Mermaid.js.
The user is working on a diagram with the following code:

${currentCode}

Help the user modify, improve, or explain the diagram.
If you provide new or updated Mermaid code, wrap it in \`\`\`mermaid code blocks.
Be concise and helpful.`;

      const chat = genAI.chats.create({
        model,
        config: { systemInstruction }
      });

      const lastMessage = messages[messages.length - 1].content;
      const response = await chat.sendMessage({ message: lastMessage });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

startServer();
