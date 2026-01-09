import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  // eslint-disable-next-line no-console
  console.log('🚀 Bot started successfully');

  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log('👋 Shutting down...');
    void app.close().then(() => {
      process.exit(0);
    });
  });
}

void bootstrap();
