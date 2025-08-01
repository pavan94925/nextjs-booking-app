

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
  const loginToken = cookieStore.get("token")?.value;
  

  if (!loginToken) {
    return null; 
  }
  try { 
    const userInfo = jwt.verify(loginToken, process.env.JWT_SECRET!) as SessionPayload;
    return userInfo;
  } catch (error) {
   
    console.error("Login token is invalid:", error);
    return null; 
  }
}