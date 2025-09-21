import express from "express";
import authRoute from "./routes/auth-route";

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({ message: "Hello, World!" });
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', authRoute);

export async function startServer() {
    app.listen(PORT);
}