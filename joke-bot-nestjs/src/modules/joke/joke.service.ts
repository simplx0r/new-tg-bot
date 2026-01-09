import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Joke } from '../../database/entities';
import { AGENT_JOKES } from '../../database/seeds';

@Injectable()
export class JokeService implements OnModuleInit {
  constructor(
    @InjectRepository(Joke)
    private readonly jokeRepo: Repository<Joke>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.jokeRepo.count();
    if (count === 0) {
      await this.jokeRepo.save(AGENT_JOKES);
    }
  }

  async getRandomJoke(category?: string): Promise<Joke | null> {
    const qb = this.jokeRepo.createQueryBuilder('joke');

    if (category !== undefined && category !== '') {
      qb.where('joke.category = :category', { category });
    }

    // Use SQL RANDOM() for performance instead of loading all jokes
    const joke = await qb.orderBy('RANDOM()').limit(1).getOne();
    return joke;
  }

  async addJoke(content: string, category = 'general'): Promise<Joke> {
    const joke = this.jokeRepo.create({ content, category });
    return this.jokeRepo.save(joke);
  }

  async getAllJokes(): Promise<Joke[]> {
    return this.jokeRepo.find();
  }

  async incrementUsage(joke: Joke): Promise<void> {
    joke.usedCount++;
    await this.jokeRepo.save(joke);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.jokeRepo
      .createQueryBuilder('joke')
      .select('DISTINCT joke.category', 'category')
      .getRawMany<{ category: string }>();
    return result.map((r) => r.category);
  }

  async getStats(): Promise<{
    total: number;
    totalUsage: number;
    byCategory: Record<string, number>;
  }> {
    const jokes = await this.jokeRepo.find();
    const byCategory = jokes.reduce<Record<string, number>>((acc, j) => {
      acc[j.category] = (acc[j.category] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total: jokes.length,
      totalUsage: jokes.reduce((s, j) => s + j.usedCount, 0),
      byCategory,
    };
  }
}
