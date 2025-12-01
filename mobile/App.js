import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const API_BASE = 'https://garbage-classifier-16970477973.asia-northeast3.run.app';

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [labels, setLabels] = useState([]);

  async function pickImage(fromCamera = false) {
    setError(null);
    const opts = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false
    };
    let res;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        setError('카메라 권한이 필요합니다');
        return;
      }
      res = await ImagePicker.launchCameraAsync(opts);
    } else {
      res = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (!res.canceled) {
      setImage(res.assets[0]);
      setResult(null);
    }
  }

  async function loadLabels() {
    try {
      const r = await fetch(`${API_BASE}/labels`);
      const data = await r.json();
      setLabels(data.labels || []);
    } catch (e) { setError(e.message); }
  }

  async function classify() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', {
        uri: image.uri,
        name: 'upload.jpg',
        type: 'image/jpeg'
      });
      const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Garbage Classification</Text>
      <Text style={styles.subtitle}>Hugging Face 모델 모바일 데모</Text>
      <View style={styles.row}>
        <Button title="이미지 선택" onPress={() => pickImage(false)} />
        <Button title="카메라" onPress={() => pickImage(true)} />
        <Button title="라벨" onPress={loadLabels} />
      </View>
      {labels.length > 0 && (
        <Text style={styles.labels}>Labels: {labels.join(', ')}</Text>
      )}
      {image && (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      )}
      <Button title={loading ? '분류 중...' : '분류하기'} onPress={classify} disabled={!image || loading} />
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>오류: {error}</Text>}
      {result && (
        <View style={styles.resultBox}>
          <Text>파일: {result.filename}</Text>
          <Text>라벨: {result.prediction.label}</Text>
          <Text>확률: {(result.prediction.score * 100).toFixed(2)}%</Text>
          <Text>추론 시간: {result.inference_time_ms} ms</Text>
        </View>
      )}
      <Text style={styles.footer}>API: {API_BASE}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#555', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  preview: { width: '100%', height: 300, resizeMode: 'contain', marginVertical: 16, borderRadius: 8 },
  error: { marginTop: 16, color: '#b91c1c', fontWeight: '600' },
  resultBox: { marginTop: 20, padding: 16, backgroundColor: '#eef2ff', borderRadius: 8 },
  footer: { marginTop: 40, fontSize: 12, color: '#666' },
  labels: { marginTop: 12, fontSize: 12, color: '#333' }
});
