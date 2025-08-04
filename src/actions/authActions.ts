"use server";

import { db } from "@/lib/drizzle/db";
import { user_profiles } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setUserSession } from "@/lib/drizzle/session";

export async function registerUser(form: {
  full_name: string;
  email: string;
  password: string;
}) {
  const email = form.email.toLowerCase();

  const existingUser = await db
    .select()
    .from(user_profiles)
    .where(eq(user_profiles.email, email));

  console.log(" Existing user check:", existingUser);

  if (existingUser.length > 0) {
    console.log(" Email already registered");
    return { error: "Email already registered" };
  }

  const hashedPassword = await bcrypt.hash(form.password, 10);

  await db.insert(user_profiles).values({
    full_name: form.full_name,
    email,
    password: hashedPassword,
  });

  console.log(" User registered successfully");
  
  return { success: true };
}

export async function loginUser(form: {
  email: string;
  password: string;
}) {
  const email = form.email.toLowerCase();

  const foundUser = await db
    .select()
    .from(user_profiles)
    .where(eq(user_profiles.email, email));

  if (foundUser.length === 0) {
    console.log(" User not found");
    return { success: false, message: "User not found" };
  }

  const isMatch = await bcrypt.compare(
    form.password,
    foundUser[0].password || ""
  );

  if (!isMatch) {
    console.log(" Wrong password");
    return { success: false, message: "Wrong password" };
  }

  console.log(" Login successful!", foundUser[0]);

  await setUserSession(String(foundUser[0].id));
  
  return {
    success: true,
    message: "Login successful",
    user: {
      id: foundUser[0].id,
      full_name: foundUser[0].full_name,
      email: foundUser[0].email,
    },
  };
}

export async function resetPassword(email: string, newPassword: string) {
  const user = await db
    .select()
    .from(user_profiles)
    .where(eq(user_profiles.email, email))
    .then(res => res[0]);

  if (!user)
    return { error: "No account with that email" };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(user_profiles)
    .set({ password: hashedPassword })
    .where(eq(user_profiles.email, email));

  return { success: true };
}