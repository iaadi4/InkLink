const httpServerUrl = process.env.BACKEND_URL || 'http://localhost:5000';
const wsServerUrl = process.env.WS_SERVER_URL || 'ws://localhost:8000';

export {
    httpServerUrl,
    wsServerUrl
}