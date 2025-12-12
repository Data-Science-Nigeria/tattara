import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntegrationtypeEnumsV21765477989321 implements MigrationInterface {
  name = 'IntegrationtypeEnumsV21765477989321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."external_connections_type_enum" RENAME TO "external_connections_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."external_connections_type_enum" AS ENUM('dhis2', 'postgres', 'mysql', 'sqlite', 'mssql', 'oracle', 'sql')`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_connections" ALTER COLUMN "type" TYPE "public"."external_connections_type_enum" USING "type"::"text"::"public"."external_connections_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."external_connections_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP CONSTRAINT "UQ_5e904bfe200aa4abb536ba76fff"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."field_mappings_target_type_enum" RENAME TO "field_mappings_target_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."field_mappings_target_type_enum" AS ENUM('dhis2', 'postgres', 'mysql', 'sqlite', 'mssql', 'oracle', 'sql')`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ALTER COLUMN "target_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ALTER COLUMN "target_type" TYPE "public"."field_mappings_target_type_enum" USING "target_type"::"text"::"public"."field_mappings_target_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ALTER COLUMN "target_type" SET DEFAULT 'dhis2'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."field_mappings_target_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_configurations_type_enum" RENAME TO "workflow_configurations_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_configurations_type_enum" AS ENUM('dhis2', 'postgres', 'mysql', 'sqlite', 'mssql', 'oracle', 'sql')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ALTER COLUMN "type" TYPE "public"."workflow_configurations_type_enum" USING "type"::"text"::"public"."workflow_configurations_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ALTER COLUMN "type" SET DEFAULT 'dhis2'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workflow_configurations_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD CONSTRAINT "UQ_5e904bfe200aa4abb536ba76fff" UNIQUE ("workflow_id", "workflow_field_id", "target_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "field_mappings" DROP CONSTRAINT "UQ_5e904bfe200aa4abb536ba76fff"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_configurations_type_enum_old" AS ENUM('dhis2', 'postgres', 'sql')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ALTER COLUMN "type" TYPE "public"."workflow_configurations_type_enum_old" USING "type"::"text"::"public"."workflow_configurations_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_configurations" ALTER COLUMN "type" SET DEFAULT 'dhis2'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workflow_configurations_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_configurations_type_enum_old" RENAME TO "workflow_configurations_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."field_mappings_target_type_enum_old" AS ENUM('dhis2', 'postgres', 'sql')`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ALTER COLUMN "target_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ALTER COLUMN "target_type" TYPE "public"."field_mappings_target_type_enum_old" USING "target_type"::"text"::"public"."field_mappings_target_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ALTER COLUMN "target_type" SET DEFAULT 'dhis2'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."field_mappings_target_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."field_mappings_target_type_enum_old" RENAME TO "field_mappings_target_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_mappings" ADD CONSTRAINT "UQ_5e904bfe200aa4abb536ba76fff" UNIQUE ("target_type", "workflow_id", "workflow_field_id")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."external_connections_type_enum_old" AS ENUM('dhis2', 'postgres', 'sql')`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_connections" ALTER COLUMN "type" TYPE "public"."external_connections_type_enum_old" USING "type"::"text"::"public"."external_connections_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."external_connections_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."external_connections_type_enum_old" RENAME TO "external_connections_type_enum"`,
    );
  }
}
