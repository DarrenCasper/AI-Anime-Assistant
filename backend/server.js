import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import chatRoutes from "./Routes/chatRoutes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.json({
        message: "AI Anime Chat backend is running!"
    })
})

app.use("/api/chat", chatRoutes)

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})