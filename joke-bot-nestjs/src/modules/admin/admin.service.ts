import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, ChatSettings } from '../../database/entities';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    @InjectRepository(ChatSettings)
    private readonly settingsRepo: Repository<ChatSettings>,
  ) {}

  async isAdmin(telegramId: number): Promise<boolean> {
    const admin = await this.adminRepo.findOne({ where: { telegramId } });
    return admin !== null;
  }

  async addAdmin(telegramId: number, addedBy?: number): Promise<Admin> {
    const admin = this.adminRepo.create({
      telegramId,
      addedBy: addedBy ?? null,
    });
    return this.adminRepo.save(admin);
  }

  async removeAdmin(telegramId: number): Promise<void> {
    await this.adminRepo.delete({ telegramId });
  }

  async getAllAdmins(): Promise<Admin[]> {
    return this.adminRepo.find();
  }

  async getOrCreateSettings(chatId: number): Promise<ChatSettings> {
    let settings = await this.settingsRepo.findOne({ where: { chatId } });
    if (settings === null) {
      settings = this.settingsRepo.create({ chatId });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(
    chatId: number,
    update: Partial<ChatSettings>,
  ): Promise<ChatSettings> {
    const settings = await this.getOrCreateSettings(chatId);
    Object.assign(settings, update);
    return this.settingsRepo.save(settings);
  }
}
