import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNullableToSenEv1766762555669 implements MigrationInterface {
    name = 'AddNullableToSenEv1766762555669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_events" ALTER COLUMN "state" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_events" ALTER COLUMN "state" SET NOT NULL`);
    }

}
