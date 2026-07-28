// src/lib/permissions.ts
// Access control definition for Better Auth Organization plugin.
// Separate lightweight file to allow sharing between auth.ts (server) and auth-client.ts (client).

import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete", "read"],
  invitation: ["create", "cancel", "read"],
  menu: ["create", "update", "delete", "read", "toggle"],
  order: ["create", "update", "read", "cancel"],
  delivery: ["assign", "update", "read"],
  table: ["create", "update", "delete", "read"],
  reservation: ["create", "update", "read"],
  analytics: ["read"],
  settings: ["update", "read"],
} as const;

export const ac = createAccessControl(statement);

export const ownerRole = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete", "read"],
  invitation: ["create", "cancel", "read"],
  menu: ["create", "update", "delete", "read", "toggle"],
  order: ["create", "update", "read", "cancel"],
  delivery: ["assign", "update", "read"],
  table: ["create", "update", "delete", "read"],
  reservation: ["create", "update", "read"],
  analytics: ["read"],
  settings: ["update", "read"],
});

export const adminRole = ac.newRole({
  member: ["read"],
  invitation: ["create", "cancel", "read"],
  menu: ["create", "update", "delete", "read", "toggle"],
  order: ["create", "update", "read", "cancel"],
  delivery: ["assign", "update", "read"],
  table: ["create", "update", "read"],
  reservation: ["create", "update", "read"],
});

export const staffRole = ac.newRole({
  menu: ["read", "toggle"],
  order: ["create", "update", "read"],
  delivery: ["update", "read"],
  table: ["update", "read"],
  reservation: ["create", "update", "read"],
});

export const memberRole = staffRole;

export const roles = {
  owner: ownerRole,
  admin: adminRole,
  staff: staffRole,
  member: memberRole,
};
