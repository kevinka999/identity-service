import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefreshTokenDocument = RefreshTokenSchema &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class RefreshTokenSchema {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  applicationId: string;

  @Prop({ type: String, required: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const RefreshTokenSchemaFactory =
  SchemaFactory.createForClass(RefreshTokenSchema);
