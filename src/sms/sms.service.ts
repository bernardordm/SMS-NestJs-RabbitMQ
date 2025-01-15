import { Injectable } from '@nestjs/common';
import {
  rabbitmqConfig,
  createRabbitMQChannel,
} from '../config/rabbitmq.config';
import { createSMPPConnection } from '../config/smpp.config';

@Injectable()
export class SmsService {
  private channel;
  private smppSession;

  constructor() {
    this.init();
  }

  async init() {
    this.channel = await createRabbitMQChannel();
    this.smppSession = await createSMPPConnection();
    this.consumeQueue();
  }

  async sendSMS(phoneNumber: string, message: string) {
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

  async consumeQueue() {
    this.channel.consume(
      rabbitmqConfig.queue,
      (msg) => {
        const { phoneNumber, message } = JSON.parse(msg.content.toString());
        this.smppSession.submit_sm(
          { destination_addr: phoneNumber, short_message: message },
          (pdu) => {
            if (pdu.command_status === 0) {
              console.log(`SMS sent to ${phoneNumber}`);
              this.channel.ack(msg);
            } else {
              console.log(`Failed to send SMS to ${phoneNumber}`);
              this.channel.nack(msg);
            }
          },
        );
      },
      { noAck: false },
    );
  }
}