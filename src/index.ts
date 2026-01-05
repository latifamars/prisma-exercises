// Start by installing the project with `npm install`
// Set your connection string in the `.env` file
// Set up your schema.prisma file
// Generate the client with `npx prisma generate`
// Update the database with with `npx prisma migrate dev`
// Run the app with `npm run start`

import { input, select } from "@inquirer/prompts";
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
// import { log } from "console";
// import { console } from "inspector";

const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) {
  throw new Error('Could not find "DATABASE_URL" in your .env file');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function addMovie(): Promise<void> {
  const title = await input({ message: "Movie title:" });
  const yearInput = await input({ message: "Release year:" });
  const year = parseInt(yearInput);
  const description = await input({
    message: "Movie description (optional):",
    default: "",
  });

  const genreNames: string[] = [];
  let addMore = true;

  while (addMore) {
    const genreName = await input({ message: "Genre name:" });
    genreNames.push(genreName);

    addMore = await select({
      message: "Add another genre?",
      choices: [
        { name: "Yes", value: true },
        { name: "No", value: false },
      ],
    });
  }

  const movie = await prisma.$transaction(async (tx) => {
    const genreConnections = await Promise.all(
      genreNames.map(async (name) => {
        const genre = await tx.genre.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        return { genreId: genre.id };
      })
    );

    return tx.movie.create({
      data: {
        title,
        year,
        description: description || null,
        genres: {
          create: genreConnections.map((g) => ({ genreId: g.genreId })),
        },
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  });

  const genresList = movie.genres.map((mg) => mg.genre.name).join(", ");
  console.log(`\nCreated movie: ${movie.title} (${movie.year})`);
  console.log(`Genres: ${genresList}`);
  console.log(`Description: ${movie.description || "N/A"}`);

  // Expected:
  // 1. Prompt the user for movie title, year.
  // 2. Use Prisma client to create a new movie with the provided details.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
  // 3. Print the created movie details.
  //
  // Transactions and relationships (This we can add later on)
  //    Reference : https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  // Expected:
  // 1.b Prompt the user for genre.
  // 2.b If the genre does not exist, create a new genre.
  // 3.b Ask the user if they want to want to add another genre to the movie.
}

async function updateMovie(): Promise<void> {
  const idInput = await input({ message: "Movie ID to update:" });
  const id = parseInt(idInput);

  const title = await input({ message: "New title:" });
  const yearInput = await input({ message: "New year:" });
  const year = parseInt(yearInput);
  const description = await input({ message: "New description:" });

  const updateGenres = await select({
    message: "Do you want to update genres?",
    choices: [
      { name: "Yes", value: true },
      { name: "No", value: false },
    ],
  });

  const genreNames: string[] = [];
  if (updateGenres) {
    let addMore = true;
    while (addMore) {
      const genreName = await input({ message: "Genre name:" });
      genreNames.push(genreName);

      addMore = await select({
        message: "Add another genre?",
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false },
        ],
      });
    }
  }
  try {
    const movie = await prisma.$transaction(async (tx) => {
      if (updateGenres) {
        await tx.movieGenre.deleteMany({
          where: { movieId: id },
        });

        const genreConnections = await Promise.all(
          genreNames.map(async (name) => {
            const genre = await tx.genre.upsert({
              where: { name },
              update: {},
              create: { name },
            });
            return { genreId: genre.id };
          })
        );

        return tx.movie.update({
          where: { id },
          data: {
            title,
            year,
            description: description || null,
            genres: {
              create: genreConnections.map((g) => ({ genreId: g.genreId })),
            },
          },
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        });
      } else {
        return tx.movie.update({
          where: { id },
          data: {
            title,
            year,
            description: description || null,
          },
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        });
      }
    });

    const genresList = movie.genres.map((mg) => mg.genre.name).join(", ");
    console.log(`\nUpdated movie: ${movie.title} (${movie.year})`);
    console.log(`Genres: ${genresList || "No genres"}`);
    console.log(`Description: ${movie.description || "N/A"}`);
  } catch (error: any) {
    if (error.code === "P2025") {
      console.log(`\nMovie not found with that ID.`);
    } else {
      throw error;
    }
  }
  // Expected:
  // 1. Prompt the user for movie ID to update.
  // 2. Prompt the user for new movie title, year.
  // 3. Use Prisma client to update the movie with the provided ID with the new details.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
  // 4. Print the updated movie details.
}

async function deleteMovie(): Promise<void> {
  const idInput = await input({ message: "Movie ID to delete:" });
  const id = parseInt(idInput);

  try {
    const movie = await prisma.movie.delete({
      where: { id },
    });

    console.log(`\nDeleted movie: ${movie.title} (${movie.year})`);
  } catch (error: any) {
    if (error.code === "P2025") {
      console.log(`\nMovie not found with that ID `);
    } else {
      throw error;
    }
  }
  // Expected:
  // 1. Prompt the user for movie ID to delete.
  // 2. Use Prisma client to delete the movie with the provided ID.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#delete
  // 3. Print a message confirming the movie deletion.
}

async function listMovies(): Promise<void> {
  const movies = await prisma.movie.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  if (movies.length === 0) {
    console.log(`\nNo movies found`);
    return;
  }

  console.log(`\nFound ${movies.length} movies:\n`);
  movies.forEach((movie) => {
    const genreNames = movie.genres.map((mg) => mg.genre.name).join(", ");
    console.log(
      `[${movie.id}] ${movie.title} ${movie.year} - ${
        genreNames || "No genres"
      }`
    );
  });
  // Expected:
  // 1. Use Prisma client to fetch all movies.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
  // 2. Include the genre details in the fetched movies.
  // 3. Print the list of movies with their genres (take 10).
}

async function listMovieById(): Promise<void> {
  const idInput = await input({ message: "Movie ID:" });
  const id = parseInt(idInput);

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  if (!movie) {
    console.log(`\nMovie not found with that ID.`);
    return;
  }

  const genreNames = movie.genres.map((mg) => mg.genre.name).join(", ");
  console.log(`\nTitle: ${movie.title}`);
  console.log(`Year: ${movie.year}`);
  console.log(`Description: ${movie.description || "N/A"}`);
  console.log(`Genres: ${genreNames || "No genres"}`);
  console.log(`Created: ${movie.createdAt.toLocaleString()}`);
  console.log(`Updated: ${movie.updatedAt.toLocaleString()}`);
  // Expected:
  // 1. Prompt the user for movie ID to list.
  // 2. Use Prisma client to fetch the movie with the provided ID.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
  // 3. Include the genre details in the fetched movie.
  // 4. Print the movie details with its genre.
}

async function listMovieByGenre(): Promise<void> {
  const genreName = await input({ message: "Genre name:" });

  const movies = await prisma.movie.findMany({
    where: {
      genres: {
        some: {
          genre: {
            name: {
              equals: genreName,
              mode: "insensitive",
            },
          },
        },
      },
    },
    take: 10,
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  if (movies.length === 0) {
    console.log(`\nNo movies found in genre "${genreName}".`);
    return;
  }

  console.log(`\nFound ${movies.length} movies in genre "${genreName}":\n`);
  movies.forEach((movie) => {
    const genreNames = movie.genres.map((mg) => mg.genre.name).join(", ");
    console.log(`[${movie.id}] ${movie.title} (${movie.year}) - ${genreNames}`);
  });
  // Expected:
  // 1. Prompt the user for genre Name to list movies.
  // 2. Use Prisma client to fetch movies with the provided genre ID.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
  // 3. Include the genre details in the fetched movies.
  // 4. Print the list of movies with the provided genre (take 10).
}

async function addGenre(): Promise<void> {
  const name = await input({ message: "Genre name:" });

  try {
    const genre = await prisma.genre.create({
      data: { name },
    });

    console.log(`\nCreated genre: ${genre.name} (ID: ${genre.id})`);
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log(`\nGenre already exists with that name.`);
    } else {
      throw error;
    }
  }
  // Expected:
  // 1. Prompt the user for genre name.
  // 2. Use Prisma client to create a new genre with the provided name.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
  // 3. Print the created genre details.
}

async function exitProgram(): Promise<never> {
  await prisma.$disconnect();
  process.exit(0);
}

const choices = [
  { name: "Add movie", value: addMovie },
  { name: "Update movie", value: updateMovie },
  { name: "Delete movie", value: deleteMovie },
  { name: "List all movies", value: listMovies },
  { name: "Get movie by ID", value: listMovieById },
  { name: "Get movies by Genre", value: listMovieByGenre },
  { name: "Add genre", value: addGenre },
  { name: "Exit", value: exitProgram },
] as const;

while (true) {
  try {
    console.clear();

    const action = await select({
      message: "Select an action:",
      choices: choices,
      loop: false,
    });

    await action();
  } catch (error) {
    console.error("An error occurred:", error);
    console.log("Please try again.");
  } finally {
    console.log();
    void (await input({
      message: "Press Enter to continue...",
      theme: {
        prefix: "",
      },
    }));
  }
}
