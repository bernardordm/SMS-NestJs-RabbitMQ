"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSMPPConnection = createSMPPConnection;
// src/config/smpp.config.ts
var smpp = require("smpp");
function createSMPPConnection() {
    console.log('Iniciando a criação da conexão SMPP');
    var session = new smpp.Session({
        host: process.env.SMPP_HOST || 'localhost',
        port: parseInt(process.env.SMPP_PORT, 10) || 2775,
        // Se o provedor SMPP exigir SSL/TLS, descomente e configure as opções abaixo:
        tls: {
            rejectUnauthorized: false, // Desabilita a verificação do certificado (não recomendado para produção)
            // Certificados podem ser adicionados aqui se necessário
            // key: fs.readFileSync('path/to/key.pem'),
            // cert: fs.readFileSync('path/to/cert.pem'),
        },
    });
    console.log('Chamando bind_transceiver com system_id:', process.env.SMPP_SYSTEM_ID);
    session.bind_transceiver({
        system_id: process.env.SMPP_SYSTEM_ID || 'your_system_id',
        password: process.env.SMPP_PASSWORD || 'your_password',
    });
    session.on('connect', function () {
        console.log('SMPP session connected');
    });
    session.on('bind_transceiver', function (response) {
        if (response.command_status === 0) {
            console.log('SMPP connection created');
        }
        else {
            console.log('SMPP connection failed to bind. Status:', response.command_status);
        }
    });
    session.on('close', function () {
        console.log('SMPP session closed');
    });
    session.on('error', function (err) {
        console.error('SMPP error:', err);
    });
    session.on('pdu', function (pdu) {
        if (pdu.command === 'deliver_sm') {
            console.log('Received delivery receipt:', pdu);
            // Implementar lógica para recibos de entrega, se necessário
        }
    });
    console.log('Retornando a sessão SMPP');
    return session;
}
