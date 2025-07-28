import { cookies } from "next/headers";

// Set userId cookie
export async function setUserSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("userId", userId);
}

// Get userId from cookie
export async function getUserSession() {
  const cookieStore = await cookies();
  return cookieStore.get("userId")?.value;
}
