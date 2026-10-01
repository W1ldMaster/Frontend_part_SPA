# SPA Frontend — React + Vite

SPA для социальной сети (посты, комментарии, профили, подписки). Собирается через Vite в статику, раздаётся через nginx, который также проксирует запросы `/api/` на backend.

## 🧱 Стек

| Компонент | Версия |
|---|---|
| Node.js | 20 (alpine) |
| React | 19.2.8 |
| React DOM | 19.2.8 |
| React Router DOM | 7.18.4 |
| Axios | 1.20.0 |
| Vite | 8.3.0 |
| @vitejs/plugin-react | 6.1.1 |
| oxlint | 1.81.0 |
| nginx | 1.27-alpine |

## 🏗 Архитектура

```
Browser → nginx (в контейнере frontend)
         ├── /              → статика SPA (index.html, JS, CSS)
         └── /api/*         → proxy → ssa_backend:8000 → PostgreSQL
```

Frontend общается с backend через **относительные** пути (`/api/posts/`, `/api/users/me`). nginx сам отрезает префикс `/api` и проксирует запрос на backend.

## 📁 Структура проекта

```
React/
├── src/
│   ├── api/           # HTTP-клиент (axios), запросы к backend
│   ├── components/    # Переиспользуемые UI-компоненты
│   ├── context/       # React Context (auth, тема и т.д.)
│   ├── pages/         # Страницы (компоненты-экраны)
│   ├── styles/        # Глобальные стили / CSS
│   ├── App.jsx        # Корневой компонент
│   └── main.jsx       # Точка входа
├── public/            # Статика (favicon, иконки)
├── index.html
├── package.json
├── vite.config.js
├── nginx.conf
├── Dockerfile
├── docker-compose.yml
└── .env               # VITE_API_URL
```

## ⚙️ Переменные окружения

`.env` (по образцу `.envexample`):

```env
VITE_API_URL=/api
```

- **`VITE_API_URL`** — базовый URL для запросов к backend.
- Значение по умолчанию — `/api` (относительный путь, чтобы работал nginx-проксирование).
- ⚠️ Vite подставляет переменные **на этапе сборки** (`import.meta.env.VITE_API_URL`). Чтобы изменить — нужно **пересобрать образ**.

## 🚀 Быстрый старт (Docker)

### 1. Убедитесь, что существует общая сеть

Frontend и backend должны быть в одной сети `ssa_net`:

```bash
docker network create ssa_net
```

### 2. Убедитесь, что backend запущен

nginx проксирует `/api/` на `http://ssa_backend:8000`. Если backend не поднят — `/api/*` вернёт `502 Bad Gateway`.

```bash
cd ../Backend/FastApiProject
docker compose up -d
```

### 3. Соберите и запустите frontend

```bash
docker compose up -d --build
```

### 4. Откройте в браузере

```
http://127.0.0.1:8080/
```

> ⚠️ **На Windows используйте `127.0.0.1`, а не `localhost`.** Docker Desktop резолвит `localhost` в IPv6 (`::1`), а проброс портов часто работает только по IPv4. Отсюда `Connection reset` или `Connection refused`.

## 🛠 Локальная разработка

### 1. Требования

- **Node.js 20+** (можно поставить через nvm)
- Backend, запущенный на `http://127.0.0.1:8000` (или в Docker)

### 2. Установка зависимостей

```bash
npm ci
```

`npm ci` использует `package-lock.json` — точные версии, воспроизводимая установка.

### 3. Запуск dev-сервера

```bash
npm run dev
```

Vite поднимет сервер на `http://127.0.0.1:5173` (по умолчанию).

### 4. Проксирование API в dev-режиме

Чтобы фронт мог обращаться к `/api/*` на том же порту, что и dev-сервер, добавьте в `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

Тогда запрос `/api/posts/` из браузера пойдёт на `http://127.0.0.1:8000/posts/`.

## 📦 Сборка

```bash
npm run build
```

Готовые файлы появятся в `dist/`. Их раздаёт nginx в production-образе.

### Прочие скрипты

```bash
npm run lint      # oxlint — быстрый линтер
npm run preview   # локальный просмотр собранной версии
```

## 🐳 Docker

### Dockerfile

**Multi-stage build:**

- **Stage 1 (`build`) — `node:20-alpine`**
  1. Копирует `package.json` и `package-lock.json`.
  2. Ставит зависимости через `npm ci`.
  3. Копирует исходники.
  4. Собирает `npm run build`.
  5. `ARG VITE_API_URL=/api` → прокидывается в `import.meta.env` на этапе сборки.

- **Stage 2 — `nginx:1.27-alpine`**
  1. Копирует `nginx.conf` в `/etc/nginx/conf.d/default.conf`.
  2. Копирует `dist/` из build-стейджа в `/usr/share/nginx/html`.
  3. Слушает 80-й порт.

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: /api
    container_name: ssa_frontend
    ports:
      - "8080:80"
    restart: unless-stopped
    networks:
      - ssa_net

networks:
  ssa_net:
    external: true
    name: ssa_net
