import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || "3001", 10);

// In-memory store
const diagrams: any[] = [];
const folders: any[] = [];
const users: any[] = [];

async function startServer() {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  await app.register(websocket);

  app.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, (socket, req) => {
      const rooms = new Map<string, Set<WebSocket>>();
      let currentRoom: string | null = null;

      socket.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "join") {
            const roomId = message.roomId;
            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            rooms.get(roomId)!.add(socket as unknown as WebSocket);
            currentRoom = roomId;
          }
          if (message.type === "update" && currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
              room.forEach((client) => {
                if (client !== (socket as unknown as WebSocket) && client.readyState === 1) {
                  client.send(JSON.stringify({ type: "update", code: message.code, userId: message.userId }));
                }
              });
            }
          }
        } catch (err) {
          console.error("WS Error:", err);
        }
      });

      socket.on("close", () => {
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom)!.delete(socket as unknown as WebSocket);
          if (rooms.get(currentRoom)!.size === 0) rooms.delete(currentRoom);
        }
      });
    });
  });

  // ── Diagrams CRUD ──

  app.get("/api/diagrams", async (request, reply) => {
    return reply.send(diagrams.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  });

  app.get<{ Params: { id: string } }>("/api/diagrams/:id", async (request, reply) => {
    const diagram = diagrams.find((d) => d.id === request.params.id);
    if (!diagram) return reply.status(404).send({ error: "Not found" });
    return reply.send(diagram);
  });

  app.post<{ Body: { name?: string; code?: string; theme?: string; folderId?: string } }>(
    "/api/diagrams",
    async (request, reply) => {
      const { name, code, theme, folderId } = request.body;
      const diagram = {
        id: uuidv4(),
        name: name || "Untitled Diagram",
        code: code || "",
        theme: theme || "dark",
        folderId: folderId || null,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      diagrams.push(diagram);
      return reply.status(201).send(diagram);
    }
  );

  app.put<{ Params: { id: string }; Body: { name?: string; code?: string; theme?: string; folderId?: string; isArchived?: boolean } }>(
    "/api/diagrams/:id",
    async (request, reply) => {
      const idx = diagrams.findIndex((d) => d.id === request.params.id);
      if (idx === -1) return reply.status(404).send({ error: "Not found" });
      diagrams[idx] = { ...diagrams[idx], ...request.body, updatedAt: new Date() };
      return reply.send(diagrams[idx]);
    }
  );

  app.delete<{ Params: { id: string } }>("/api/diagrams/:id", async (request, reply) => {
    const idx = diagrams.findIndex((d) => d.id === request.params.id);
    if (idx === -1) return reply.status(404).send({ error: "Not found" });
    diagrams.splice(idx, 1);
    return reply.send({ success: true });
  });

  // ── Folders CRUD ──

  app.get("/api/folders", async (request, reply) => {
    return reply.send(folders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.get<{ Params: { id: string } }>("/api/folders/:id", async (request, reply) => {
    const folder = folders.find((f) => f.id === request.params.id);
    if (!folder) return reply.status(404).send({ error: "Not found" });
    return reply.send(folder);
  });

  app.post<{ Body: { name: string; parentId?: string; userId?: string } }>(
    "/api/folders",
    async (request, reply) => {
      const { name, parentId, userId } = request.body;
      const folder = {
        id: uuidv4(),
        name,
        userId: userId || null,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      folders.push(folder);
      return reply.status(201).send(folder);
    }
  );

  app.put<{ Params: { id: string }; Body: { name?: string; parentId?: string } }>(
    "/api/folders/:id",
    async (request, reply) => {
      const idx = folders.findIndex((f) => f.id === request.params.id);
      if (idx === -1) return reply.status(404).send({ error: "Not found" });
      folders[idx] = { ...folders[idx], ...request.body, updatedAt: new Date() };
      return reply.send(folders[idx]);
    }
  );

  app.delete<{ Params: { id: string } }>("/api/folders/:id", async (request, reply) => {
    const idx = folders.findIndex((f) => f.id === request.params.id);
    if (idx === -1) return reply.status(404).send({ error: "Not found" });
    folders.splice(idx, 1);
    return reply.send({ success: true });
  });

  // ── Users CRUD ──

  app.get("/api/users", async (request, reply) => {
    return reply.send(users);
  });

  app.get<{ Params: { id: string } }>("/api/users/:id", async (request, reply) => {
    const user = users.find((u) => u.id === request.params.id);
    if (!user) return reply.status(404).send({ error: "Not found" });
    return reply.send(user);
  });

  app.post<{ Body: { id: string; name?: string; email?: string; avatarUrl?: string } }>(
    "/api/users",
    async (request, reply) => {
      const { id, name, email, avatarUrl } = request.body;
      if (users.find((u) => u.id === id)) return reply.status(409).send({ error: "User already exists" });
      const user = { id, name: name || "", email: email || "", avatarUrl: avatarUrl || "", createdAt: new Date(), updatedAt: new Date() };
      users.push(user);
      return reply.status(201).send(user);
    }
  );

  app.put<{ Params: { id: string }; Body: { name?: string; email?: string; avatarUrl?: string } }>(
    "/api/users/:id",
    async (request, reply) => {
      const idx = users.findIndex((u) => u.id === request.params.id);
      if (idx === -1) return reply.status(404).send({ error: "Not found" });
      users[idx] = { ...users[idx], ...request.body, updatedAt: new Date() };
      return reply.send(users[idx]);
    }
  );

  app.delete<{ Params: { id: string } }>("/api/users/:id", async (request, reply) => {
    const idx = users.findIndex((u) => u.id === request.params.id);
    if (idx === -1) return reply.status(404).send({ error: "Not found" });
    users.splice(idx, 1);
    return reply.send({ success: true });
  });

  // ── AI Routes ──

  app.post("/api/generate-diagram", async (request: any, reply) => {
    try {
      const { prompt, type } = request.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return reply.status(500).send({ error: "Gemini API key is not configured" });

      const genAI = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are a Mermaid.js diagram expert.
Generate ONLY valid Mermaid code for the following request.
Do not include any explanations, markdown code blocks, or any text other than the mermaid code itself.
The diagram type requested is: ${type || "auto-detect"}.
Request: ${prompt}`,
      });

      let text = (response.text || "").trim().replace(/^```mermaid\n?/, "").replace(/\n?```$/, "");
      return reply.send({ mermaid: text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post("/api/chat", async (request: any, reply) => {
    try {
      const { messages, currentCode } = request.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return reply.status(500).send({ error: "Gemini API key is not configured" });

      const genAI = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
      const chat = genAI.chats.create({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction: `You are an expert diagram assistant using Mermaid.js.
The user is working on a diagram with the following code:

${currentCode}

Help the user modify, improve, or explain the diagram.
If you provide new or updated Mermaid code, wrap it in \`\`\`mermaid code blocks.
Be concise and helpful.`,
        },
      });

      const lastMessage = messages[messages.length - 1].content;
      const response = await chat.sendMessage({ message: lastMessage });
      return reply.send({ reply: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      return reply.status(500).send({ error: error.message });
    }
  });

  app.listen({ port: PORT, host: "0.0.0.0" }, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

startServer();
