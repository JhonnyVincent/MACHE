import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260926100415 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_payout_freeze" ("id" text not null, "seller_id" text not null, "reason" text not null, "frozen_by" text null, "active" boolean not null default true, "lifted_by" text null, "lifted_reason" text null, "lifted_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_payout_freeze_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_payout_freeze_seller_id" ON "mache_payout_freeze" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_payout_freeze_deleted_at" ON "mache_payout_freeze" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_payout_freeze" cascade;`);
  }

}
