import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db";

const PORT = parseInt(process.env.PORT as string) || 8080;

const wss = new WebSocketServer({ port: PORT });

const users: Map<string, WebSocket> = new Map();  // userId -> WebSocket
const rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

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
        }
    })

    ws.on("close", () => {
        console.log("Client disconnected!");
    })
});

console.log("Websocket server is running on port", PORT);