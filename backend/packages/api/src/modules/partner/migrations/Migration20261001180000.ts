import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261001180000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_partner" ("id" text not null, "slug" text not null, "name" text not null, "category" text not null, "description" text null, "location" text null, "logo" text null, "banner" text null, "website" text null, "whatsapp" text null, "phone" text null, "facebook" text null, "instagram" text null, "contact_name" text null, "contact_email" text not null, "status" text check ("status" in ('pending', 'approved', 'suspended', 'banned')) not null default 'pending', "status_reason" text null, "source" text check ("source" in ('self', 'admin')) not null default 'self', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_partner_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mache_partner_slug_unique" ON "mache_partner" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_partner_contact_email" ON "mache_partner" ("contact_email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_partner_deleted_at" ON "mache_partner" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_partner" cascade;`);
  }

}
