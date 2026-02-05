"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const jwtMiddleware_1 = require("./middleware/jwtMiddleware");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Global auth middleware: skip public auth endpoints under /api/auth and health endpoints
app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth') ||
        req.path === '/health' ||
        req.path === '/keepalive' ||
        req.path === '/api/db-status' ||
        req.path === '/api')
        return next();
    return (0, jwtMiddleware_1.requireAuth)(req, res, next);
});
exports.default = app;
//# sourceMappingURL=app.js.map