import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../../database/entities';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
  ) {}

  async registerTopic(
    chatId: number,
    threadId: number,
    title?: string,
  ): Promise<Topic> {
    let topic = await this.topicRepo.findOne({ where: { chatId, threadId } });
    if (topic !== null) {
      if (title !== undefined && topic.title !== title) {
        topic.title = title;
        await this.topicRepo.save(topic);
      }
      return topic;
    }
    topic = this.topicRepo.create({
      chatId,
      threadId,
      title: title ?? null,
    });
    return this.topicRepo.save(topic);
  }

  async getTopicsForChat(chatId: number): Promise<Topic[]> {
    return this.topicRepo.find({ where: { chatId } });
  }

  async getAllChats(): Promise<number[]> {
    const result = await this.topicRepo
      .createQueryBuilder('topic')
      .select('DISTINCT topic.chatId', 'chatId')
      .getRawMany<{ chatId: number }>();
    return result.map((r) => r.chatId);
  }
}