```

- Порт **8080 на хосте** → 80 в контейнере.
- Сеть `ssa_net` — **external**, создаётся вручную один раз.
- Healthcheck отключён в compose (`disable: true`), но может быть добавлен через `wget`.

### nginx.conf

Ключевые блоки конфигурации:

**1. Статика с кешем:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
    try_files $uri =404;
}
```
Все ассеты хешированы Vite'ом, поэтому кеш на год безопасен.

**2. Проксирование API:**
```nginx
location /api/ {
    resolver 127.0.0.11 valid=10s;
    set $backend_upstream http://ssa_backend:8000;
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass $backend_upstream;
    ...
}
```
- `resolver 127.0.0.11` — встроенный Docker DNS. **Без него nginx упадёт при старте**, если backend ещё не поднят.
- `rewrite ^/api/(.*)$ /$1 break` — **обязателен** при использовании переменной в `proxy_pass`. Без него `proxy_pass $backend_upstream` не отрезает `/api` автоматически, и backend получает `/api/posts/` вместо `/posts/`.

**3. SPA-fallback:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
Позволяет F5 на `/posts/123` — иначе nginx вернёт 404.

## 🔌 Интеграция с backend

### Как работают запросы

Frontend использует **axios** (`src/api/`). Пример клиента:

```js
// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

Все запросы идут на `/api/...`:

```js
// src/api/posts.js
import api from './client';

export const getPosts = (params) => api.get('/posts/', { params });
export const createPost = (data) => api.post('/posts/', data);
export const deletePost = (id) => api.delete(`/posts/${id}/`);
```

### Авторизация

- Логин: `POST /api/auth/jwt/login` (form-data: `username`, `password`)
- В ответ приходит `{ access_token, token_type }`
- Токен сохраняется в `localStorage`
- Ко всем защищённым запросам прикрепляется заголовок `Authorization: Bearer <token>`
- При `401` фронт должен разлогинить пользователя (интерцептор ответа)

### Схема запроса

```
Browser → axios → /api/posts/
         ↓
   nginx (frontend:8080)
         ↓ rewrite ^/api/(.*)$ /$1
   http://ssa_backend:8000/posts/
         ↓
   FastAPI → PostgreSQL
```

## 🐛 Troubleshooting

**`502 Bad Gateway` на `/api/...`**

Backend не запущен или в другой сети. Проверьте:

```bash
docker compose ps                           # backend должен быть Up
docker exec ssa_frontend wget -qO- http://ssa_backend:8000/posts/
```

Если вторая команда падает — frontend не видит backend. Убедитесь, что оба в `ssa_net`.

**`404` на `/api/...`**

`proxy_pass` не отрезает `/api`. Убедитесь, что в `nginx.conf` есть строка:

```nginx
rewrite ^/api/(.*)$ /$1 break;
```

**`Connection reset` при заходе на `localhost:8080`**

На Windows `localhost` резолвится в IPv6. Docker Desktop пробрасывает только IPv4. Используйте **`127.0.0.1:8080`**.

**`Connection reset` на `127.0.0.1:8080`**

Порт 8080 занят другим процессом (часто — локальный Postgres или IIS). Проверьте:

```powershell
netstat -ano | Select-String ":8080"
Get-Process -Id <PID>
```

Либо смените маппинг в compose на `8085:80` и открывайте `http://127.0.0.1:8085/`.

**Пустая страница после сборки**

Проверьте, что `npm run build` завершился без ошибок и `dist/index.html` существует:

```bash
docker exec ssa_frontend ls -la /usr/share/nginx/html
```

**SPA-роутинг ломается (F5 на `/posts/123` → 404)**

В `location /` должно быть:

```nginx
try_files $uri $uri/ /index.html;
```

**`nginx: [emerg] host not found in upstream "ssa_backend"`**

В `nginx.conf` отсутствует `resolver 127.0.0.11`, и nginx пытается резолвить имя при старте. Добавьте `resolver` + `set $backend_upstream`.

**Изменения в `nginx.conf` не применяются**

`nginx.conf` копируется в образ на этапе сборки. Нужна пересборка:

```bash
docker compose build --no-cache frontend
docker compose up -d --force-recreate frontend
```

## 📌 Полезные команды

```bash
# Логи frontend
docker compose logs -f frontend

# Войти в контейнер
docker exec -it ssa_frontend sh

# Проверить конфиг nginx
docker exec ssa_frontend nginx -t

# Пересобрать фронт без кеша
docker compose build --no-cache frontend

# Перезапустить
docker compose up -d --force-recreate frontend

# Проверить, что фронт отдаёт HTML
curl.exe -4 http://127.0.0.1:8080/

# Проверить проксирование API
curl.exe -4 http://127.0.0.1:8080/api/posts/
```

## 🔗 Связанные сервисы

- **Backend API:** `http://127.0.0.1:8000` (Swagger: `/docs`)
- **Backend репозиторий:** [Ссылка на репозиторий](https://github.com/W1ldMaster/Backend_Part_SPA)
- **PostgreSQL:** контейнер `ssa_db`, порт 5432
- **Общая Docker-сеть:** `ssa_net` (external)
