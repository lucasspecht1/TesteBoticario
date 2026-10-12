import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
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
