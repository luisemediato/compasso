import { handleRequest } from './http.js';

export default {
  fetch(request, env) {
    return handleRequest(request, asset => env.ASSETS.fetch(asset), env.DB);
  },
};
