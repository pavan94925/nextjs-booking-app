// src/lib/getUserSession.ts
// This file helps us check if someone is logged in

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// What we get back when we decode a login token
type SessionPayload = {
  userId: string;   // User's unique ID number
  email: string;    // User's email address
  iat: number;      // When token was created (ignore this)
  exp: number;      // When token expires (ignore this)
};

// Main function: Check if user is logged in and get their info
export async function getUserSession(): Promise<SessionPayload | null> {
  
  // Step 1: Look for login token in browser cookies
  const cookieStore = await cookies();
  const loginToken = cookieStore.get("token")?.value;
  
  // Step 2: If no token found, user is not logged in
  if (!loginToken) {
    return null; // Return nothing = not logged in
  }
  
  try {
    // Step 3: Try to decode the token to get user information
    const userInfo = jwt.verify(loginToken, process.env.JWT_SECRET!) as SessionPayload;
    
    // Step 4: Token is valid, return user info
    return userInfo;
    
  } catch (error) {
    // Step 5: Token is broken, expired, or fake
    console.error("Login token is invalid:", error);
    return null; // Return nothing = not logged in
  }
}