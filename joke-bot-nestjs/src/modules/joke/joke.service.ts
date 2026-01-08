import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Joke } from '../../database/entities';

@Injectable()
export class JokeService {
  constructor(
    @InjectRepository(Joke)
    private readonly jokeRepo: Repository<Joke>,
  ) {}

  async getRandomJoke(): Promise<Joke | null> {
    const jokes = await this.jokeRepo.find();
    if (jokes.length === 0) {
      return null;
    }
    return jokes[Math.floor(Math.random() * jokes.length)] ?? null;
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
