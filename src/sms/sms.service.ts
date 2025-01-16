import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  rabbitmqConfig,
  createRabbitMQChannel,
} from '../config/rabbitmq.config';
import { createSMPPConnection } from '../config/smpp.config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Sms } from 'src/schema/sms.schema';

@Injectable()
export class SmsService implements OnModuleInit {
  constructor(@InjectModel(Sms.name) private smsModel: Model<Sms>) {}

  private channel;
  private smppSession;

  async onModuleInit() {
    await this.init();
  }

  async findAll() : Promise<Sms[]> {
    return this.smsModel.find().exec();
  }



  async init() {
    this.channel = await createRabbitMQChannel();
    this.smppSession = await createSMPPConnection();
    this.consumeQueue();
  }

  async consumeQueue() {
    this.channel.consume(
      rabbitmqConfig.queue,
      this.processMessage.bind(this),
      { noAck: false },
    );
  }

  async processMessage(msg) {
    if (msg !== null) {
      const smsData = JSON.parse(msg.content.toString());
      // Implementar lógica de envio via SMPP
      this.smppSession.submit_sm({
        destination_addr: smsData.phoneNumber,
        short_message: smsData.message,
      }, (pdu) => {
        if (pdu.command_status === 0) {
          console.log('SMS sent successfully');
          this.channel.ack(msg); // Confirma a mensagem após o envio bem-sucedido
        } else {
          console.log('Failed to send SMS');
          this.channel.nack(msg); // Não confirma a mensagem em caso de falha
        }
      });
    }
  }

  async sendSMS(phoneNumber: string, message: string) {
    const createdSms = new this.smsModel({ phoneNumber, message });
    await createdSms.save();
    const payload = { phoneNumber, message };
    this.channel.sendToQueue(
      rabbitmqConfig.queue,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
      },
    );
    return { message: 'SMS added to queue' };
  }

}