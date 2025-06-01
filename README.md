# VoiceVerse

VoiceVerse is a full-stack application for voice transformation and social sharing.

## Project Structure

- `/src` - React frontend
- `/server` - Express.js backend
- `/prisma` - Prisma schema and migrations

## Setup

### Backend

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Configure your database connection and JWT secrets

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Frontend

1. From the root directory, install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Features

- User authentication (signup, login)
- Voice transformation
- Social sharing
- User profiles
- And more!

## Technologies Used

### Frontend
- React
- TypeScript
- Zustand (state management)
- Tailwind CSS
- Framer Motion

### Backend
- Express.js
- Prisma ORM
- MySQL
- JWT authentication
- bcrypt for password hashing