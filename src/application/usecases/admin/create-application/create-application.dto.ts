import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createApplicationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  scopes: z.array(z.string()).optional().default([]),
});

export class CreateApplicationDto extends createZodDto(
  createApplicationSchema,
) {}
