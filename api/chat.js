// api/chat.js
import { createGithubModels } from '@github/models';
import { generateText } from 'ai';
import { createClient } from '@vercel/postgres';

// Konfigurasi koneksi ke database memori (Supabase)
const sql = createClient({
  connectionString: process.env.DATABASE_URL, // Kita akan atur ini nanti
});

// Koneksi ke GitHub Models
const githubModels = createGithubModels({
  apiKey: process.env.GITHUB_TOKEN, // Kita akan atur ini nanti
});

// Model AI yang akan digunakan (bisa diganti)
const modelName = 'openai/gpt-4o'; // Atau 'meta/meta-llama-3.1-8b-instruct' dll.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sessionId } = req.body; // sessionId untuk membedakan pengguna

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Konek ke database
    await sql.connect();

    // 2. Cari memori yang relevan dari percakapan sebelumnya (sederhana)
    //    Idealnya, ini adalah pencarian vektor, tapi kita sederhanakan dulu.
    const memories = await sql.sql`
      SELECT content FROM memories 
      WHERE session_id = ${sessionId || 'default'} 
      ORDER BY created_at DESC LIMIT 5
    `;

    // 3. Bangun konteks untuk AI
    let context = '';
    if (memories.rowCount > 0) {
      context = 'Percakapan sebelumnya:\n' + memories.rows.map(m => `- ${m.content}`).join('\n');
    }

    // 4. Gabungkan konteks dan pesan baru
    const prompt = context ? `${context}\n\nPesan baru: ${message}` : message;

    // 5. Panggil GitHub Models untuk mendapatkan jawaban
    const { text } = await generateText({
      model: githubModels(modelName),
      prompt: prompt,
    });

    // 6. Simpan pesan dan jawaban sebagai memori baru
    await sql.sql`
      INSERT INTO memories (session_id, role, content) 
      VALUES 
        (${sessionId || 'default'}, 'user', ${message}),
        (${sessionId || 'default'}, 'assistant', ${text})
    `;

    // 7. Kirim jawaban ke pengguna
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  } finally {
    await sql.end(); // Tutup koneksi database
  }
}
