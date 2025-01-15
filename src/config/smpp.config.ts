import * as smpp from 'smpp';

export function createSMPPConnection(){
    const session = new smpp.Session({
        host: process.env.SMPP_HOST || 2775,
        port: parseInt(process.env.SMPP_PORT) || 2775,
    });

    session.bind_transceiver({
        system_id : process.env.SMPP_SYSTEM_ID || 'your_system_id',
        password: process.env.SMPP_PASSWORD || 'your_password',
});

session.on('bind_transceiver', (response) => {
    if(response.command_status ===0){
        console.log('SMPP connection created');
    }
    else{
        console.log('SMPP connection failed to bind');
    }
});

session.on('error', (err)=> {
    console.error('SMPP error:', err); 
})

return session;
}