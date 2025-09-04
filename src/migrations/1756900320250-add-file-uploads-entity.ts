import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileUploadsEntity1756900320250 implements MigrationInterface {
  name = 'AddFileUploadsEntity1756900320250';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "submissionId" uuid NOT NULL, "aiProcessingLodId" uuid NOT NULL, "originalFilename" character varying NOT NULL, "fileType" character varying NOT NULL, "mimetype" character varying NOT NULL, "fileSize" integer NOT NULL, "key" character varying NOT NULL, "storagePath" character varying NOT NULL, "storageProvider" character varying NOT NULL, "checksum" character varying NOT NULL, "metadata" jsonb, "isProcessed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "created_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
    await queryRunner.query(`DROP TABLE "files"`);
  }
}
