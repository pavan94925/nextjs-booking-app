import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";

// EDIT  slot
export async function PUT(req, { params }) {
  const cookieStore = cookies();
  const userId = (await cookieStore).get('userId')?.value;
  
  console.log('Who is trying to edit:', userId);
  console.log('Which slot they want to edit:', params.id);
  
  if (!userId) {
    return NextResponse.json(
      { message: 'Please login first to edit slots' }, 
      { status: 401 }
    );
  }
  
  const body = await req.json();
  const { date, startTime, endTime, description } = body;
  
  console.log('New data they want to save:', { date, startTime, endTime, description });
  
  try {
    //Make that slot ID is  valid number
    const slotId = parseInt(params.id);
    
    if (isNaN(slotId)) {
      return NextResponse.json(
        { message: 'Slot ID must be a number' }, 
        { status: 400 }
      );
    }
    
    let newStartTime = startTime;
    let newEndTime = endTime;
    if (startTime.includes(':') && startTime.split(':').length === 2) {
      newStartTime = `${startTime}:00`;
    }
    
    if (endTime.includes(':') && endTime.split(':').length === 2) {
      newEndTime = `${endTime}:00`;
    }
    
    console.log('Times after fixing:', { newStartTime, newEndTime });
  
    //Only update slots that belong to this use
    const updateResult = await db
      .update(availability)
      .set({
        date: date,
        startTime: newStartTime,
        endTime: newEndTime,
        description: description,
      })
      .where(
        and(
          eq(availability.id, slotId),              
          eq(availability.userId, Number(userId))  
        )
      );
    
    console.log('Database update result:', updateResult);
    return NextResponse.json(
      { message: 'Your slot has been updated!' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Something went wrong while updating:', error);
    return NextResponse.json(
      { 
        message: 'Failed to update slot', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const cookieStore = cookies();
  const userId = (await cookieStore).get('userId')?.value;
  
  console.log('Who wants to delete:', userId);
  console.log('Which slot they want to delete:', params.id);
  
  if (!userId) {
    return NextResponse.json(
      { message: 'Please login first to delete slots' }, 
      { status: 401 }
    );
  }
  
  try {
    
    const slotId = parseInt(params.id);
    
    if (isNaN(slotId)) {
      return NextResponse.json(
        { message: 'Slot ID must be a number' }, 
        { status: 400 }
      );
    }
    
    const deleteResult = await db
      .delete(availability)
      .where(
        and(
          eq(availability.id, slotId),              
          eq(availability.userId, Number(userId))   
        )
      );
    
    console.log('Database delete result:', deleteResult);
  
    return NextResponse.json(
      { message: 'Your slot has been deleted!' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Something went wrong while deleting:', error);
    return NextResponse.json(
      { 
        message: 'Failed to delete slot', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}