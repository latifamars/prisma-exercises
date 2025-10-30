# Movie Management CLI Application

A command-line interface (CLI) application for managing a movie database using Node.js, TypeScript, and Prisma ORM.

## Features

- Add new movies with title and year
- Update existing movies
- Delete movies
- List all movies
- Search movies by ID
- Search movies by genre
- Add new genres
- Support for multiple genres per movie

## Prerequisites

- Node.js (v20 or higher)
- npm (Node Package Manager)
- A database (PostgreSQL)

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/sebastian-vallin/prisma-exercises.git
   cd prisma-assignment
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your database:

   - Create a `.env` file in the root directory
   - Add your database connection string:

     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
     ```

4. Set up your database schema:

   - The schema file is located at `prisma/schema.prisma`
   - Make sure it includes the necessary models for movies and genres

5. Generate Prisma Client and apply migrations:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

## Running the Application

Start the application with:

```bash
npm run start
```

## Usage

The application provides an interactive CLI with the following options:

1. Add Movie - Add a new movie with title and year
2. Update Movie - Update an existing movie's details
3. Delete Movie - Remove a movie from the database
4. List Movies - Display all movies in the database
5. Find Movie by ID - Search for a specific movie using its ID
6. Find Movies by Genre - List all movies of a specific genre
7. Add Genre - Add a new genre to the database
8. Exit - Close the application

## Project Structure

- `src/` - Source code directory
  - `index.ts` - Main application file
- `prisma/` - Prisma configuration and migrations

## Technologies Used

- TypeScript
- Node.js
- Prisma ORM
- tsx (for running TypeScript files)
- @inquirer/prompts (for CLI interaction)
