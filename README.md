# MountainTracker 🏔️

A beautiful Next.js application for tracking your mountain tours, climbs, and hiking adventures. Import tours directly from bergsteigen.com or create your own.

## Features

- 🔐 **Secure Authentication** - Username/password authentication with NextAuth.js
- 🌐 **Web Scraping** - Import tours directly from bergsteigen.com URLs
- 📊 **Categorization** - Organize tours by condition (Winter, Sommer, Übergang) and activity type
- ✅ **Track Completion** - Mark tours as completed with dates
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 🗃️ **PostgreSQL Database** - Robust data storage with Prisma ORM
- ☁️ **Vercel Ready** - Optimized for deployment on Vercel

## Activity Categories

- Sportklettern
- Alpinklettern
- Sportklettersteig
- Hochtour
- Eis/Mixedklettern
- Wandern
- Bergtour
- Skitour
- Skihochtour

## Condition Categories

- **Winter** - Snow and ice conditions
- **Sommer** - Summer hiking season
- **Übergang** - Transition periods

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **Web Scraping:** Cheerio + Axios
- **Form Validation:** Zod + React Hook Form
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mountaintracker.git
cd mountaintracker
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure:

- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)

4. Initialize the database:

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Using Vercel Postgres

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Add a Postgres database:

   - Go to Storage tab
   - Create a new Postgres database
   - Vercel will automatically add the required environment variables

4. Add additional environment variables:

   - `NEXTAUTH_SECRET` - Generate a secure random string
   - `NEXTAUTH_URL` - Your production URL (e.g., https://mountaintracker.vercel.app)

5. Deploy! Vercel will automatically:
   - Install dependencies
   - Run `prisma generate` (via postinstall script)
   - Build your application
   - Deploy to production

### Using External PostgreSQL

If you prefer to use an external PostgreSQL provider (like Supabase, Railway, or Neon):

1. Create a PostgreSQL database with your provider
2. In Vercel project settings, add environment variables:

   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate a secure random string
   - `NEXTAUTH_URL` - Your production URL

3. Deploy your application

## Database Schema

The application uses two main models:

### User

- Authentication and user management
- Stores hashed passwords

### Tour

- Tour name, description, and location
- Condition and activity categorization
- Metrics: elevation, distance, duration
- Difficulty and grade ratings
- Image and source URLs
- Completion tracking
- Personal notes

## Usage

### Creating a Tour

1. Click "New Tour" in the navigation
2. Either:
   - Import from bergsteigen.com by pasting a URL
   - Manually fill in tour details
3. Review and save

### Organizing Tours

- Use filters to view tours by:
  - Condition (Winter/Sommer/Übergang)
  - Activity type
  - Completion status

### Marking Tours Complete

- Click on a tour to view details
- Click "Mark Complete" to track completion with timestamp

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── tours/         # Tour CRUD operations
│   ├── auth/              # Auth pages (login/register)
│   └── tours/             # Tour pages
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── tours/            # Tour-specific components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and configurations
│   ├── constants.ts      # App constants and labels
│   ├── prisma.ts         # Prisma client instance
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Zod schemas
├── services/             # Business logic
│   └── scraper.ts        # Web scraping service
└── types/                # TypeScript type definitions
```

## Clean Code Principles

This project follows clean code principles:

- **Single Responsibility** - Each component and function has one clear purpose
- **DRY (Don't Repeat Yourself)** - Reusable components and utilities
- **Separation of Concerns** - Clear separation between UI, business logic, and data layers
- **Type Safety** - Full TypeScript coverage with proper typing
- **Validation** - Zod schemas for runtime type checking
- **Readable Code** - Descriptive names and clear structure

## Contributing

Contributions are welcome! This is a public repository.

## License

MIT License - feel free to use this project for your own mountain tracking needs!

## Acknowledgments

- Tour data sourced from [bergsteigen.com](https://www.bergsteigen.com)
- Built with ❤️ for mountain enthusiasts
