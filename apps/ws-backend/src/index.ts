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
        return decoded?.userId || decoded?.id || null;
    } catch (error) {
        return null;
    }
};

const broadcastUserCount = (roomId: string) => {
    const roomUsers = rooms.get(roomId);
    if (!roomUsers) return;
    const msg = JSON.stringify({ type: "user-count", count: roomUsers.size });
    roomUsers.forEach(uId => {
        const ws = users.get(uId);
        if (ws?.readyState === WebSocket.OPEN) ws.send(msg);
    });
};

server.on("upgrade", (req, socket, head) => {
    const cookies = parse(req.headers.cookie || "");
    const userId = checkAuthentication(cookies.token || "");

    if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, userId);
    });
});

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage, userId: string) => {
    users.set(userId, ws);

    ws.on("message", async (data) => {
        let parsedData;
        try {
            parsedData = JSON.parse(data.toString());
        } catch (e) { return; }

        if (parsedData.type === "join-room") {
            const { roomId } = parsedData;
            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            rooms.get(roomId)?.add(userId);
            broadcastUserCount(roomId);

        } else if (parsedData.type === "leave-room") {
            const { roomId } = parsedData;
            rooms.get(roomId)?.delete(userId);
            broadcastUserCount(roomId);

        } else if (parsedData.type === "send-data") {
            const { roomId, message } = parsedData;
            const roomUsers = rooms.get(roomId);
            if (!roomUsers) return;

            const payload = typeof message === "string" ? JSON.parse(message) : message;

            const outgoingMessage = JSON.stringify({
                ...payload,
                userId
            });

            roomUsers.forEach(uId => {
                const userWs = users.get(uId);
                if (userWs?.readyState === WebSocket.OPEN) {
                    userWs.send(outgoingMessage);
                }
            });

            if (!["drawing", "cursor", "clear"].includes(payload.type)) {
                messageQueue.add("saveMessage", { userId, roomId, message: payload });
            }
        }
    });

    ws.on("close", () => {
        users.delete(userId);
        rooms.forEach((uIds, rId) => {
            if (uIds.has(userId)) {
                uIds.delete(userId);
                broadcastUserCount(rId);
            }
        });
    });
});

server.listen(PORT, () => console.log(`WS Server on port ${PORT}`));