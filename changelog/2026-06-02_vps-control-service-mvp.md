# Stage 4.03B — VPS Control Service MVP

Дата: 2026-06-02

## Создано

`vps-control-service/` — лёгкий Ubuntu-side Node.js сервис для безопасного управления VPS.

### Структура

```
vps-control-service/
  README.md
  package.json
  src/
    server.js    — entry point, роутинг, graceful shutdown (SIGTERM/SIGINT)
    config.js    — createConfig() + строгая env validation (port, webserver, dirs, hosts, token)
    auth.js      — Bearer token проверка
    http.js      — HTTP роутер, auth до body, body size limit 64KB, 400 invalid_json
    services.js  — systemctl через sudo + allowlist (/bin/systemctl)
    deploy.js    — deploy handler (dry-run default, real deploy = 501)
    logs.js      — audit.jsonl (JSONL operational audit log)
    validation.js — siteSlug, sourceUrl, webserver, limit
  scripts/
    install-systemd.sh
    smoke-test.sh
  systemd/
    furniture-vps-control.service
  examples/
    furniture-vps-control.env.example
  tests/
    vps-control.test.js  — 18 тестов, все pass
```

### Endpoints

- `GET /health` — статус, версия, uptime
- `GET /services` — systemctl статусы (nginx, caddy, furniture-vps-control)
- `POST /reload/webserver` — reload nginx/caddy через systemctl
- `POST /deploy/site` — dry-run по умолчанию, real deploy = 501
- `GET /deploy/logs?siteSlug=&limit=` — audit.jsonl, bounded limit 1-200

### Security

- Bearer token на всех endpoints, проверка до чтения body
- Body size limit 64 KB
- No exec/eval, только execFile с allowlist
- sudo для systemctl с полными путями
- Path traversal protection
- Strict env validation
- Graceful shutdown

### Исправлено после code review (3 P1)

1. Path mismatch install-systemd.sh ↔ systemd unit (пути приведены к `/opt/furniture-control`)
2. Reload под non-root (добавлен sudo + /bin/systemctl полные пути)
3. Auth до body + body size limit (64KB, 413 payload_too_large)

### Исправлено после аудита (4 high-priority)

1. Stricter env validation (port, webserver, dirs, hosts, token length)
2. 400 invalid_json для битого JSON (вместо null)
3. Graceful shutdown (SIGTERM/SIGINT)
4. audit.jsonl вместо deploy.jsonl (операционные логи, не только deploy)
