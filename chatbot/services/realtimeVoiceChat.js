/**
 * Realtime Voice Chat Service using OpenAI Realtime API
 * Provides speech-to-speech interaction with WebRTC
 */

import express from 'express';
import tools from '../agent/tools.js';
import { executeToolCall } from '../agent/toolExecutor.js';

const router = express.Router();

// Convert tools format for OpenAI Realtime API
// The Realtime API expects: { type: "function", name: "...", description: "...", parameters: {...} }
// Our tools have: { type: "function", function: { name: "...", description: "...", parameters: {...} } }
const realtimeTools = tools.map(tool => {
    if (tool.function) {
        return {
            type: tool.type,
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
        };
    }
    return tool;
});

// Session configuration for OpenAI Realtime API
// Supported voices for Realtime API: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
const realtimeVoice = process.env.REALTIME_VOICE || "alloy";
const sessionConfig = JSON.stringify({
    type: "realtime",
    model: "gpt-realtime",
    audio: {
        output: { voice: realtimeVoice }
    },
    instructions: "You are a helpful AI assistant for task management. You can help users with projects, tasks, team members, and analytics. Be conversational and friendly. IMPORTANT: Always speak in English. Never respond in any other language. When you receive task management data, summarize it clearly and concisely.",
    tools: realtimeTools
});

// Endpoint to create a Realtime API session
router.post("/session", async (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const fd = new FormData();
    fd.set("sdp", req.body);
    fd.set("session", sessionConfig);

    try {
        console.log("🎙️  Creating new Realtime API session with", realtimeTools.length, "tools (voice:", realtimeVoice + ")...");
        const r = await fetch("https://api.openai.com/v1/realtime/calls", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: fd,
        });

        if (!r.ok) {
            const errorText = await r.text();
            console.error("OpenAI API error:", r.status, errorText);
            return res.status(r.status).send(errorText);
        }

        // Send back the SDP we received from the OpenAI REST API
        const sdp = await r.text();
        console.log("✅ Realtime session created successfully");
        res.send(sdp);
    } catch (error) {
        console.error("Session creation error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

// Endpoint to execute tool calls from the client
router.post("/execute-tool", async (req, res) => {
    try {
        const { functionCall } = req.body;
        console.log("🔧 Executing realtime tool call:", functionCall.name);

        // executeToolCall expects { function: { name, arguments } }
        const result = await executeToolCall({ function: functionCall });

        res.json(result);
    } catch (error) {
        console.error("Tool execution error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
