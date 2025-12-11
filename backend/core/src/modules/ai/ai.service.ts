import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import {
  ProcessTextPayload,
  ProcessAudioPayload,
  ProcessImagePayload,
  ExtractionResponse,
} from './interfaces';

@Injectable()
export class AiService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('ai_base_url') || '';
    if (!this.baseUrl) {
      throw new Error(
        'Missing required configuration: ai_base_url is not defined',
      );
    }
  }

  private handleAiError(error: AxiosError, endpoint: string): never {
    const status = error.response?.status ?? HttpStatus.BAD_GATEWAY;
    const aiError = error.response?.data;

    this.logger.error(
      `POST ${endpoint} failed: ${status} - ${JSON.stringify(aiError) || error.message}`,
    );

    throw new HttpException(
      aiError
        ? {
            message: aiError,
          }
        : { message: 'Unknown error from AI service' },
      status,
    );
  }

  async processText(payload: ProcessTextPayload): Promise<ExtractionResponse> {
    const endpoint = `${this.baseUrl}/process/text/batch`;

    const response$ = this.httpService
      .post<ExtractionResponse>(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        catchError((error: AxiosError) => {
          this.handleAiError(error, endpoint);
        }),
      );

    const { data } = await firstValueFrom(response$);

    return data;
  }

  async processAudio(
    payload: ProcessAudioPayload,
  ): Promise<ExtractionResponse> {
    const endpoint = `${this.baseUrl}/process/audio/batch`;

    const formData = new FormData();
    formData.append('form_id', payload.form_id);
    formData.append('form_schema', JSON.stringify(payload.form_schema));

    if (payload.language) {
      formData.append('language', payload.language);
    }
    if (payload.provider_preference) {
      formData.append('provider_preference', payload.provider_preference);
    }
    formData.append('audio_file', payload.audio_file, 'audio.wav');

    const response$ = this.httpService
      .post<ExtractionResponse>(endpoint, formData, {
        headers: formData.getHeaders(),
      })
      .pipe(
        catchError((error: AxiosError) => {
          this.handleAiError(error, endpoint);
        }),
      );

    const { data } = await firstValueFrom(response$);

    return data;
  }

  async processImage(
    payload: ProcessImagePayload,
  ): Promise<ExtractionResponse> {
    const endpoint = `${this.baseUrl}/process/image/batch`;

    const formData = new FormData();
    formData.append('form_id', payload.form_id);
    formData.append('form_schema', JSON.stringify(payload.form_schema));
    if (payload.language) {
      formData.append('language', payload.language);
    }
    if (payload.provider_preference) {
      formData.append('provider_preference', payload.provider_preference);
    }

    if (Array.isArray(payload.images)) {
      payload.images.forEach((file, idx) => {
        formData.append('images', file.buffer, `image_${idx}.png`);
      });
    }

    const response$ = this.httpService
      .post<ExtractionResponse>(endpoint, formData, {
        headers: formData.getHeaders(),
      })
      .pipe(
        catchError((error: AxiosError) => {
          this.handleAiError(error, endpoint);
        }),
      );

    const { data } = await firstValueFrom(response$);

    return data;
  }
}
