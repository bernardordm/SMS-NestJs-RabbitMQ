import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SmsModule } from './sms/sms.module';
import { AppService } from './app.service';

@Module({
  imports: [SmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
