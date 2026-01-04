import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplicationDocument = ApplicationSchema &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class ApplicationSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  clientId: string;

  @Prop({ type: String, required: true })
  clientSecret: string;

  @Prop({ type: [String], default: [] })
  scopes: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ApplicationSchemaFactory =
  SchemaFactory.createForClass(ApplicationSchema);
