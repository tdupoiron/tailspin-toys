import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getRelatedGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});

describe('getRelatedGames', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns games sharing a category or publisher, excluding the current one', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'cat' })
            .returning({ id: categories.id });
        const [pubOne] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });
        const [pubTwo] = await db
            .insert(publishers)
            .values({ name: 'Pub Two', description: 'pub' })
            .returning({ id: publishers.id });

        const [current] = await db
            .insert(games)
            .values({
                title: 'Current Game',
                description: 'desc',
                starRating: 4.0,
                categoryId: strategy.id,
                publisherId: pubOne.id,
            })
            .returning({ id: games.id });

        // Shares category with current game.
        await db.insert(games).values({
            title: 'Same Category',
            description: 'desc',
            starRating: 3.5,
            categoryId: strategy.id,
            publisherId: pubTwo.id,
        });

        // Shares publisher with current game.
        await db.insert(games).values({
            title: 'Same Publisher',
            description: 'desc',
            starRating: 4.5,
            categoryId: puzzle.id,
            publisherId: pubOne.id,
        });

        // Unrelated game (different category and publisher).
        await db.insert(games).values({
            title: 'Unrelated Game',
            description: 'desc',
            starRating: 5.0,
            categoryId: puzzle.id,
            publisherId: pubTwo.id,
        });

        const currentGame = await getGameById(db, current.id);
        const related = await getRelatedGames(db, currentGame!);

        expect(related.map((g) => g.title)).toEqual(['Same Publisher', 'Same Category']);
    });

    it('orders related games by star rating (highest first) then title', async () => {
        const [category] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });

        const [current] = await db
            .insert(games)
            .values({
                title: 'Current Game',
                description: 'desc',
                starRating: 4.0,
                categoryId: category.id,
                publisherId: publisher.id,
            })
            .returning({ id: games.id });

        await db.insert(games).values({
            title: 'B Tied Rating',
            description: 'desc',
            starRating: 4.5,
            categoryId: category.id,
            publisherId: publisher.id,
        });
        await db.insert(games).values({
            title: 'A Tied Rating',
            description: 'desc',
            starRating: 4.5,
            categoryId: category.id,
            publisherId: publisher.id,
        });
        await db.insert(games).values({
            title: 'Lowest Rating',
            description: 'desc',
            starRating: 3.0,
            categoryId: category.id,
            publisherId: publisher.id,
        });

        const currentGame = await getGameById(db, current.id);
        const related = await getRelatedGames(db, currentGame!);

        expect(related.map((g) => g.title)).toEqual([
            'A Tied Rating',
            'B Tied Rating',
            'Lowest Rating',
        ]);
    });

    it('caps the number of related games at the given limit', async () => {
        const [category] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });

        const [current] = await db
            .insert(games)
            .values({
                title: 'Current Game',
                description: 'desc',
                starRating: 4.0,
                categoryId: category.id,
                publisherId: publisher.id,
            })
            .returning({ id: games.id });

        for (let i = 1; i <= 6; i++) {
            await db.insert(games).values({
                title: `Related ${i}`,
                description: 'desc',
                starRating: 4.0,
                categoryId: category.id,
                publisherId: publisher.id,
            });
        }

        const currentGame = await getGameById(db, current.id);
        const related = await getRelatedGames(db, currentGame!, 4);

        expect(related).toHaveLength(4);
    });

    it('returns an empty array when there are no matching games', async () => {
        const [category] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });

        const [current] = await db
            .insert(games)
            .values({
                title: 'Lonely Game',
                description: 'desc',
                starRating: 4.0,
                categoryId: category.id,
                publisherId: publisher.id,
            })
            .returning({ id: games.id });

        const currentGame = await getGameById(db, current.id);
        const related = await getRelatedGames(db, currentGame!);

        expect(related).toEqual([]);
    });
});
