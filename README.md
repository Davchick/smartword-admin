# SmartWord Admin

Web admin panel for SmartWord operations and moderation.

## Features

- Overview metrics: users, active premium, words, groups, payments, revenue (30d).
- User management: search, inspect profile, grant subscription, reset weekly learning limit.
- Payments monitoring: recent YooKassa payments.
- Consent monitoring: recent consent logs (152-FZ compliance visibility).
- Hard auth boundary: every request uses `x-admin-token` + required `x-admin-email` allowlist.

## Server setup

In `server/.env.development` or `server/.env` configure:

```env
ADMIN_API_TOKEN=your_strong_random_token
ADMIN_EMAILS=admin@localhost
ADMIN_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Frontend setup

In `admin/.env` (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
```

Run:

```bash
cd admin
npm install
npm run dev
```

Open `http://localhost:5173`.

## Security notes for local-only admin

- Do not store real production secrets in `.env.development`.
- Rotate `ADMIN_API_TOKEN` if it was ever shared in plain text.
- Keep admin frontend origin on localhost only via `ADMIN_CORS_ORIGINS`.
