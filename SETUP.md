# MountainTracker Setup Guide

## Quick Start

Follow these steps to get your development environment running:

### 1. Install Dependencies

```powershell
npm install
```

### 2. Set Up Database

You have several options for PostgreSQL:

#### Option A: Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create a database: `createdb mountaintracker`
2. Update `.env` with your connection details

#### Option B: Docker (Recommended for Development)

```powershell
docker run --name mountaintracker-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mountaintracker -p 5432:5432 -d postgres:15
```

#### Option C: Cloud Provider (Supabase, Neon, Railway)

1. Create a PostgreSQL database with your preferred provider
2. Copy the connection string
3. Update `DATABASE_URL` in `.env`

### 3. Configure Environment Variables

Edit the `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mountaintracker?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure `NEXTAUTH_SECRET`:

```powershell
# On Windows with OpenSSL
openssl rand -base64 32

# Or use any random string generator
# Example: https://generate-secret.vercel.app/32
```

### 4. Initialize Database

```powershell
npx prisma generate
npx prisma db push
```

### 5. Run Development Server

```powershell
npm run dev
```

Visit http://localhost:3000

### 6. Create Your First User

1. Navigate to http://localhost:3000/auth/register
2. Create an account
3. Start tracking tours!

## Vercel Deployment

### Quick Deploy

1. Push your code to GitHub
2. Import project in Vercel
3. Add Vercel Postgres database (Storage tab)
4. Add environment variable:
   - `NEXTAUTH_SECRET` - Generate a secure random string
   - `NEXTAUTH_URL` - Your production URL
5. Deploy!

### Vercel Postgres Setup

Vercel automatically sets these variables when you add a Postgres database:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` (use this for `DATABASE_URL`)
- `POSTGRES_URL_NON_POOLING`

Just make sure your `DATABASE_URL` in Vercel points to `POSTGRES_PRISMA_URL`:

```
DATABASE_URL=${POSTGRES_PRISMA_URL}
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check connection string format
- Ensure database exists

### Prisma Errors

```powershell
# Reset and regenerate
npx prisma generate
npx prisma db push --force-reset
```

### Build Errors

```powershell
# Clear cache and rebuild
Remove-Item -Recurse -Force .next
npm run build
```

## Database Management

### View Database in Prisma Studio

```powershell
npx prisma studio
```

### Create a Migration

```powershell
npx prisma migrate dev --name your_migration_name
```

### Reset Database (CAUTION: Deletes all data)

```powershell
npx prisma migrate reset
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database GUI

## Tech Stack Reference

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **Zod** - Schema validation
- **React Hook Form** - Form management
- **Cheerio** - Web scraping

## Project Features

✅ User authentication with secure password hashing  
✅ Tour CRUD operations  
✅ Web scraping from bergsteigen.com  
✅ Advanced filtering (condition, activity, completion)  
✅ Image support  
✅ Responsive design  
✅ Tour completion tracking  
✅ Personal notes  
✅ Vercel-optimized

## Need Help?

Check the README.md for more detailed information about the project structure and features.
