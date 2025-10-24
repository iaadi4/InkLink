export const port = process.env.PORT || 5000;
export const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
export const roomCost = Number(process.env.ROOM_COST) || 0;

export const config = {
  port,
  corsOrigin,
  roomCost
}