import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";

async function test() {
  console.log("Testing user creation via auth.api.signUpEmail...");

  const testEmail = "staff.test.scratch@gmail.com";
  
  // Clean up if exists
  await db.member.deleteMany({ where: { user: { email: testEmail } } });
  await db.account.deleteMany({ where: { user: { email: testEmail } } });
  await db.user.deleteMany({ where: { email: testEmail } });

  const res = await auth.api.signUpEmail({
    body: {
      name: "Test Staff Scratch",
      email: testEmail,
      password: "TestPassword123!",
    },
  });

  console.log("signUpEmail result:", res);

  const createdUser = await db.user.findUnique({
    where: { email: testEmail },
    include: { accounts: true },
  });

  console.log("Created user in DB:", createdUser);
}

test().catch(console.error);
