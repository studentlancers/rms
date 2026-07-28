"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Notifications are accessible via top header bell icon dropdown
    router.replace("/");
  }, [router]);

  return null;
}
