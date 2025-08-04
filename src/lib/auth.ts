import { SignJWT } from 'jose'
import { NextResponse } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function POST() {
  const token = await new SignJWT({ userId: '123' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  const response = NextResponse.json({ success: true })
  response.cookies.set('userId', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
