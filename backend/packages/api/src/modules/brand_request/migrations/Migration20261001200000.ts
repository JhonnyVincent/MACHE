import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261001200000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_brand_request" ("id" text not null, "brand_seller_id" text not null, "reseller_seller_id" text not null, "product_id" text not null, "product_title" text not null, "message" text null, "status" text check ("status" in ('pending', 'approved', 'declined')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_brand_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_brand_request_brand_seller_id" ON "mache_brand_request" ("brand_seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_brand_request_reseller_seller_id" ON "mache_brand_request" ("reseller_seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_brand_request_deleted_at" ON "mache_brand_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_brand_request" cascade;`);
  }

}
