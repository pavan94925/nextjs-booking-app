// src/actions/availabilityActions.ts
import { db } from "@/lib/drizzle/db";
import { availability  } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function saveAvailability(userId: number, date: string, startTime: string, endTime: string,description:string) {
  const inserted = await db.insert(availability ).values({
    userId,
    availableDate: date,
    startTime,
    endTime,
    description
  });
  return inserted;
}
