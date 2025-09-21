import jwt from "jsonwebtoken";

import type { Request, Response } from "express";
import statusCode from "../utils/status-codes";
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db";
import { createRoomSchema } from "@repo/common/types";

const createRoom = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.token;
        if(!token) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
                error: {
                    message: "No token provided"
                },
                data: null
            })
        }

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

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);

            if(typeof decoded === "string" || !decoded) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
                error: {
                    message: "Invalid token"
                },
                data: null
            })
        }
        } catch (error) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
                error: {
                    message: "Invalid token"
                },
                data: null
            })
        }

        const userId = decoded.userId;
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
        return res.status(statusCode.INTERNAL_ERROR).json({
            success: false,
            message: "some error occur in controller layer",
            error,
            data: null
        })
    }
}

export default {
    createRoom
}