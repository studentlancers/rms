import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";

async function test() {
  console.log("Testing full staff creation logic...");

  const ownerEmail = "owner@test.com";
  const staffEmail = "staff.test.001@gmail.com";
  const password = "Test@12345";
  const role = "staff";

  // 1. Clean up test staff if already exists
  const existingStaff = await db.user.findUnique({ where: { email: staffEmail } });
  if (existingStaff) {
    await db.member.deleteMany({ where: { userId: existingStaff.id } });
    await db.account.deleteMany({ where: { userId: existingStaff.id } });
    await db.user.delete({ where: { id: existingStaff.id } });
    console.log("Cleaned up existing test staff user.");
  }

  // 2. Get owner org
  const owner = await db.user.findUnique({
    where: { email: ownerEmail },
    include: { members: { include: { organization: true } } },
  });

  let restaurantId = owner?.members[0]?.organizationId;
  if (!restaurantId) {
    const firstOrg = await db.organization.findFirst();
    restaurantId = firstOrg?.id;
  }

  console.log("Owner organizationId:", restaurantId);
  if (!restaurantId) {
    throw new Error("No organization found in database!");
  }

  // 3. Create staff user via Better Auth signUpEmail
  console.log("Creating user via auth.api.signUpEmail...");
  const signUpRes = await auth.api.signUpEmail({
    body: {
      name: "Test Staff",
      email: staffEmail,
      password: password,
    },
  });

  console.log("signUpEmail response user:", signUpRes.user);

  // 4. Link member to organization
  const member = await db.member.create({
    data: {
      id: "mem_" + Math.random().toString(36).substring(2, 12),
      organizationId: restaurantId,
      userId: signUpRes.user.id,
      role: role,
    },
  });

  console.log("Created member link:", member);

  // 5. Verify database relationship
  const verifyUser = await db.user.findUnique({
    where: { email: staffEmail },
    include: {
      accounts: true,
      members: { include: { organization: true } },
    },
  });

  console.log("VERIFIED DB RECORD:");
  console.log("User email:", verifyUser?.email);
  console.log("Account providerId:", verifyUser?.accounts[0]?.providerId);
  console.log("Has password hash:", !!verifyUser?.accounts[0]?.password);
  console.log("Member role:", verifyUser?.members[0]?.role);
  console.log("Member org id:", verifyUser?.members[0]?.organizationId);
  console.log("Member org name:", verifyUser?.members[0]?.organization?.name);
}

test().catch(console.error);
