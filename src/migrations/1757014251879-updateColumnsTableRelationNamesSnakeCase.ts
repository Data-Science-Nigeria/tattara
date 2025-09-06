import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnsTableRelationNamesSnakeCase1757014251879
  implements MigrationInterface
{
  name = 'UpdateColumnsTableRelationNamesSnakeCase1757014251879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old foreign key first
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52"`,
    );

    // Add new columns (nullable or with defaults to avoid errors)
    await queryRunner.query(
      `ALTER TABLE "users" ADD "first_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_email_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_verification_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "reset_password_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "reset_password_expires" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "force_password_reset" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_first_login" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_login_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "created_by_id" uuid`);

    // COPY DATA FROM OLD COLUMNS TO NEW COLUMNS
    await queryRunner.query(`UPDATE "users" SET "first_name" = "firstName"`);
    await queryRunner.query(`UPDATE "users" SET "last_name" = "lastName"`);
    await queryRunner.query(
      `UPDATE "users" SET "is_email_verified" = "isEmailVerified"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "email_verification_token" = "emailVerificationToken"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "reset_password_token" = "resetPasswordToken"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "reset_password_expires" = "resetPasswordExpires"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "force_password_reset" = "forcePasswordReset"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "is_first_login" = "isFirstLogin"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "last_login_at" = "lastLoginAt"`,
    );
    await queryRunner.query(`UPDATE "users" SET "created_at" = "createdAt"`);
    await queryRunner.query(`UPDATE "users" SET "updated_at" = "updatedAt"`);
    await queryRunner.query(
      `UPDATE "users" SET "created_by_id" = "createdById"`,
    );

    // Recreate foreign key
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Drop old columns at the end
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "resetPasswordExpires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "forcePasswordReset"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isFirstLogin"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdById"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new foreign key
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806"`,
    );

    // Recreate old columns
    await queryRunner.query(`ALTER TABLE "users" ADD "createdById" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isFirstLogin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "forcePasswordReset" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetPasswordExpires" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetPasswordToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "firstName" character varying`,
    );

    // COPY DATA BACK FROM NEW COLUMNS TO OLD COLUMNS
    await queryRunner.query(`UPDATE "users" SET "firstName" = "first_name"`);
    await queryRunner.query(`UPDATE "users" SET "lastName" = "last_name"`);
    await queryRunner.query(
      `UPDATE "users" SET "isEmailVerified" = "is_email_verified"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "emailVerificationToken" = "email_verification_token"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "resetPasswordToken" = "reset_password_token"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "resetPasswordExpires" = "reset_password_expires"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "forcePasswordReset" = "force_password_reset"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "isFirstLogin" = "is_first_login"`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "lastLoginAt" = "last_login_at"`,
    );
    await queryRunner.query(`UPDATE "users" SET "createdAt" = "created_at"`);
    await queryRunner.query(`UPDATE "users" SET "updatedAt" = "updated_at"`);
    await queryRunner.query(
      `UPDATE "users" SET "createdById" = "created_by_id"`,
    );

    // Recreate old foreign key
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Drop new columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_first_login"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "force_password_reset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "reset_password_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "reset_password_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "email_verification_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "is_email_verified"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
  }
}
