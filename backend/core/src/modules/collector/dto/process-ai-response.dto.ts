import type { ExtractionRow, Metrics } from '@/modules/ai/interfaces';
import { Expose } from 'class-transformer';

export class ProcessAiResponseDto {
  @Expose()
  form_id: string;

  @Expose()
  form_version?: string;

  @Expose()
  total_rows: number;

  @Expose()
  rows: ExtractionRow[];

  @Expose()
  confidence?: Record<string, number>;

  @Expose()
  metrics?: Metrics;

  @Expose()
  meta?: Record<string, any>;
}
