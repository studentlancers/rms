// scripts/make-super-admin.ts
// Command-line script to securely promote a user to super_admin role.
//
// Usage: npx tsx scripts/make-super-admin.ts user@example.com

import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: npx tsx scripts/make-super-admin.ts <user-email>");
    process.exit(1);
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`Error: User with email "${email}" not found.`);
    process.exit(1);
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { role: "super_admin" },
  });

  console.log(`Success! User "${updated.name}" (${updated.email}) is now a Super Admin (role: "${updated.role}").`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error promoting user to super_admin:", err);
  process.exit(1);
});
