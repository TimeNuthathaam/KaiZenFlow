/**
 * API Key Authentication Middleware
 * 
 * - Requests from localhost (frontend via nginx) → pass through
 * - External requests → require X-API-Key header
 */

export function apiKeyAuth(req, res, next) {
    const apiKey = process.env.API_KEY;

    // If no API_KEY configured, skip auth (dev mode)
    if (!apiKey) {
        return next();
    }

    // Allow requests from localhost (nginx proxy inside same container)
    const remoteIp = req.ip || req.connection.remoteAddress || '';
    const isLocalhost = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';

    if (isLocalhost) {
        return next();
    }

    // Check API key
    const providedKey = req.headers['x-api-key'];

    if (!providedKey) {
        return res.status(401).json({
            error: 'API key required',
            message: 'ต้องใส่ X-API-Key header สำหรับ external access',
        });
    }

    if (providedKey !== apiKey) {
        return res.status(403).json({
            error: 'Invalid API key',
            message: 'API key ไม่ถูกต้อง',
        });
    }

    next();
}

export default apiKeyAuth;
