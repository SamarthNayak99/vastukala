# Deploy Vastukala on Vercel

Vercel serves the built React site and the prepared WebP images. A Node function runs the Express API against hosted PostgreSQL. The catalogue and DBMS Lab use the same database schema and seed data as local development.

## Connect the project

1. Run `npx vercel login` and approve device sign-in in the browser.
2. Run `npx vercel link` from the repository root. Select the Vercel account or team and link or create the Vastukala project.
3. Connect a PostgreSQL database dedicated to Vastukala. Set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters in the project's Production environment.

## Prepare and publish

Run the migration and seed commands with `DATABASE_URL` set to the hosted database in your local shell. Use the provider's direct connection for provisioning when it also provides a pooled application URL. Keep connection strings and administrator credentials outside Git.

```sh
npm ci
npm run media:fetch
npm run db:migrate
npm run db:seed
npm run build:vercel
npx vercel deploy --prod
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local shell before running `npm run admin:create` against the hosted database if the production site needs an administrator. Keep the generated credentials private.

The CLI deployment uploads the prepared display images from the workspace. A Git-only deployment also needs a source for those assets because the WebP files are ignored by Git.

After publishing, check `/api/health`, `/api/buildings?limit=200`, a monument photograph, and a guided query in `/dbms-lab`.
