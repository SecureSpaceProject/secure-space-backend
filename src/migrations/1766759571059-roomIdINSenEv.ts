import { MigrationInterface, QueryRunner } from "typeorm";

export class RoomIdINSenEv1766759571059 implements MigrationInterface {
    name = 'RoomIdINSenEv1766759571059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP COLUMN "room_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD "room_id" character varying NOT NULL`);
    }

}
