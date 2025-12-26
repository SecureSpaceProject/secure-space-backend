import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnForSecretKey1766766844007 implements MigrationInterface {
    name = 'AddColumnForSecretKey1766766844007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensors" ADD "device_secret_hash" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "device_secret_hash"`);
    }

}
