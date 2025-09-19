import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiLog1758244690208 implements MigrationInterface {
  name = 'AiLog1758244690208';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" RENAME COLUMN "input_file_id" TO "input_file_ids"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" DROP COLUMN "input_file_ids"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" ADD "input_file_ids" uuid array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" DROP COLUMN "input_file_ids"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" ADD "input_file_ids" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" RENAME COLUMN "input_file_ids" TO "input_file_id"`,
    );
  }
}
