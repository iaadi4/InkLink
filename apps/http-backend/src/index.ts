import express from "express";
import authRoute from "./routes/auth-route";
import roomRoute from "./routes/room-route";
import authMiddleware from "./middlewares/authentication";
import cookieParser from "cookie-parser";
import cors from "cors";
import client from "prom-client";
import { prometheusMiddleware } from "./middlewares/prometheus";

import { port, corsOrigin } from "./config";

const app = express();

app.use(cors({
    origin: corsOrigin,
    credentials: true,
}));

app.use(prometheusMiddleware);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/auth', authRoute);

app.use(authMiddleware);
app.use('/room', roomRoute);

app.use('/metrics', async (req, res) => {
    const metrics = await client.register.metrics();
    res.set("Content-Type", client.register.contentType);
    res.end(metrics);
})

export async function startServer() {
    app.listen(port);
};