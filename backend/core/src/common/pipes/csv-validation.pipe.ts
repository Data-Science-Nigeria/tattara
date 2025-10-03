import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from 'src/modules/auth/dto';
import { parse } from 'csv-parse';
import { PassThrough } from 'stream';

@Injectable()
export class CsvUsersValidationPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const users = await this.parseAndValidateCsv(file);
    return { users };
  }

  private async parseAndValidateCsv(
    file: Express.Multer.File,
  ): Promise<RegisterDto[]> {
    const rawData = await this.parseCsv(file);

    const validatedUsers: RegisterDto[] = [];
    const errors: string[] = [];

    for (const [index, userData] of rawData.entries()) {
      const userDto = plainToClass(RegisterDto, userData);
      const validationErrors = await validate(userDto);

      if (validationErrors.length > 0) {
        errors.push(
          `Row ${index + 2}: ${validationErrors.map(e => Object.values(e.constraints ?? {})).join(', ')}`,
        );
      } else {
        validatedUsers.push(userDto);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'CSV validation failed',
        errors,
      });
    }

    return validatedUsers;
  }

  private parseCsv(
    file: Express.Multer.File,
  ): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const results: Record<string, string>[] = [];
      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);

      bufferStream
        .pipe(parse({ columns: true }))
        .on('data', (data: Record<string, string>) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', error => {
          console.log(error);
          reject(new BadRequestException('Invalid CSV format'));
        });
    });
  }
}
