import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiLogSubmissionExternalConnection1758239585358
  implements MigrationInterface
{
  name = 'AiLogSubmissionExternalConnection1758239585358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."external_connections_type_enum" AS ENUM('dhis2', 'postgres')`,
    );
    await queryRunner.query(
      `CREATE TABLE "external_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "type" "public"."external_connections_type_enum" NOT NULL, "configuration" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_tested_at" TIMESTAMP, "test_result" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_bd94546e05c28648ee2bad611f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_processing_logs_processing_type_enum" AS ENUM('audio', 'text', 'image')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_processing_logs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_processing_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "processing_type" "public"."ai_processing_logs_processing_type_enum", "input_file_id" character varying, "form_schema" jsonb, "input_text" text, "mapped_output" jsonb, "confidence_score" numeric(5,2) NOT NULL, "processing_time_ms" integer, "ai_provider" character varying NOT NULL, "ai_model_version" character varying, "status" "public"."ai_processing_logs_status_enum" NOT NULL DEFAULT 'pending', "error_message" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" date, "user_id" uuid, "workflow_id" uuid, CONSTRAINT "PK_446ac9d4911ae2813884df46bd2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."submissions_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'draft', 'submitted', 'synced', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "local_id" uuid, "data" jsonb, "metadata" jsonb, "status" "public"."submissions_status_enum" NOT NULL DEFAULT 'pending', "validation_errors" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, "workflow_id" uuid, CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP COLUMN "ai_processing_lod_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD "ai_processing_log_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD "external_connection_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "UQ_fb7f1c80cb4e4bed3ead465e9d7" UNIQUE ("external_connection_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "submission_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_connections" ADD CONSTRAINT "FK_bc0cd053757112756d981cfc132" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_a7435dbb7583938d5e7d1376041" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7" FOREIGN KEY ("external_connection_id") REFERENCES "external_connections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "FK_5bd169100f42d099ccf91a5d104" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "FK_9644d403274de8f8b54b7344e19" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_fca12c4ddd646dea4572c6815a9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_6af18b5348de7fa004c08f73f41" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "submissions" DROP CONSTRAINT "FK_6af18b5348de7fa004c08f73f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" DROP CONSTRAINT "FK_fca12c4ddd646dea4572c6815a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" DROP CONSTRAINT "FK_9644d403274de8f8b54b7344e19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_processing_logs" DROP CONSTRAINT "FK_5bd169100f42d099ccf91a5d104"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_a7435dbb7583938d5e7d1376041"`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_connections" DROP CONSTRAINT "FK_bc0cd053757112756d981cfc132"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "submission_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "UQ_fb7f1c80cb4e4bed3ead465e9d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP COLUMN "external_connection_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP COLUMN "ai_processing_log_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD "ai_processing_lod_id" uuid NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`DROP TYPE "public"."submissions_status_enum"`);
    await queryRunner.query(`DROP TABLE "ai_processing_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."ai_processing_logs_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_processing_logs_processing_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "external_connections"`);
    await queryRunner.query(
      `DROP TYPE "public"."external_connections_type_enum"`,
    );
  }
}
