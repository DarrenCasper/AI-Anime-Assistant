import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import { searchAnime } from "../services/jikanService.js";
import { generateAnimeResponse } from "../services/LLMService.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const userMessage = await ChatMessage.create({
            role: "user",
            content: message
        });

        const animeResults = await searchAnime(message);

        const recentMessages = await ChatMessage.find()
            .sort({ createdAt: -1 })
            .limit(10);

        const chatHistory = recentMessages
            .reverse()
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n");

        const assistantText = await generateAnimeResponse(message, animeResults, chatHistory);

        const assistantMessage = await ChatMessage.create({
            role: "assistant",
            content: assistantText,
            source: "jikan"
        });

        res.json({
            userMessage,
            assistantMessage,
            results: animeResults
        });
    } catch (error) {
        res.status(500).json({
            error: error.message || "Server error"
        });
    }
});

router.get("/", async (req, res) => {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json(messages);
});

export default router;