import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  async function fetchLabels() {
    try {
      const res = await fetch(`${API_BASE}/labels`);
      const data = await res.json();
      setLabels(data.labels || []);
    } catch (e) {
      console.error(e);
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    setFile(f);
    setResult(null);
    setError(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.container}>
      <h1>Garbage Classification</h1>
      <p style={styles.subtitle}>Hugging Face 모델 기반 이미지 분류 데모</p>
      <button onClick={fetchLabels} style={styles.button}>라벨 불러오기</button>
      {labels.length > 0 && (
        <div style={styles.labelsBox}>
          <strong>Labels:</strong> {labels.join(', ')}
        </div>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview && <img src={preview} alt="preview" style={styles.preview} />}
        <button type="submit" disabled={!file || loading} style={styles.button}>
          {loading ? '분류 중...' : '분류하기'}
        </button>
      </form>
      {error && <div style={styles.error}>오류: {error}</div>}
      {result && (
        <div style={styles.result}>
          <h3>결과</h3>
          <p>파일명: {result.filename}</p>
          <p>예측 라벨: <strong>{result.prediction.label}</strong></p>
          <p>확률: {(result.prediction.score * 100).toFixed(2)}%</p>
          <p>추론 시간: {result.inference_time_ms} ms</p>
        </div>
      )}
      <footer style={styles.footer}>API Base: {API_BASE}</footer>
    </main>
  );
}

const styles = {
  container: { maxWidth: 700, margin: '40px auto', fontFamily: 'ui-sans-serif, Arial', padding: '0 16px' },
  subtitle: { color: '#555' },
  form: { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  preview: { maxWidth: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  button: { padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  result: { marginTop: 24, background: '#f1f5f9', padding: 16, borderRadius: 8 },
  error: { marginTop: 16, background: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 6 },
  labelsBox: { marginTop: 16, background: '#eef2ff', padding: 12, borderRadius: 6 },
  footer: { marginTop: 40, fontSize: 12, color: '#666' }
};
