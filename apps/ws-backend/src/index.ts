import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { parse } from "cookie";
import http from "http";
import { JWT_SECRET, REDIS_URL } from "@repo/backend-common/config";
import { Queue } from "bullmq";

const PORT = parseInt(process.env.PORT as string) || 8080;

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

const users: Map<string, WebSocket> = new Map();
const rooms: Map<string, Set<string>> = new Map();

const messageQueue = new Queue("chat-message", {
    connection: { url: REDIS_URL }
});

const checkAuthentication = (token: string): string | null => {
    try {
        if (!token) return null;
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        const actualId = decoded?.userId || decoded?.id; 
        
        if (!actualId) {
            console.error("No ID found in JWT payload:", decoded);
            return null;
        }
        
        return actualId;
    } catch (error) {
        console.error("JWT Verification failed:", error instanceof Error ? error.message : "Invalid token");
        return null;
    }
};

const broadcastUserCount = (roomId: string) => {
    const roomUsers = rooms.get(roomId);
    if (!roomUsers) return;

    const message = JSON.stringify({
        type: "user-count",
        count: roomUsers.size
    });

    for (const userId of roomUsers) {
        const ws = users.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    }
};

server.on("upgrade", (req, socket, head) => {
    console.log("--- New Upgrade Request ---");
    console.log("URL:", req.url);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));

    const cookieHeader = req.headers.cookie || "";

    const cookies = parse(cookieHeader);
    const token = cookies.token || "";

    const userId = checkAuthentication(token);

    if (!userId) {
        console.log("Auth Failed. Sending 401.");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
    }

    console.log("Auth Success. User:", userId);
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, userId);
    });
});

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage, userId: string) => {
    
    // Cleanup existing session for this user
    const existingWs = users.get(userId);
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
        existingWs.close(4000, "Session replaced");
    }
    
    users.set(userId, ws);

    ws.on("message", async (data) => {
        let parsedData;
        try {
            parsedData = JSON.parse(data.toString());
        } catch (e) {
            return;
        }

        if (parsedData.type === "join-room") {
            const { roomId } = parsedData;
            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            const roomUsers = rooms.get(roomId);
            
            if (roomUsers && !roomUsers.has(userId)) {
                roomUsers.add(userId);
                broadcastUserCount(roomId);
            }

        } else if (parsedData.type === "leave-room") {
            const { roomId } = parsedData;
            const roomUsers = rooms.get(roomId);
            if (roomUsers?.has(userId)) {
                roomUsers.delete(userId);
                broadcastUserCount(roomId);
                if (roomUsers.size === 0) rooms.delete(roomId);
            }

        } else if (parsedData.type === "send-data") {
            const { roomId, message } = parsedData;
            const roomUsers = rooms.get(roomId);
            if (!roomUsers) return;

            // Immediate broadcast
            for (let roomUser of roomUsers) {
                const roomUserWs = users.get(roomUser);
                if (roomUserWs?.readyState === WebSocket.OPEN) {
                    roomUserWs.send(JSON.stringify(typeof message === 'object' ? message : {
                        userId,
                        roomId,
                        message,
                        type: "message"
                    }));
                }
            }

            // Persistence via BullMQ
            const isEphemeral = message?.type === "drawing" || message?.type === "cursor";
            if (!isEphemeral) {
                messageQueue.add("saveMessage", { userId, roomId, message });
            }
        }
    });

    ws.on("close", () => {
        users.delete(userId);
        for (const [roomId, roomUsers] of rooms.entries()) {
            if (roomUsers.has(userId)) {
                roomUsers.delete(userId);
                broadcastUserCount(roomId);
                if (roomUsers.size === 0) rooms.delete(roomId);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});