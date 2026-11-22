import { handleRequest } from './http.js';

export default {
  fetch(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || undefined;
    return handleRequest(request, asset => env.ASSETS.fetch(asset), env.DB, ip);
  },
};
