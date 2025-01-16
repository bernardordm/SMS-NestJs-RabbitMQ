// test-smpp-connection.ts
import 'dotenv/config'; // Adicione esta linha para carregar as variáveis de ambiente
import { createSMPPConnection } from './src/config/smpp.config';

async function testSmpp() {
  const session = createSMPPConnection();

  // Aguarde um tempo para tentar o bind_transceiver
  setTimeout(() => {
    console.log('Finalizando teste SMPP');
    session.close();
  }, 10000); // 10 segundos
}

testSmpp();