// src/app/api/auth/[...all]/route.ts
// Better Auth catch-all handler.
// All Better Auth endpoints (sign-in, sign-up, session, organization, etc.)
// are handled here. Do not add any custom logic — Better Auth manages it all.

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
