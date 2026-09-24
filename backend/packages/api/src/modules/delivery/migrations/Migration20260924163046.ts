import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260924163046 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mache_relay_point" drop constraint if exists "mache_relay_point_code_unique";`);
    this.addSql(`create table if not exists "mache_delivery" ("id" text not null, "display_id" serial, "order_id" text not null, "seller_id" text not null, "customer_id" text null, "access_token" text not null, "method" text check ("method" in ('seller', 'agent', 'relay', 'carrier')) not null, "agent_customer_id" text null, "relay_point_id" text null, "carrier_name" text null, "tracking_number" text null, "tracking_url" text null, "recipient_name" text null, "recipient_phone" text null, "recipient_address" text null, "recipient_department" text null, "code" text not null, "code_attempts" integer not null default 0, "status" text check ("status" in ('pending', 'assigned', 'in_transit', 'ready_for_pickup', 'delivered', 'failed', 'cancelled')) not null default 'pending', "confirmed_by" text check ("confirmed_by" in ('seller', 'agent', 'customer', 'admin')) null, "confirmed_at" timestamptz null, "confirmation_note" text null, "failure_reason" text null, "payout_state" text check ("payout_state" in ('held', 'releasable', 'released')) not null default 'held', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_delivery_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_delivery_order_id" ON "mache_delivery" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_delivery_seller_id" ON "mache_delivery" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_delivery_agent_customer_id" ON "mache_delivery" ("agent_customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_delivery_relay_point_id" ON "mache_delivery" ("relay_point_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_delivery_deleted_at" ON "mache_delivery" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "mache_relay_point" ("id" text not null, "name" text not null, "code" text not null, "department" text not null, "commune" text null, "address" text not null, "landmark" text null, "phone_public" text null, "opening_hours" text null, "agent_customer_id" text null, "active" boolean not null default true, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_relay_point_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mache_relay_point_code_unique" ON "mache_relay_point" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_relay_point_department" ON "mache_relay_point" ("department") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_relay_point_agent_customer_id" ON "mache_relay_point" ("agent_customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_relay_point_deleted_at" ON "mache_relay_point" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_delivery" cascade;`);

    this.addSql(`drop table if exists "mache_relay_point" cascade;`);
  }

}
