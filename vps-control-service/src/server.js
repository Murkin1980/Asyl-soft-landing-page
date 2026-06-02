import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createConfig } from './config.js';
import { createRouter } from './http.js';
import { getAllServiceStatuses, reloadWebserver } from './services.js';
import { handleDeploy } from './deploy.js';
import { readAuditLogs, appendAuditLog } from './logs.js';
import { validateWebserver, validateLimit } from './validation.js';

function registerRoutes(router) {
  router.get('/health', async ({ config, sendJson, res }) => {
    sendJson(res, 200, {
      success: true,
      data: {
        service: 'furniture-vps-control',
        status: 'ok',
        version: '0.1.0',
        uptimeSec: Math.floor(process.uptime()),
        webserver: config.webserver,
        time: new Date().toISOString(),
      },
    });
  });

  router.get('/services', async ({ config, sendJson, res }) => {
    const services = await getAllServiceStatuses();
    sendJson(res, 200, {
      success: true,
      data: { services },
    });
  });

  router.post('/reload/webserver', async ({ body, config, sendJson, res }) => {
    const webserver = body?.webserver;
    const validation = validateWebserver(webserver);

    if (!validation.valid) {
      sendJson(res, 400, {
        success: false,
        error: 'validation_error',
        message: validation.error,
        fields: ['webserver'],
      });
      return;
    }

    const result = await reloadWebserver(webserver);

    try {
      appendAuditLog(config.logDir, {
        time: new Date().toISOString(),
        event: 'reload_webserver',
        webserver,
        status: result.success ? 'success' : 'failure',
        source: 'cloudflare-admin-proxy',
      });
    } catch {
      // non-fatal
    }

    if (!result.success) {
      sendJson(res, 500, {
        success: false,
        error: 'reload_failed',
        message: result.error,
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      data: { webserver, reloaded: true },
    });
  });

  router.post('/deploy/site', async ({ body, config, sendJson, res }) => {
    const payload = body || {};
    const result = handleDeploy(config, payload);
    sendJson(res, result.status, result.body);
  });

  router.get('/deploy/logs', async ({ query, config, sendJson, res }) => {
    const siteSlug = (query.siteSlug || '').trim();
    const limitValidation = validateLimit(query.limit);

    if (!limitValidation.valid) {
      sendJson(res, 400, {
        success: false,
        error: 'validation_error',
        message: limitValidation.error,
        fields: ['limit'],
      });
      return;
    }

    const logs = readAuditLogs(config.logDir, siteSlug, limitValidation.value);

    sendJson(res, 200, {
      success: true,
      data: { logs },
    });
  });
}

export function createApp(customConfig) {
  const config = customConfig || createConfig();
  const router = createRouter();

  registerRoutes(router);

  const server = createServer(async (req, res) => {
    await router.handle(req, res, config);
  });

  function shutdown(signal) {
    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
      setTimeout(() => { resolve(); }, 5000).unref();
    });
  }

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  return { server, config };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server, config } = createApp();
  server.listen(config.port, config.host, () => {
    console.log(`VPS control service listening on ${config.host}:${config.port}`);
    console.log(`Webserver: ${config.webserver}`);
    console.log(`Log directory: ${config.logDir}`);
  });
}
