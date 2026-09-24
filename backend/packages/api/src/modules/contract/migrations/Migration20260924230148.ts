import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260924230148 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mache_policy" ("id" text not null, "display_id" serial, "slug" text not null, "title" text not null, "summary" text null, "body" text not null, "version" integer not null default 1, "content_hash" text null, "status" text check ("status" in ('draft', 'live', 'archived')) not null default 'draft', "published_at" timestamptz null, "published_by" text null, "created_by" text null, "change_note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mache_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_policy_slug" ON "mache_policy" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mache_policy_deleted_at" ON "mache_policy" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mache_policy" cascade;`);
  }

}
