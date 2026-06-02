import { URL } from 'node:url';
import { checkAuth } from './auth.js';

const MAX_BODY_SIZE = 65536;

export function createRouter() {
  const routes = [];

  function add(method, pathname, handler) {
    routes.push({ method: method.toUpperCase(), pathname, handler });
  }

  async function parseBody(req) {
    return new Promise((resolve, reject) => {
      let raw = '';
      let size = 0;

      req.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_BODY_SIZE) {
          req.destroy();
          reject(new Error('payload too large'));
          return;
        }
        raw += chunk;
      });

      req.on('end', () => {
        if (!raw) return resolve(null);
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('invalid json')); }
      });

      req.on('error', () => resolve(null));
    });
  }

  function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data) + '\n';
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  }

  async function handle(req, res, config) {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url, `http://${host}`);
    const method = req.method.toUpperCase();
    const pathname = url.pathname;

    const query = {};
    for (const [k, v] of url.searchParams) query[k] = v;

    for (const route of routes) {
      if (route.method === method && route.pathname === pathname) {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
        const { authorized } = checkAuth(authHeader, config);
        if (!authorized) {
          sendJson(res, 401, {
            success: false,
            error: 'unauthorized',
            message: 'Authorization token is invalid or missing.',
          });
          return;
        }

        let body = null;
        try {
          body = await parseBody(req);
        } catch (err) {
          const msg = err.message === 'invalid json'
            ? makeError('invalid_json', 'Request body is not valid JSON.')
            : makeError('payload_too_large', 'Request body exceeds 64KB limit.');
          sendJson(res, err.message === 'invalid json' ? 400 : 413, msg);
          return;
        }

        try {
          await route.handler({ req, res, body, query, config, sendJson });
        } catch (err) {
          sendJson(res, 500, makeError('internal_error', 'An internal error occurred.'));
        }
        return;
      }
    }

    sendJson(res, 404, makeError('not_found', 'Endpoint not found.'));
  }

  return {
    get(pathname, handler) { add('GET', pathname, handler); },
    post(pathname, handler) { add('POST', pathname, handler); },
    handle,
    sendJson,
  };
}

export function makeError(error, message, fields) {
  const result = { success: false, error, message };
  if (fields) result.fields = fields;
  return result;
}
