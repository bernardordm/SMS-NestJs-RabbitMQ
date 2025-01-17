import { Injectable, OnModuleInit } from '@nestjs/common';
import { createRabbitMQChannel } from '../config/rabbitmq.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sms } from 'src/schema/sms.schema';

@Injectable()
export class SmsService implements OnModuleInit {
  private channel;

  constructor(@InjectModel(Sms.name) private smsModel: Model<Sms>) {}

  async onModuleInit() {
    console.log('Inicializando SmsService');
    await this.init();
  }

  async init() {
    try {
      console.log('Criando canal RabbitMQ');
      this.channel = await createRabbitMQChannel();
    } catch (error) {
      console.error('Error initializing SmsService:', error);
    }
  }

  async sendSMS(phoneNumber: string, message: string) {
    try {
      const sms = new this.smsModel({ phoneNumber, message, status: 'pending',  });
      await sms.save();
      await this.channel.sendToQueue('sms_queue', Buffer.from(JSON.stringify({ phoneNumber, message })));
      console.log(`Mensagem enviada para a fila: ${phoneNumber} - ${message}`);
      return { success: true, message: 'Mensagem enviada para a fila' };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, message: 'Erro ao enviar mensagem para a fila' };
    }
  }

}