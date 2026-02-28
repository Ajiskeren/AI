// app/api/chat/route.js
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Inisialisasi koneksi ke GitHub Models (OpenAI-compatible endpoint)
const githubModels = createOpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN,
});

// Pilih model yang tersedia di GitHub Models, misal: 'gpt-4o', 'Meta-Llama-3.1-8B-Instruct', dll.
const modelName = 'gpt-4o';

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Koneksi ke database Supabase (gunakan @vercel/postgres)
    const sql = createClient({
      connectionString: process.env.DATABASE_URL,
    });
    await sql.connect();

    // Ambil 5 memori terakhir untuk sesi ini (pencarian sederhana)
    const memories = await sql.sql`
      SELECT content FROM memories 
      WHERE session_id = ${sessionId || 'default'} 
      ORDER BY created_at DESC LIMIT 5
    `;

    // Bangun konteks dari memori
    let context = '';
    if (memories.rowCount > 0) {
      context = 'Percakapan sebelumnya:\n' + memories.rows.map(m => `- ${m.content}`).join('\n');
    }

    const prompt = context ? `${context}\n\nPesan baru: ${message}` : message;

    // Panggil GitHub Models untuk mendapatkan jawaban
    const { text } = await generateText({
      model: githubModels(modelName),
      prompt: prompt,
    });

    // Simpan pesan user dan jawaban AI ke database sebagai memori baru
    await sql.sql`
      INSERT INTO memories (session_id, role, content) 
      VALUES 
        (${sessionId || 'default'}, 'user', ${message}),
        (${sessionId || 'default'}, 'assistant', ${text})
    `;

    await sql.end(); // Tutup koneksi

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
