import type { Request, Response } from "express";
import statusCode from "../utils/status-codes";

import prisma from "@repo/db";
import { createRoomSchema } from "@repo/common/types";

const createRoom = async (req: Request, res: Response) => {
    try {
        const validation = createRoomSchema.safeParse(req.body);

        if(!validation.success) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: "Invalid input",
                error: {
                    message: "Invalid input",
                    details: validation.error
                },
                data: null
            })
        }

        const userId = req.user?.id;

        if (!userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
                error: {
                    message: "User not found in request"
                },
                data: null,
            });
        }

        const { name } = validation.data;

        const data = await prisma.room.create({
            data: {
                name,
                userId
            }
        })

        return res.status(statusCode.CREATED).json({
            success: true,
            message: "Room created successfully",
            error: null,
            data
        })

    } catch (error) {
        console.error(error);
        return res.status(statusCode.INTERNAL_ERROR).json({
            success: false,
            message: "some error occur in controller layer",
            error,
            data: null
        })
    }
}

export {
    createRoom
}