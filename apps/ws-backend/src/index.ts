import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

import { REDIS_URL } from "@repo/backend-common/config";
import { Queue } from "bullmq";

const PORT = parseInt(process.env.PORT as string) || 8080;

const wss = new WebSocketServer({ port: PORT });

const users: Map<string, WebSocket> = new Map();  // userId -> WebSocket
const rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds


const messageQueue = new Queue("chat-message", {
    connection: { host: REDIS_URL }
});

const checkAuthentication = (token: string) =>  {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if(!decoded || !decoded.userId) {
            console.error("Invalid token or userId not found in token");
            return null;
        }

        return decoded.userId;
    } catch (error) {
        console.error("Authentication error:", error);
        return null;
    }
};

wss.on("connection", (ws, req) => {
    const reqUrl = req.url;

    if(!reqUrl) {
        return;
    }

    const queryParams = new URLSearchParams(reqUrl.split('?')[1]);
    const jwtToken = queryParams.get("token") || "";

    const userId = checkAuthentication(jwtToken);
    
    if(!userId) {
        ws.close(1008, "Authentication failed");
        return;
    }

    if(users.has(userId)) {
        const existingWs = users.get(userId);

        // If the existing WebSocket is open, close it before replacing
        // with the new one. This prevents multiple connections for the same user.
        if(existingWs && existingWs.readyState === existingWs.OPEN) {
            existingWs.close(4000, "Session replaced");
        }
        users.delete(userId);
    }

    users.set(userId, ws as unknown as WebSocket);

    ws.on("message", async (data) => {
        let parsedData;

        if(typeof data !== "string") {
            parsedData = JSON.parse(data.toString()); // { type: "join-room", roomId: "room1" }
        } else {
            parsedData = JSON.parse(data);
        }

        if(parsedData.type == "join-room") {
            const { roomId } = parsedData;

            if(!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
            }
            
            const roomUsers = rooms.get(roomId);

            if(!roomUsers?.has(userId)) {
                roomUsers?.add(userId);
            }

        } else if(parsedData.type == "leave-room") {
            const { roomId } = parsedData;

            const roomUsers = rooms.get(roomId);
            if (!roomUsers) return; // room doesn't exist

            if(roomUsers.has(userId)) {
                roomUsers.delete(userId);

                // clear empty room
                if(roomUsers.size === 0) {
                    rooms.delete(roomId);
                }
            }
        } else if(parsedData.type == "send-data") {
            const { roomId, message } = parsedData;

            const roomUsers = rooms.get(roomId);
            if(!roomUsers) {
                return;
            }

            // brodcasting message immediately, creating message in db is pushed in queue to remove delay
            for(let roomUser of roomUsers) {
                const roomUserWs = users.get(roomUser);
                if(!roomUserWs) {
                    continue;
                }

                roomUserWs.send(JSON.stringify({
                    userId,
                    roomId,
                    message,
                    type: "message"
                }));
            }

            messageQueue.add(
                "saveMessage",
                { userId, roomId, message },
                // 5 retries before job fails
                // exponential -> delay increases with each retries (delay * 2^(attempt-1))
                { attempts: 5, backoff: { type: "exponential", delay: 1000 } } // base delay 1000ms = 1s
            )
        }
    })

    ws.on("close", () => {
        users.delete(userId);
        for(const [roomId, roomUsers] of rooms.entries()) {
            roomUsers.delete(userId);

            if(roomUsers.size === 0) {
                rooms.delete(roomId);
            }
        }
    })
});

console.log("Websocket server is running on port", PORT);