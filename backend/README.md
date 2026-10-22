# Apexbridge backend
Install PostgreSQL, create an `apexbridge` database, copy `.env.example` to `.env`, and set secrets.
Run `npm install` and `npx prisma generate` from `backend/`.
Apply the schema with `npm run db:migrate`.
Create the initial SUPER_ADMIN with `npm run db:seed` (development only).
Start the API with `npm run dev`; health check: `http://localhost:4000/api/health`.
