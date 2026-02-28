import { createClient } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    // Koneksi ke database
    const sql = createClient({ connectionString: process.env.DATABASE_URL });
    await sql.connect();

    // Simpan pesan user ke database sebagai memori baru
    await sql.sql`
      INSERT INTO memories (session_id, role, content) 
      VALUES (${sessionId || 'default'}, 'user', ${message})
    `;

    await sql.end();
    return NextResponse.json({ reply: `Pesan '${message}' telah diterima dan disimpan.` });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Gagal terhubung ke database', detail: error.message },
      { status: 500 }
    );
  }
}