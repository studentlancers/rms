// src/app/dashboard/[slug]/menu/page.tsx
// Server component — fetches real menu data and passes it to the client shell.

import { listCategories } from "@/actions/menu";
import MenuClient from "./menu-client";

export default async function MenuPage() {
  const initialCategories = await listCategories();

  return <MenuClient initialCategories={initialCategories} />;
}
