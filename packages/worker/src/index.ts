import { Worker } from "bullmq"; 
import { REDIS_URL } from "@repo/backend-common/config";
import prisma from "@repo/db";

const worker = new Worker(
    "chat-message",
    async job => {
        const { userId, roomId, message } = job.data;
        
        await prisma.chat.create({
            data: {
                userId,
                roomId, 
                content: message
            }
        })
    },
    { connection: { host: REDIS_URL }}
);

worker.on("completed", job => console.log(`Message saved ${job.id}`));
worker.on("failed", (job, err) => console.log(`Job failed ${err}`));