import argon2 from "argon2";
import jwt from "jsonwebtoken";

import type { Request, Response } from "express";
import statusCode from "../utils/status-codes";
import prisma from "@repo/db";
import { JWT_SECRET } from "@repo/backend-common/config";

const signup = async(req: Request, res: Response) => {
    try {
        let hashedPassword: string;
        const {name, email, password} = req.body;

        if(!name || !email || !password) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: "false",
                message: "missing input fields",
                error: {
                    message: "Required field missing"
                },
                data: {}
            })
        }

        try {
            hashedPassword = await argon2.hash(password);
        } catch (error) {
            return res.status(statusCode.INTERNAL_ERROR).json({
                success: "false",
                message: "failed to hash password",
                error: error,
                data: {}
            })
        }

        const data = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        })

        return res.status(statusCode.SUCCESS).json({
            success: "true",
            message: "user created successfully",
            error: {},
            data
        })

    } catch (error) {
        return res.status(statusCode.INTERNAL_ERROR).json({
            success: "false",
            message: "some error occur in controller layer",
            error: error,
            data: {}
        })
    }
}

const login = async(req: Request, res: Response) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: "false",
                message: "missing input fields",
                error: {
                    message: "Required field missing"
                },
                data: {}
            })
        }

        const data = await prisma.user.findFirst({
            where: {
                email
            }
        })

        if(!data) {
            return res.status(statusCode.NOT_FOUND).json({
                success: "false",
                message: "user not found",
                error: {
                    message: "user does not exist"
                },
                data: {}
            })
        }

        const isPasswordCorrect = await argon2.verify(data.password, password);

        if(!isPasswordCorrect) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: "false",
                message: "incorrect password",
                error: {
                    message: "incorrect password"
                },
                data: {}
            })
        }

        const token = jwt.sign(
            {id: data.id, email: data.email},
            JWT_SECRET,
            {expiresIn: '7d'} // 7 days
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        })

        return res.status(statusCode.SUCCESS).json({
            success: "true",
            message: "user logged in successfully",
            error: {},
            data
        })


    } catch (error) {
        return res.status(statusCode.INTERNAL_ERROR).json({
            success: "false",
            message: "some error occur in controller layer",
            error: error,
            data: {}
        })
    }
}

export {
    signup,
    login
}