# MountainTracker Quick Start Script
# Run this script to set up your development environment

Write-Host "🏔️  MountainTracker Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
  $nodeVersion = node --version
  Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
}
catch {
  Write-Host "✗ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
  exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
  Write-Host ""
  Write-Host "Creating .env file..." -ForegroundColor Yellow
  Copy-Item ".env.example" ".env"
  Write-Host "✓ .env file created" -ForegroundColor Green
  Write-Host ""
  Write-Host "⚠️  Please edit .env and update:" -ForegroundColor Yellow
  Write-Host "   - DATABASE_URL with your PostgreSQL connection string" -ForegroundColor Yellow
  Write-Host "   - NEXTAUTH_SECRET with a secure random string" -ForegroundColor Yellow
  Write-Host ""
  $continue = Read-Host "Press Enter when ready to continue, or Ctrl+C to exit"
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Dependencies installed" -ForegroundColor Green
}
else {
  Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
  exit 1
}

# Generate Prisma client
Write-Host ""
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Prisma client generated" -ForegroundColor Green
}
else {
  Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
  exit 1
}

# Push database schema
Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
Write-Host "This will create the database tables." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Database setup complete" -ForegroundColor Green
}
else {
  Write-Host "✗ Failed to setup database" -ForegroundColor Red
  Write-Host "Please check your DATABASE_URL in .env" -ForegroundColor Yellow
  exit 1
}

# Success message
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "3. Register a new account" -ForegroundColor White
Write-Host "4. Start tracking your mountain tours!" -ForegroundColor White
Write-Host ""
Write-Host "Optional: Open Prisma Studio to view your database" -ForegroundColor Cyan
Write-Host "  npx prisma studio" -ForegroundColor White
Write-Host ""

# Ask if user wants to start dev server
$startDev = Read-Host "Start development server now? (y/n)"
if ($startDev -eq "y" -or $startDev -eq "Y") {
  Write-Host ""
  Write-Host "Starting development server..." -ForegroundColor Yellow
  npm run dev
}
