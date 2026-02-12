/**
 * MCP Streamable HTTP Route Handler
 * 
 * Integrates MCP server with Express via Streamable HTTP transport
 * Endpoint: POST /mcp (for MCP messages)
 *           GET  /mcp (for SSE stream from server)
 *           DELETE /mcp (to close session)
 */

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import mcpServer from '../mcp.js';
import express from 'express';

const router = express.Router();

// Store active transports by session ID
const transports = new Map();

// POST /mcp — handle MCP messages (initialize, tool calls, etc.)
router.post('/', async (req, res) => {
    try {
        // Check for existing session
        const sessionId = req.headers['mcp-session-id'];
        let transport;

        if (sessionId && transports.has(sessionId)) {
            // Reuse existing transport
            transport = transports.get(sessionId);
        } else if (!sessionId && isInitializeRequest(req.body)) {
            // New session — create transport
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => crypto.randomUUID(),
                onsessioninitialized: (sid) => {
                    transports.set(sid, transport);
                    console.log(`[MCP] Session created: ${sid}`);
                },
            });

            transport.onclose = () => {
                const sid = [...transports.entries()].find(([, t]) => t === transport)?.[0];
                if (sid) {
                    transports.delete(sid);
                    console.log(`[MCP] Session closed: ${sid}`);
                }
            };

            // Connect MCP server to this transport
            await mcpServer.connect(transport);
        } else {
            // Invalid request
            res.status(400).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: 'Bad Request: No valid session or initialize request' },
                id: null,
            });
            return;
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('[MCP] Error handling request:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: error.message },
            id: null,
        });
    }
});

// GET /mcp — SSE stream for server-to-client notifications
router.get('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];

    if (!sessionId || !transports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing session ID' });
        return;
    }

    const transport = transports.get(sessionId);
    await transport.handleRequest(req, res);
});

// DELETE /mcp — close session
router.delete('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];

    if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId);
        await transport.close();
        transports.delete(sessionId);
        res.json({ message: 'Session closed' });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

export default router;
