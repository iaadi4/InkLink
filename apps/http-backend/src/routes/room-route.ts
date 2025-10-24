import { Router } from "express";
import { createRoom, getUserRooms } from "../controllers/room-controller";

const router: Router = Router();

router.post('/', createRoom);
router.get('/', getUserRooms)

export default router;