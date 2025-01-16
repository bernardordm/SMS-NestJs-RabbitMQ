import * as amqp from 'amqplib';

export const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost',
  queue: 'sms_queue',
};

export async function createRabbitMQChannel() {
  try {
    const connection = await amqp.connect(rabbitmqConfig.url, {
      rejectUnauthorized: false, // Desabilitar verificação de certificado SSL (apenas para testes)
    });
    const channel = await connection.createChannel();
    await channel.assertQueue(rabbitmqConfig.queue, { durable: true });
    console.log('RabbitMQ connected and queue asserted');
    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}