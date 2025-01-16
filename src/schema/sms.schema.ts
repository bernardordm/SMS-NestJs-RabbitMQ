import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type smsDocument = HydratedDocument<Sms>;

@Schema()
export class Sms {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  message: string;
}

export const SmsSchema = SchemaFactory.createForClass(Sms);