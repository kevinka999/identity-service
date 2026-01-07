import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string(),
});

export class SignupDto extends createZodDto(signupSchema) {}
