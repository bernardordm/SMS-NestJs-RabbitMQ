const amqp = require('amqplib');

async function testConnection() {
  try {
    const connection = await amqp.connect('amqps://miftdubv:i1uF7gv3sNB4Ze5pY9Vr0C6o0a2QECAt@jackal.rmq.cloudamqp.com/miftdubv', {
      rejectUnauthorized: false, // Desabilitar verificação de certificado SSL (apenas para testes)
    });
    console.log('Connected to RabbitMQ');
    await connection.close();
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
}

testConnection();