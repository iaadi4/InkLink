import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.email(),
    password: z.string().min(6).max(100)
})

export const loginUserSchema = z.object({
    email: z.email(),
    password: z.string().min(6).max(100)
})

export const createRoomSchema = z.object({
    name: z.string().min(3).max(100),
})