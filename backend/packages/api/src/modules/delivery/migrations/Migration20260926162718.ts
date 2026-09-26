import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260926162718 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mache_delivery" add column if not exists "customer_confirmed_at" timestamptz null, add column if not exists "payout_due_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "mache_delivery" drop column if exists "customer_confirmed_at", drop column if exists "payout_due_at";`);
  }

}
