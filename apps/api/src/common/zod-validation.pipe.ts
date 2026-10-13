import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

/** Valida o valor com um schema Zod; erro vira 400 com os campos inválidos em `details`. */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Dados inválidos',
        details: z.flattenError(result.error).fieldErrors,
      });
    }
    return result.data;
  }
}
