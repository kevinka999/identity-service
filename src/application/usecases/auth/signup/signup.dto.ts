import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export class SignupDto extends createZodDto(signupSchema) {}

