import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiLog1758245973428 implements MigrationInterface {
  name = 'AiLog1758245973428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" ALTER COLUMN "ai_provider" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" ALTER COLUMN "ai_provider" SET NOT NULL`,
    );
  }
}
