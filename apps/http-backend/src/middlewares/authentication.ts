import jwt from "jsonwebtoken";

import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import statusCode from "../utils/status-codes";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    
    if (!token) {
        return res.status(statusCode.UNAUTHORIZED).json({
            success: false,
            message: "Unauthorized",
            error: {
                message: "No token provided"
            },
            data: null,
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string" || !decoded) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
                error: {
                    message: "Invalid token"
                },
                data: null,
            });
        }

        req.user = decoded as { userId: string };
        next();
    } catch (error) {
        return res.status(statusCode.UNAUTHORIZED).json({
            success: false,
            message: "Unauthorized",
            error: {
                message: "Invalid token"
            },
            data: null,
        });
    }
};

export default authMiddleware;
