// app/page.js
'use client';
import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const updatedHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(updatedHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          sessionId: 'user-123' // ganti dengan ID unik jika perlu
        }),
      });

      const data = await response.json();
      setChatHistory([...updatedHistory, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🤖 Axis AI</h1>
      <div style={styles.chatBox}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
            <strong>{msg.role === 'user' ? 'Kamu:' : 'Axis:'}</strong> {msg.content}
          </div>
        ))}
        {isLoading && <div style={styles.aiMsg}>Axis sedang mengetik...</div>}
      </div>
      <div style={styles.inputArea}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          style={styles.input}
          placeholder="Ketik pesan..."
        />
        <button onClick={sendMessage} style={styles.button} disabled={isLoading}>
          Kirim
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', color: '#333' },
  chatBox: { 
    height: '400px', 
    overflowY: 'scroll', 
    border: '1px solid #ccc', 
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#f9f9f9'
  },
  userMsg: { textAlign: 'right', margin: '5px 0', color: 'blue' },
  aiMsg: { textAlign: 'left', margin: '5px 0', color: 'green' },
  inputArea: { display: 'flex', gap: '10px' },
  input: { flexGrow: 1, padding: '10px', fontSize: '16px' },
  button: { padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }
};
