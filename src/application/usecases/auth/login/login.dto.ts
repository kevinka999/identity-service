import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export class LoginDto extends createZodDto(loginSchema) {}

export const loginGoogleSchema = z.object({
  credential: z.string().min(1, 'Credential é obrigatória'),
});

export class LoginGoogleDto extends createZodDto(loginGoogleSchema) {}