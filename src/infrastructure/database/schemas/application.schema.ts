import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplicationDocument = ApplicationSchema &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class ApplicationSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  clientId: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({ type: [String], default: [] })
  scopes: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ApplicationSchemaFactory =
  SchemaFactory.createForClass(ApplicationSchema);

