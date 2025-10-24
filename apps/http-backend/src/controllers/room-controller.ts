import type { Request, Response } from "express";
import statusCode from "../utils/status-codes";

import prisma from "@repo/db";
import { createRoomSchema } from "@repo/common/types";

import { roomCost } from "../config";

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

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if(!user) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
                error: {
                    message: "User not found"
                },
                data: null,
            });
        }   

        const userBalance = user.token || 0;

        if(userBalance < roomCost) {
            return res.status(statusCode.PAYMENT_REQUIRED).json({
                success: false,
                message: "Insufficient balance to create room",
                error: {
                    message: `You need at least ${roomCost} tokens to create a room`
                },
                data: null,
            });
        }

        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                token: userBalance - roomCost
            }
        });

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

const getUserRooms = async (req: Request, res: Response) => {
    try {
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

        // fetch last 3 rooms created by user
        const data = await prisma.room.findMany({
            take: 3,
            where: {
                userId
            },
            orderBy: {
                createdAt: "asc"
            }
        })

        return res.status(statusCode.SUCCESS).json({
            success: true,
            message: "Rooms fetched successfully",
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
    createRoom,
    getUserRooms
}