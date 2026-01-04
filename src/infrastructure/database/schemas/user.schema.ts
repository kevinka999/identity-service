import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserSchema &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class UserSchema {
  @Prop({ type: String, required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  @Prop({
    type: [
      {
        provider: { type: String, enum: ['local', 'google'], required: true },
        providerUserId: { type: String, required: false },
        passwordHash: { type: String, required: false },
        createdAt: { type: Date, required: true },
      },
    ],
    default: [],
  })
  authProviders: Array<{
    provider: 'local' | 'google';
    providerUserId?: string;
    passwordHash?: string;
    createdAt: Date;
  }>;

  @Prop({
    type: [
      {
        applicationId: { type: String, required: true },
        role: { type: String, required: true },
        status: { type: String, enum: ['active', 'blocked'], required: true },
        metadata: { type: Object, required: false },
        createdAt: { type: Date, required: true },
      },
    ],
    default: [],
  })
  applications: Array<{
    applicationId: string;
    role: string;
    status: 'active' | 'blocked';
    metadata?: Record<string, unknown>;
    createdAt: Date;
  }>;
}

export const UserSchemaFactory = SchemaFactory.createForClass(UserSchema);
