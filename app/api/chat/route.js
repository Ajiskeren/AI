// app/api/chat/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'API berfungsi!' });
}