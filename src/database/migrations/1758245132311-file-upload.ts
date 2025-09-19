import { MigrationInterface, QueryRunner } from 'typeorm';

export class FileUpload1758245132311 implements MigrationInterface {
  name = 'FileUpload1758245132311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "ai_processing_log_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "file_type" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "mimetype" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "key" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "storage_path" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "storage_provider" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "checksum" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "checksum" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "storage_provider" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "storage_path" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "key" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "mimetype" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "file_type" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "ai_processing_log_id" SET NOT NULL`,
    );
  }
}
