# 🗑️ AI 쓰레기 분류 시스템

> Hugging Face 모델을 활용한 쓰레기 자동 분류 MLOps 프로젝트

[![Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud)](https://garbage-classifier-16970477973.asia-northeast3.run.app)
[![Vercel](https://img.shields.io/badge/Vercel-Live-000000?logo=vercel)](https://web-b07whixjy-wldnrs-projects.vercel.app)
[![Expo](https://img.shields.io/badge/Expo-APK-000020?logo=expo)](https://expo.dev/artifacts/eas/vDoX9CV6gFSnDH8t9TjrCB.apk)

## 📋 프로젝트 개요

사진을 찍으면 AI가 자동으로 쓰레기 종류를 분류해주는 시스템입니다. 
**Hugging Face 모델**을 **Cloud Run**에 배포하고, **웹**과 **모바일 앱**에서 사용할 수 있습니다.

### 🎯 주요 기능
- 📸 **이미지 업로드** → AI가 쓰레기 카테고리 자동 분류
- 🌐 **웹 데모**: 브라우저에서 바로 테스트 가능
- 📱 **모바일 앱**: Android APK 다운로드 및 설치 가능
- ☁️ **클라우드 배포**: Google Cloud Run으로 24/7 서비스

### 🤖 사용한 AI 모델
- **모델명**: [`yangy50/garbage-classification`](https://huggingface.co/yangy50/garbage-classification)
- **출처**: Hugging Face Model Hub
- **모델 크기**: 343MB
- **분류 카테고리**: cardboard, glass, metal, paper, plastic, trash 등

## 🏗️ 시스템 아키텍처

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   사용자    │──────▶│  Web / Mobile   │──────▶│   Cloud Run    │
│  (이미지)   │      │   Frontend      │ HTTP  │   (FastAPI)    │
└─────────────┘      └──────────────────┘      └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Hugging Face   │
                                                │  AI Model (343MB)│
                                                └─────────────────┘
```

## 🚀 배포된 서비스

| 서비스 | URL | 설명 |
|--------|-----|------|
| 🔗 **API** | https://garbage-classifier-16970477973.asia-northeast3.run.app | FastAPI REST API (Cloud Run) |
| 🌐 **웹 데모** | https://web-b07whixjy-wldnrs-projects.vercel.app | 브라우저 기반 웹 앱 (Vercel) |
| 📱 **모바일 APK** | [다운로드 링크](https://expo.dev/artifacts/eas/vDoX9CV6gFSnDH8t9TjrCB.apk) | Android 앱 설치 파일 |

### API 사용 예시

```bash
# Health Check
curl https://garbage-classifier-16970477973.asia-northeast3.run.app/health

# 이미지 분류
curl -X POST "https://garbage-classifier-16970477973.asia-northeast3.run.app/predict" \
  -F "file=@garbage.jpg"
```

**응답 예시:**
```json
{
  "success": true,
  "prediction": {
    "label": "cardboard",
    "score": 0.8542
  },
  "inference_time_ms": 234.5
}
```

## 💻 핵심 코드 설명

### 1️⃣ AI 모델 로드 (`model.py`)

```python
from transformers import AutoModelForImageClassification
import torch

class GarbageClassifier:
    def __init__(self):
        # Hugging Face에서 모델 다운로드
        self.model = AutoModelForImageClassification.from_pretrained(
            "yangy50/garbage-classification"
        )
        self.model.eval()
    
    def predict(self, image):
        # 이미지를 텐서로 변환
        inputs = self.transform(image).unsqueeze(0)
        
        # AI 추론 실행
        with torch.no_grad():
            outputs = self.model(inputs)
            probabilities = torch.nn.functional.softmax(outputs.logits, dim=1)
        
        # 가장 높은 확률의 카테고리 반환
        predicted_class = probabilities.argmax().item()
        confidence = probabilities[0][predicted_class].item()
        
        return {
            "label": self.model.config.id2label[predicted_class],
            "score": confidence
        }
```

### 2️⃣ FastAPI 서버 (`main.py`)

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from model import GarbageClassifier

app = FastAPI()

# CORS 설정 (웹/모바일에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# AI 모델 로드
classifier = GarbageClassifier()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 업로드된 이미지 읽기
    image = Image.open(file.file)
    
    # AI 모델로 분류
    result = classifier.predict(image)
    
    return {"success": True, "prediction": result}
```

### 3️⃣ Docker 배포 (`Dockerfile`)

```dockerfile
FROM python:3.11-slim

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY . .

# FastAPI 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 4️⃣ 모바일 앱 (`mobile/App.js`)

```javascript
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [result, setResult] = useState(null);
  
  // 카메라로 사진 찍기
  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      classifyImage(result.assets[0].uri);
    }
  };
  
  // API 호출하여 분류
  const classifyImage = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: 'image.jpg',
      type: 'image/jpeg'
    });
    
    const response = await fetch(
      'https://garbage-classifier-16970477973.asia-northeast3.run.app/predict',
      { method: 'POST', body: formData }
    );
    
    const data = await response.json();
    setResult(data.prediction); // 결과 표시
  };
  
  return (
    <View>
      <Button title="사진 찍기" onPress={pickImage} />
      {result && (
        <Text>분류: {result.label} ({(result.score * 100).toFixed(1)}%)</Text>
      )}
    </View>
  );
}
```

## 📁 프로젝트 구조

```
aimlops_garbage_classifier/
├── main.py                 # FastAPI 백엔드 서버
├── model.py                # AI 모델 로드 및 추론 로직
├── requirements.txt        # Python 패키지 목록
├── Dockerfile              # Docker 이미지 빌드 설정
├── cloudbuild.yaml         # Google Cloud Build 배포 설정
├── web/                    # 웹 프론트엔드 (Vercel)
│   ├── index.html
│   └── vercel.json
├── mobile/                 # Expo 모바일 앱
│   ├── App.js
│   ├── package.json
│   ├── app.json
│   └── eas.json           # EAS Build 설정
└── README.md              # 프로젝트 문서
```

## 🛠️ 기술 스택

### 백엔드
- **Python 3.11**: 프로그래밍 언어
- **FastAPI**: 고성능 REST API 프레임워크
- **Hugging Face Transformers**: AI 모델 라이브러리
- **PyTorch**: 딥러닝 프레임워크
- **Uvicorn**: ASGI 웹 서버

### 프론트엔드
- **HTML/CSS/JavaScript**: 웹 데모
- **React Native (Expo)**: 모바일 앱
- **expo-image-picker**: 카메라/갤러리 접근

### 배포 및 인프라
- **Google Cloud Run**: 서버리스 컨테이너 배포
- **Docker**: 컨테이너화
- **Vercel**: 정적 웹 호스팅
- **Expo EAS Build**: 모바일 APK 빌드

### MLOps
- **Hugging Face Hub**: 사전 학습된 모델 사용
- **Google Cloud Build**: CI/CD 파이프라인
- **Git/GitHub**: 버전 관리

## 📦 설치 및 실행

### 로컬 개발 환경

```bash
# 1. 저장소 클론
git clone https://github.com/wldnreod/aimlops_garbage_classifier.git
cd aimlops_garbage_classifier

