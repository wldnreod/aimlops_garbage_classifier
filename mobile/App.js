import React, { useState, useEffect } from 'react';
import { 
  View, Text, Button, Image, StyleSheet, ActivityIndicator, 
  ScrollView, TouchableOpacity, FlatList 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_BASE = 'https://garbage-classifier-16970477973.asia-northeast3.run.app';

// 쓰레기 종류 정보 (한글)
const wasteInfo = {
  'battery': { label: '배터리', disposal: '🔋 배터리: 전용 수거함에 배출' },
  'biological': { label: '음식물쓰레기', disposal: '🥬 음식물: 물기 제거 후 전용 수거함에 배출' },
  'cardboard': { label: '골판지', disposal: '📦 골판지: 테이프/상표 제거 후 펴서 배출' },
  'clothes': { label: '의류', disposal: '👕 의류: 깨끗이 세탁 후 의류수거함 또는 재활용센터' },
  'glass': { label: '유리', disposal: '🍾 유리병: 내용물 비우고 뚜껑 분리 후 배출' },
  'metal': { label: '금속', disposal: '🥫 캔류: 내용물 제거 후 압착하여 배출' },
  'paper': { label: '종이', disposal: '📄 종이류: 비닐/철심 제거 후 배출' },
  'plastic': { label: '플라스틱', disposal: '♻️ 플라스틱: 라벨 제거, 깨끗이 씻어서 배출' },
  'shoes': { label: '신발', disposal: '👟 신발: 재활용센터 또는 의류수거함에 배출' },
  'trash': { label: '일반쓰레기', disposal: '🗑️ 일반쓰레기: 종량제봉투에 배출' }
};

// Google Sign-In 설정
GoogleSignin.configure({
  webClientId: '1079222481108-t2f8q8e3661ootaag46sspivlgbnjvs5.apps.googleusercontent.com', // Web client for server auth
});

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('classify');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(setUser);
    return subscriber;
  }, []);

  useEffect(() => {
    if (user && tab === 'history') {
      loadHistory();
    }
    if (user && tab === 'stats') {
      loadStats();
    }
  }, [user, tab]);

  // Google 로그인
  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (error) {
      setError('로그인 실패: ' + error.message);
    }
  }

  // 로그아웃
  async function signOutUser() {
    try {
      await auth().signOut();
      setTab('classify');
      setImage(null);
      setResult(null);
      setHistory([]);
      setStats(null);
    } catch (error) {
      setError('로그아웃 실패: ' + error.message);
    }
  }

  // 이미지 선택
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

  // 분류하기
  async function classify() {
    if (!image || !user) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // AI 분류 실행
      const form = new FormData();
      form.append('file', {
        uri: image.uri,
        name: 'upload.jpg',
        type: 'image/jpeg'
      });
      
      const res = await fetch(`${API_BASE}/predict`, { 
        method: 'POST', 
        body: form 
      });
      
      if (!res.ok) throw new Error('API 오류: ' + res.status);
      const data = await res.json();
      
      if (!data || !data.prediction || !data.prediction.label) {
        throw new Error('잘못된 API 응답');
      }
      
      // 한글 라벨 정보 가져오기
      const labelKey = data.prediction.label.toLowerCase();
      const info = wasteInfo[labelKey] || { 
        label: data.prediction.label, 
        disposal: '분류 정보 없음' 
      };
      
      setResult({ ...data, labelInfo: info });
      
      // Firebase Storage에 이미지 업로드
      const timestamp = Date.now();
      const filename = `${user.uid}/${timestamp}_${image.uri.split('/').pop()}`;
      const reference = storage().ref(filename);
      await reference.putFile(image.uri);
      const imageUrl = await reference.getDownloadURL();
      
      // Firestore에 결과 저장 (한글 라벨로)
      await firestore().collection('classifications').add({
        userId: user.uid,
        userName: user.displayName,
        imageUrl: imageUrl,
        label: info.label,
        score: data.prediction.score,
        timestamp: firestore.FieldValue.serverTimestamp()
      });
      
      alert('분석 결과가 저장되었습니다!');
    } catch (e) {
      setError('오류: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // 히스토리 로드
  async function loadHistory() {
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('classifications')
        .where('userId', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .get();
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(items);
    } catch (e) {
      setError('기록 로드 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // 통계 로드
  async function loadStats() {
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('classifications')
        .where('userId', '==', user.uid)
        .get();
      
      const counts = {};
      snapshot.docs.forEach(doc => {
        const label = doc.data().label;
        counts[label] = (counts[label] || 0) + 1;
      });
      
      const total = snapshot.size;
      const statsArray = Object.entries(counts)
        .map(([label, count]) => ({
          label,
          count,
          percentage: ((count / total) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count);
      
      setStats({ total, items: statsArray });
    } catch (e) {
      setError('통계 로드 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // 로그인 화면
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>♻️ EcoSort</Text>
        <Text style={styles.subtitle}>AI 스마트 분리수거</Text>
        <Text style={styles.description}>로그인하여 분석 기록을 저장하세요</Text>
        <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle}>
          <Text style={styles.googleBtnText}>Google로 로그인</Text>
        </TouchableOpacity>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  // 메인 화면
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Image source={{ uri: user.photoURL }} style={styles.userPhoto} />
        <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
        <TouchableOpacity onPress={signOutUser} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* 업로드 영역 (항상 표시) */}
      <View style={styles.uploadSection}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(false)}>
            <Text style={styles.uploadBtnText}>📁 갤러리</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(true)}>
            <Text style={styles.uploadBtnText}>📸 카메라</Text>
          </TouchableOpacity>
        </View>
        
        {image && (
          <>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            <TouchableOpacity 
              style={[styles.classifyBtn, (!image || loading) && styles.btnDisabled]} 
              onPress={classify} 
              disabled={!image || loading}
            >
              <Text style={styles.classifyBtnText}>
                {loading ? '분류 중...' : '🔍 분류하기'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        
        {loading && <ActivityIndicator style={{ marginTop: 12 }} size="large" color="#06b6d4" />}
        {error && <Text style={styles.error}>{error}</Text>}
        
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>분류 결과</Text>
            <Text style={styles.resultLabel}>{result.labelInfo.label}</Text>
            <Text style={styles.resultScore}>
              정확도: {(result.prediction.score * 100).toFixed(1)}%
            </Text>
            <Text style={styles.resultInfo}>{result.labelInfo.disposal}</Text>
          </View>
        )}
      </View>

      {/* 탭 메뉴 */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            내 기록
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'stats' && styles.tabActive]}
          onPress={() => setTab('stats')}
        >
          <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>
            통계
          </Text>
        </TouchableOpacity>
      </View>

      {/* 히스토리 탭 */}
      {tab === 'history' && (
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#06b6d4" />
          ) : history.length === 0 ? (
            <Text style={styles.noHistory}>분석 기록이 없습니다</Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.historyImg} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>{item.label}</Text>
                    <Text style={styles.historyScore}>
                      정확도: {(item.score * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.historyDate}>
                      {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('ko-KR') : ''}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* 통계 탭 */}
      {tab === 'stats' && (
        <ScrollView style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#06b6d4" />
          ) : !stats ? (
            <Text style={styles.noHistory}>통계 정보가 없습니다</Text>
          ) : (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTotal}>총 {stats.total}건 분석</Text>
              {stats.items.map((item, index) => (
                <View key={index} style={styles.statsItem}>
                  <Text style={styles.statsRank}>{index + 1}위</Text>
                  <Text style={styles.statsLabel}>{item.label}</Text>
                  <Text style={styles.statsCount}>{item.count}건</Text>
                  <Text style={styles.statsPercent}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 80, 
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { 
    fontSize: 36, 
    fontWeight: '800', 
    marginBottom: 4,
    color: '#1a202c'
  },
  subtitle: { 
    fontSize: 18, 
    color: '#718096', 
    marginBottom: 8,
    fontWeight: '600'
  },
  description: {
    color: '#718096',
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 14
  },
  googleBtn: {
    backgroundColor: '#06b6d4',
    padding: 16,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  googleBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#f7fafc',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0'
  },
  userPhoto: { 
    width: 50, 
    height: 50, 
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#fff'
  },
  userName: { 
    flex: 1, 
    marginLeft: 12, 
    fontWeight: '700', 
    fontSize: 16,
    color: '#1a202c'
  },
  logoutBtn: { 
    backgroundColor: '#fee2e2',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dc2626'
  },
  logoutText: { fontSize: 20 },
  uploadSection: {
    padding: 16,
    backgroundColor: '#fff'
  },
  row: { 
    flexDirection: 'row', 
    gap: 10,
    marginBottom: 12
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#cbd5e0',
    borderStyle: 'dashed'
  },
  uploadBtnText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#4a5568'
  },
  preview: { 
    width: '100%', 
    height: 250, 
    resizeMode: 'contain', 
    marginVertical: 12, 
    borderRadius: 12
  },
  classifyBtn: {
    backgroundColor: '#06b6d4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  btnDisabled: {
    backgroundColor: '#cbd5e0'
  },
  classifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  error: { 
    marginTop: 12, 
    color: '#b91c1c', 
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8
  },
  resultBox: { 
    marginTop: 16, 
    padding: 20, 
    backgroundColor: '#f0fdfa', 
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#06b6d4'
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0891b2',
    marginBottom: 8
  },
  resultLabel: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#06b6d4', 
    marginBottom: 6 
  },
  resultScore: {
    fontSize: 16,
    color: '#0891b2',
    marginBottom: 10
  },
  resultInfo: {
    fontSize: 14,
    color: '#0891b2',
    lineHeight: 20
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    padding: 8,
    marginTop: 12
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 12
  },
  tabActive: {
    backgroundColor: '#06b6d4'
  },
  tabText: { 
    fontWeight: '700', 
    color: '#718096',
    fontSize: 15
  },
  tabTextActive: { color: '#fff' },
  noHistory: {
    textAlign: 'center',
    color: '#cbd5e0',
    marginTop: 40,
    fontSize: 16,
    fontWeight: '600'
  },
  historyItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f7fafc',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  historyImg: {
    width: 90,
    height: 90,
    borderRadius: 8
  },
  historyInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center'
  },
  historyLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#06b6d4',
    marginBottom: 4
  },
  historyScore: {
    fontSize: 14,
    color: '#0891b2',
    marginBottom: 4
  },
  historyDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4
  },
  statsContainer: {
    padding: 16
  },
  statsTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 20,
    textAlign: 'center'
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7fafc',
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  statsRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06b6d4',
    width: 50
  },
  statsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c'
  },
  statsCount: {
    fontSize: 15,
    color: '#0891b2',
    marginRight: 12
  },
  statsPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: '#06b6d4'
  }
});
