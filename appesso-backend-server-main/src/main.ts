import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { readFileSync } from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('/root/secret/appesso.com.key'),
    cert: readFileSync('/root/secret/appesso.com_bundle.crt'),
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
    
  });
  console.log('static_path', join(__dirname, '../..', 'public'));
  console.log('view_path', join(__dirname, '../..', 'views'));
  app.useStaticAssets(join(__dirname, '../..', 'public'));
  app.setBaseViewsDir(join(__dirname, '../..', 'views'));
  app.setViewEngine('hbs');
  await app.listen(443);
}
bootstrap();
