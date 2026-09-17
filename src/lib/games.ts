import { eq, asc, desc, ne, or, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/** All games ordered by title. */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

/**
 * Games related to the given game because they share its category or
 * publisher, excluding the game itself. Ordered by star rating (highest
 * first) then title so results are deterministic across builds, and
 * capped at `limit` entries.
 */
export async function getRelatedGames(db: Database, game: Game, limit = 4): Promise<Game[]> {
    const categoryId = game.category?.id;
    const publisherId = game.publisher?.id;

    if (categoryId === undefined && publisherId === undefined) {
        return [];
    }

    const relationMatch =
        categoryId !== undefined && publisherId !== undefined
            ? or(eq(games.categoryId, categoryId), eq(games.publisherId, publisherId))
            : categoryId !== undefined
              ? eq(games.categoryId, categoryId)
              : eq(games.publisherId, publisherId as number);

    const rows = await baseGamesQuery(db)
        .where(and(ne(games.id, game.id), relationMatch))
        .orderBy(desc(games.starRating), asc(games.title))
        .limit(limit);

    return rows.map(mapGame);
}
