#!/bin/bash

# Build script for Vercel deployment
echo "Starting build process..."

# Build the frontend
echo "Building frontend..."
npm run build

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Return to root directory
cd ..

echo "Build process completed successfully!"