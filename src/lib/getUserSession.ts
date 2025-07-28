// src/lib/getUserSession.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SessionPayload = {
  userId: string;
  email: string;
  iat: number;
  exp: number;
};

export async function getUserSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SessionPayload;
    return decoded;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}
