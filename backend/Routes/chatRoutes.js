import express from "express"
import { searchAnime } from "../Services/JikanService.js"

const router = express.Router()

router.post("/", async (req, res) => {
    try{
        const { message } = req.body

        if(!message){
            return res.status(400).json({ error: "Message is required" })
        }

        const animeResults = await searchAnime(message)

        res.json({
            userMessage: message,
            reply: "Here are some anime results I found:",
            results: animeResults
        })
    }
    catch(err){
        res.status(500).json({ error: error.message})
    }
})

export default router