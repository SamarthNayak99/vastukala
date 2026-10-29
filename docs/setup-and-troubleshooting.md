# Setup and troubleshooting

## Supported baseline

The verified environment is Windows with Node.js 22.12+ and npm. Use `npm ci` to reproduce the lockfile. Embedded PostgreSQL uses a platform-specific native runtime; other platforms need their own verification, or an external PostgreSQL instance via `DATABASE_URL`.

## First checkout

1. Clone the private repository using your GitHub account.
2. Run `npm ci`.
3. Run `npm run media:fetch` to download/prepare the credited catalogue photographs. It can take time and requires Internet access. Respect rate-limit retry times.
4. Run `npm run dev`. Startup runs migrations, imports missing records and creates the initial administrator.
5. Open `http://127.0.0.1:5173`. Read generated local credentials from `.local/admin-credentials.txt` privately.

Do not commit `.local`, `.env`, downloaded media or database snapshots. An admin edit changes the local database, not the committed research seeds. To transfer such edits, use a private database backup separately; keep password hashes and secrets out of Git.

## Common issues

| Symptom | Check |
| --- | --- |
| Database connection refused | Start `npm run dev` or `npm run db:local` before standalone database/test commands. |
| Port already in use | Check which project process owns 5173, 3001 or 55432. Reuse the intended running instance; do not delete the database directory. |
| Missing photographs / prepared-image error | Complete `npm run media:fetch`, then rerun seed/startup. Check the ignored `media/display` folder. |
| Wikimedia HTTP 429 | Let the script honour Retry-After and resume completed downloads. |
| Empty map tiles | Basemap tiles need Internet access. Record links and filters still work locally. |
| No event history | Research coverage is incomplete; use the original history/date references. |
| Administrator sign-in fails | Check the generated local credential file. Startup preserves existing accounts. |
| CSRF/session error | Refresh the admin page and sign in again if needed. |
| Isolated tests cannot create a database | Use a local PostgreSQL role with create-database permission or set `TEST_DATABASE_BASE_URL`. |
| Database recovery problem | Preserve the data directory and back up readable data; inspect PostgreSQL logs. Do not treat forced termination/reset as routine troubleshooting. |

## Build, tests and backups

- `npm run build`: compiles the frontend into ignored `client/dist`.
- `npm test`: uses an isolated temporary database and removes that test database afterward. Requires running PostgreSQL and prepared media.
- `npm run db:backup -- --verify`: writes a private logical snapshot and verifies an isolated restore. Photo files need a separate backup.
- `npm start`: serves the compiled application through Express on port 3001 with PostgreSQL already running.

For a separately hosted database, configure `.env` from `.env.example`; use a random session secret and private administrator password. Hosted deployment, TLS, persistent media storage, service management and production backup policy are not included in v1.
