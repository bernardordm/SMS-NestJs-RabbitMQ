import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  rabbitmqConfig,
  createRabbitMQChannel,
} from '../config/rabbitmq.config';
import { createSMPPConnection } from '../config/smpp.config';

@Injectable()
export class SmsService implements OnModuleInit {
  private channel;
  private smppSession;

  async onModuleInit() {
    await this.init();
  }

  async init() {
    this.channel = await createRabbitMQChannel();
    this.smppSession = await createSMPPConnection();
    this.consumeQueue();
  }

  async processMessage(msg) {
    if (msg !== null) {
      const smsData = JSON.parse(msg.content.toString());
      // Implementar lógica de envio via SMPP
      const session = createSMPPConnection();
      session.submit_sm({
        destination_addr: smsData.phoneNumber,
        short_message: smsData.message,
      }, (pdu) => {
        if (pdu.command_status === 0) {
          console.log('SMS sent successfully');
        } else {
          console.log('Failed to send SMS');
        }
      });
      this.channel.ack(msg);
    }
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