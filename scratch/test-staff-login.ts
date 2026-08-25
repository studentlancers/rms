import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";

async function test() {
  console.log("Testing Staff direct login via Better Auth...");

  const staffEmail = "staff.test.001@gmail.com";
  const password = "Test@12345";

  // 1. Perform server-side signInEmail simulation or test endpoint
  const signInRes = await auth.api.signInEmail({
    body: {
      email: staffEmail,
      password: password,
    },
  });

  console.log("signInEmail result:", signInRes);

  // 2. Fetch session and member role
  const user = await db.user.findUnique({
    where: { email: staffEmail },
    include: {
      members: {
        include: { organization: true },
      },
    },
  });

  console.log("Resolved user email:", user?.email);
  console.log("Resolved user active member role:", user?.members[0]?.role);
  console.log("Resolved user organization slug:", user?.members[0]?.organization?.slug);
  console.log("Resolved user organization id:", user?.members[0]?.organizationId);
}

test().catch(console.error);
