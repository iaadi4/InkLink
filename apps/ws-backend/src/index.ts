import { WebSocketServer } from "ws";

const PORT = parseInt(process.env.PORT as string) || 8080;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
    console.log("Client connected!");

    ws.on("close", () => {
        console.log("Client disconnected!");
    })
})

console.log("Websocket server is runnning on port", PORT);