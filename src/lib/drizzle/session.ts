import { cookies } from "next/headers";

// Set userid cookie
export async function setUserSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("userId", userId);
}

// Get userid from cookie
export async function getUserSession() {
  const cookieStore = await cookies();
  return cookieStore.get("userId")?.value;
}