# 2. Python 패키지 설치
pip install -r requirements.txt

# 3. 서버 실행
python main.py
# 또는
uvicorn main:app --reload

# 4. 브라우저에서 확인
# http://localhost:8080
```

### Docker로 실행

```bash
# Docker 이미지 빌드
docker build -t garbage-classifier .

# 컨테이너 실행
docker run -p 8080:8080 garbage-classifier

# API 테스트
curl http://localhost:8080/health
```

### Cloud Run 배포

```bash
# Google Cloud 프로젝트 설정
gcloud config set project my-project-720-476405

# Cloud Build로 배포
gcloud builds submit --config cloudbuild.yaml

# 또는 직접 배포
gcloud run deploy garbage-classifier \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated
```

## 📱 모바일 앱 빌드

```bash
# 1. mobile 디렉토리로 이동
cd mobile

# 2. 패키지 설치
npm install

# 3. EAS Build로 APK 생성
npx eas build -p android --profile preview

# 4. 생성된 APK 다운로드
# https://expo.dev/artifacts/eas/...
```

## 🧪 테스트

### API 테스트

```bash
# Health Check
curl https://garbage-classifier-16970477973.asia-northeast3.run.app/health

# 이미지 분류 테스트
curl -X POST "https://garbage-classifier-16970477973.asia-northeast3.run.app/predict" \
  -F "file=@test.jpg"
```

### Python 테스트 스크립트

```python
import requests

# 이미지 파일 업로드
with open("test.jpg", "rb") as f:
    response = requests.post(
        "https://garbage-classifier-16970477973.asia-northeast3.run.app/predict",
        files={"file": f}
    )

print(response.json())
# {'success': True, 'prediction': {'label': 'cardboard', 'score': 0.85}}
```

## 🔧 주요 기능 상세

### 1. 이미지 전처리
- **크기 조정**: 224x224 픽셀로 리사이즈
- **정규화**: ImageNet 평균/표준편차로 정규화
- **텐서 변환**: PIL Image → PyTorch Tensor

### 2. AI 추론
- **모델**: Vision Transformer 기반
- **추론 시간**: 평균 200-300ms
- **배치 처리**: 단일 이미지 처리

### 3. CORS 처리
- 웹/모바일에서 API 호출 가능하도록 설정
- `Access-Control-Allow-Origin: *`
- OPTIONS preflight 요청 지원

## 📊 성능

- **추론 시간**: ~250ms/이미지
- **모델 크기**: 343MB
- **메모리 사용량**: ~4GB (Cloud Run)
- **동시 요청 처리**: Cloud Run auto-scaling

## 🎓 학습 내용

이 프로젝트를 통해 배운 것들:

1. **MLOps 파이프라인**: 모델 → API → 배포 전 과정
2. **Hugging Face 모델 활용**: 사전 학습된 모델 사용법
3. **FastAPI**: Python 기반 REST API 구축
4. **Docker & Cloud Run**: 컨테이너 기반 배포
5. **CORS 처리**: 웹/모바일 크로스 오리진 이슈 해결
6. **Expo Mobile**: React Native 앱 개발 및 APK 빌드

## 🐛 트러블슈팅

### 문제 1: AutoImageProcessor 패딩 오류
**증상**: `size should be a tuple (h, w)` 에러  
**해결**: torchvision.transforms 직접 사용

### 문제 2: CORS 에러
**증상**: 웹에서 API 호출 시 "No 'Access-Control-Allow-Origin' header"  
**해결**: CORSMiddleware 추가 및 OPTIONS 핸들러 구현

### 문제 3: Expo SDK 50 빌드 실패
**증상**: Gradle 빌드 실패  
**해결**: Expo SDK 49로 다운그레이드

## 📝 라이선스

MIT License

## 👥 개발자

- GitHub: [@wldnreod](https://github.com/wldnreod)
- 프로젝트: [aimlops_garbage_classifier](https://github.com/wldnreod/aimlops_garbage_classifier)

## 🔗 참고 자료

- [Hugging Face Model Card](https://huggingface.co/yangy50/garbage-classification)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Expo Documentation](https://docs.expo.dev/)
