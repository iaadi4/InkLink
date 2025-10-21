import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db";

const PORT = parseInt(process.env.PORT as string) || 8080;

const wss = new WebSocketServer({ port: PORT });

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

    ws.on("close", () => {
        console.log("Client disconnected!");
    })
});

console.log("Websocket server is running on port", PORT);