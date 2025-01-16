import { Injectable, OnModuleInit } from '@nestjs/common';
import { rabbitmqConfig, createRabbitMQChannel } from '../config/rabbitmq.config';
import { createSMPPConnection } from '../config/smpp.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sms } from 'src/schema/sms.schema';

@Injectable()
export class SmsService implements OnModuleInit {
  private channel;
  private smppSession;

  constructor(@InjectModel(Sms.name) private smsModel: Model<Sms>) {}

  async onModuleInit() {
    console.log('Inicializando SmsService');
    await this.init();
  }

  async init() {
    try {
      console.log('Criando canal RabbitMQ');
      this.channel = await createRabbitMQChannel();
      console.log('Criando conexão SMPP');
      this.smppSession = await createSMPPConnection();
      this.consumeQueue();
    } catch (error) {
      console.error('Error initializing SmsService:', error);
    }
  }

  async consumeQueue() {
    console.log('Consumidor iniciando');
    this.channel.consume(
      rabbitmqConfig.queue,
      this.processMessage.bind(this),
      { noAck: false },
    );
    console.log('Consumidor configurado para a fila:', rabbitmqConfig.queue);
  }

  async processMessage(msg) {
    if (!msg) {
      console.log('Mensagem vazia recebida');
      return;
    }
    try {
      const smsData = JSON.parse(msg.content.toString());
      console.log('Processando mensagem:', smsData);
      this.smppSession.submit_sm(
        {
          source_addr: process.env.SENDER_ID || 'default_sender',
          destination_addr: smsData.phoneNumber,
          short_message: smsData.message,
        },
        async (pdu) => {
          console.log('Callback submit_sm chamado');
          if (pdu.command_status === 0) {
            console.log('SMS sent successfully');
            await this.smsModel.updateOne(
              { phoneNumber: smsData.phoneNumber, message: smsData.message },
              { status: 'sent' },
            );
            this.channel.ack(msg); // Confirma a mensagem
          } else {
            console.error('Failed to send SMS');
            await this.smsModel.updateOne(
              { phoneNumber: smsData.phoneNumber, message: smsData.message },
              { status: 'failed' },
            );
            this.channel.nack(msg); // Não confirma a mensagem
          }
        },
      );
    } catch (error) {
      console.error('Error processing message:', error);
      this.channel.nack(msg);
    }
  }

  async sendSMS(phoneNumber: string, message: string) {
    try {
      const createdSms = new this.smsModel({ phoneNumber, message });
      await createdSms.save();

      const payload = { phoneNumber, message };
      this.channel.sendToQueue(
        rabbitmqConfig.queue,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );

      console.log('SMS adicionado à fila:', payload);

      return { message: 'SMS added to queue and saved to database' };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}