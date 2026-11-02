import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { brand } from '../../config/brand';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true, collection: 'settings' })
export class Setting {
  @Prop({ default: brand.nameEn })
  systemName: string;

  @Prop({ default: '/logo2.png' })
  logo: string;

  @Prop({ default: '#2563EB' })
  primaryColor: string;

  @Prop({ default: '#7C3AED' })
  secondaryColor: string;

  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop()
  maintenanceMessage: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
