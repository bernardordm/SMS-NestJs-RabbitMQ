import {Body, Controller, Post} from '@nestjs/common';
import {SmsService} from './sms.service';

@Controller('sms')
export class SmsController{
    constructor(private readonly smsService:SmsService){}

    @Post('send')
    async sendSms(@Body() body: {phoneNumber: string; message: string})
{
    const {phoneNumber, message} = body;
    if(!phoneNumber || !message){
        return 'Phone number and message are required';
    }
    return this.smsService.sendSMS(phoneNumber, message);
}
}