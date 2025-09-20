import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({ message: "Hello, World!" });
})

export async function startServer() {
    app.listen(PORT);
}