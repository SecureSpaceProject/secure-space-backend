import { MigrationInterface, QueryRunner } from "typeorm";

export class Events1766759426396 implements MigrationInterface {
    name = 'Events1766759426396'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP CONSTRAINT "FK_06df8ac59586c5e3dec380507d3"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP COLUMN "triggered"`);
        await queryRunner.query(`ALTER TABLE "sensors" DROP COLUMN "state"`);
        await queryRunner.query(`DROP TYPE "public"."sensors_state_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."sensor_events_state_enum" AS ENUM('OPEN', 'CLOSED')`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD "state" "public"."sensor_events_state_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."sensor_events_eventtype_enum" AS ENUM('MOTION', 'OPEN')`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD "eventType" "public"."sensor_events_eventtype_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP COLUMN "room_id"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD "room_id" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP COLUMN "room_id"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD "room_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP COLUMN "eventType"`);
        await queryRunner.query(`DROP TYPE "public"."sensor_events_eventtype_enum"`);
        await queryRunner.query(`ALTER TABLE "sensor_events" DROP COLUMN "state"`);
        await queryRunner.query(`DROP TYPE "public"."sensor_events_state_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."sensors_state_enum" AS ENUM('OPEN', 'CLOSED')`);
        await queryRunner.query(`ALTER TABLE "sensors" ADD "state" "public"."sensors_state_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD "triggered" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "sensor_events" ADD CONSTRAINT "FK_06df8ac59586c5e3dec380507d3" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
