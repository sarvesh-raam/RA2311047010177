"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = initLogger;
exports.Log = Log;
const axios_1 = __importDefault(require("axios"));
const API_BASE = 'http://20.207.122.201/evaluation-service';
let config = null;
let cachedToken = null;
let tokenExpiry = 0;
function initLogger(cfg) {
    config = cfg;
}
async function fetchToken() {
    if (!config)
        throw new Error('Logger not initialized. Call initLogger() first.');
    const res = await axios_1.default.post(`${API_BASE}/auth`, {
        email: config.email,
        name: config.name,
        rollNo: config.rollNo,
        accessCode: config.accessCode,
        clientID: config.clientID,
        clientSecret: config.clientSecret,
    });
    cachedToken = res.data.access_token;
    tokenExpiry = res.data.expires_in;
    return cachedToken;
}
async function getToken() {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!cachedToken || nowSeconds >= tokenExpiry - 60) {
        await fetchToken();
    }
    return cachedToken;
}
async function Log(stack, level, pkg, message) {
    try {
        const token = await getToken();
        await axios_1.default.post(`${API_BASE}/logs`, { stack, level, package: pkg, message }, { headers: { Authorization: `Bearer ${token}` } });
    }
    catch (err) {
        // TODO: retry logic
    }
}
