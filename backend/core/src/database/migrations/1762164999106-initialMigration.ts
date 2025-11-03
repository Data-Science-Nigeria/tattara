import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1762164999106 implements MigrationInterface {
  name = 'InitialMigration1762164999106';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."external_connections_type_enum" AS ENUM('dhis2', 'postgres')`,
    );
    await queryRunner.query(
      `CREATE TABLE "external_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "type" "public"."external_connections_type_enum" NOT NULL, "configuration" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_tested_at" TIMESTAMP, "test_result" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "UQ_8e9f9024415b46763c40e4cafc6" UNIQUE ("created_by", "name"), CONSTRAINT "PK_bd94546e05c28648ee2bad611f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "is_email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying, "reset_password_token" character varying, "reset_password_expires" TIMESTAMP, "force_password_reset" boolean NOT NULL DEFAULT false, "is_first_login" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "resource" character varying NOT NULL, "action" character varying NOT NULL, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."field_mappings_target_type_enum" AS ENUM('dhis2', 'postgres')`,
    );
    await queryRunner.query(
      `CREATE TABLE "field_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "target_type" "public"."field_mappings_target_type_enum" NOT NULL DEFAULT 'dhis2', "target" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "workflow_id" uuid, "workflow_field_id" uuid, "created_by_id" uuid, CONSTRAINT "UQ_5e904bfe200aa4abb536ba76fff" UNIQUE ("workflow_id", "workflow_field_id", "target_type"), CONSTRAINT "PK_0a8b5aee97dcbb141f26bfead15" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submission_id" uuid, "ai_processing_log_id" uuid, "original_filename" character varying NOT NULL, "file_type" character varying, "mimetype" character varying, "file_size" integer NOT NULL, "key" character varying, "storage_path" character varying, "storage_provider" character varying, "checksum" character varying, "metadata" jsonb, "is_processed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "created_by_id" uuid, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_fields_field_type_enum" AS ENUM('text', 'number', 'date', 'datetime', 'select', 'multiselect', 'boolean', 'email', 'phone', 'url', 'textarea')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workflow_fields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "field_name" character varying NOT NULL, "label" character varying NOT NULL, "field_type" "public"."workflow_fields_field_type_enum" NOT NULL DEFAULT 'text', "options" text array, "is_required" boolean NOT NULL DEFAULT false, "validation_rules" jsonb, "ai_mapping" jsonb, "display_order" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "workflow_id" uuid, "created_by_id" uuid, CONSTRAINT "PK_8497e53a958c93e4b7e896a802d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_configurations_type_enum" AS ENUM('dhis2', 'postgres')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workflow_configurations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."workflow_configurations_type_enum" NOT NULL DEFAULT 'dhis2', "configuration" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "workflow_id" uuid, "external_connection_id" uuid, "created_by_id" uuid, CONSTRAINT "PK_be15def602b29e81e73dd85a721" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_processing_logs_processing_type_enum" AS ENUM('audio', 'text', 'image')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_processing_logs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_processing_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "processing_type" "public"."ai_processing_logs_processing_type_enum", "input_file_ids" uuid array NOT NULL DEFAULT '{}', "form_schema" jsonb, "input_text" text, "mapped_output" jsonb, "confidence_score" numeric(5,2), "processing_time_ms" numeric(5,2), "ai_provider" character varying, "ai_model_version" character varying, "status" "public"."ai_processing_logs_status_enum" NOT NULL DEFAULT 'pending', "error_message" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" date, "user_id" uuid, "workflow_id" uuid, CONSTRAINT "PK_446ac9d4911ae2813884df46bd2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."submissions_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'draft', 'submitted', 'synced', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "local_id" uuid, "data" jsonb, "metadata" jsonb, "status" "public"."submissions_status_enum" NOT NULL DEFAULT 'pending', "validation_errors" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, "workflow_id" uuid, CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "programs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" uuid, CONSTRAINT "UQ_2aa65f5bdeb56be504334e040cc" UNIQUE ("created_by_id", "name"), CONSTRAINT "PK_d43c664bcaafc0e8a06dfd34e05" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflows_status_enum" AS ENUM('active', 'inactive', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflows_enabled_modes_enum" AS ENUM('audio', 'text', 'form', 'image')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workflows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "status" "public"."workflows_status_enum" NOT NULL DEFAULT 'active', "supported_languages" text array NOT NULL DEFAULT '{}', "enabled_modes" "public"."workflows_enabled_modes_enum" array NOT NULL DEFAULT '{text}', "version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "program_id" uuid, "created_by_id" uuid, CONSTRAINT "UQ_d3b3da0f8a78b7248618f657139" UNIQUE ("created_by_id", "name"), CONSTRAINT "PK_5b5757cc1cd86268019fef52e0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_programs" ("user_id" uuid NOT NULL, "program_id" uuid NOT NULL, CONSTRAINT "PK_0516782665f5f4b7376c58c1289" PRIMARY KEY ("user_id", "program_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b122692056ea2a51c7c11c014b" ON "user_programs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64c67a08a39440a318a005fbae" ON "user_programs" ("program_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_workflow_assignments" ("user_id" uuid NOT NULL, "workflow_id" uuid NOT NULL, CONSTRAINT "PK_bfef43b9027784c1ebcfe564fa6" PRIMARY KEY ("user_id", "workflow_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51936723a4af77bf547f9b1509" ON "user_workflow_assignments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e464ab5b378deb088ab118f103" ON "user_workflow_assignments" ("workflow_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "external_connections" ADD CONSTRAINT "FK_bc0cd053757112756d981cfc132" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD CONSTRAINT "FK_031818b261ae90772335c63c883" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD CONSTRAINT "FK_d8748bb115975316f69c7ed288b" FOREIGN KEY ("workflow_field_id") REFERENCES "workflow_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD CONSTRAINT "FK_a3ac24401afa538b48c002a5c4d" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_a7435dbb7583938d5e7d1376041" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_56bb34e9a86bf782fef80d8a868" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" ADD CONSTRAINT "FK_7cca08a12864d7e81e7443f0877" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" ADD CONSTRAINT "FK_1b3497248cd3b3141e993cad054" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_8625c9ad071151e72f3b3066d17" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7" FOREIGN KEY ("external_connection_id") REFERENCES "external_connections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ADD CONSTRAINT "FK_1a6c5181db86434c6ac19fdfdd0" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "programs" ADD CONSTRAINT "FK_b44b72ef368c7a57f4777d81b0f" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflows" ADD CONSTRAINT "FK_2d772a49df9b7e108fbbbdb68da" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflows" ADD CONSTRAINT "FK_2efdcd3dd18adce22519bb09e66" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" ADD CONSTRAINT "FK_b122692056ea2a51c7c11c014b4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" ADD CONSTRAINT "FK_64c67a08a39440a318a005fbaea" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_workflow_assignments" ADD CONSTRAINT "FK_51936723a4af77bf547f9b15095" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_workflow_assignments" ADD CONSTRAINT "FK_e464ab5b378deb088ab118f103a" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_workflow_assignments" DROP CONSTRAINT "FK_e464ab5b378deb088ab118f103a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_workflow_assignments" DROP CONSTRAINT "FK_51936723a4af77bf547f9b15095"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" DROP CONSTRAINT "FK_64c67a08a39440a318a005fbaea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_programs" DROP CONSTRAINT "FK_b122692056ea2a51c7c11c014b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflows" DROP CONSTRAINT "FK_2efdcd3dd18adce22519bb09e66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflows" DROP CONSTRAINT "FK_2d772a49df9b7e108fbbbdb68da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "programs" DROP CONSTRAINT "FK_b44b72ef368c7a57f4777d81b0f"`,
    );
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
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_1a6c5181db86434c6ac19fdfdd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_fb7f1c80cb4e4bed3ead465e9d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" DROP CONSTRAINT "FK_8625c9ad071151e72f3b3066d17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" DROP CONSTRAINT "FK_1b3497248cd3b3141e993cad054"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_fields" DROP CONSTRAINT "FK_7cca08a12864d7e81e7443f0877"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_56bb34e9a86bf782fef80d8a868"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_a7435dbb7583938d5e7d1376041"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP CONSTRAINT "FK_a3ac24401afa538b48c002a5c4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP CONSTRAINT "FK_d8748bb115975316f69c7ed288b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP CONSTRAINT "FK_031818b261ae90772335c63c883"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806"`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_connections" DROP CONSTRAINT "FK_bc0cd053757112756d981cfc132"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`,
    );
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e464ab5b378deb088ab118f103"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_51936723a4af77bf547f9b1509"`,
    );
    await queryRunner.query(`DROP TABLE "user_workflow_assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64c67a08a39440a318a005fbae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b122692056ea2a51c7c11c014b"`,
    );
    await queryRunner.query(`DROP TABLE "user_programs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "workflows"`);
    await queryRunner.query(
      `DROP TYPE "public"."workflows_enabled_modes_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflows_status_enum"`);
    await queryRunner.query(`DROP TABLE "programs"`);
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`DROP TYPE "public"."submissions_status_enum"`);
    await queryRunner.query(`DROP TABLE "ai_processing_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."ai_processing_logs_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_processing_logs_processing_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "workflow_configurations"`);
    await queryRunner.query(
      `DROP TYPE "public"."workflow_configurations_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "workflow_fields"`);
    await queryRunner.query(
      `DROP TYPE "public"."workflow_fields_field_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TABLE "field_mappings"`);
    await queryRunner.query(
      `DROP TYPE "public"."field_mappings_target_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "external_connections"`);
    await queryRunner.query(
      `DROP TYPE "public"."external_connections_type_enum"`,
    );
  }
}
