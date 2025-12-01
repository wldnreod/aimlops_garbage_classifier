# 쓰레기 분류 AI - 프로젝트 완료 가이드

## 📋 현재 상태

### ✅ 완료된 것
1. **백엔드 API (Cloud Run)**
   - URL: https://garbage-classifier-16970477973.asia-northeast3.run.app
   - 엔드포인트:
     - `GET /health` - 헬스 체크
     - `POST /predict` - 이미지 분류
   - 모델: yangy50/garbage-classification
   - 상태: 배포 진행 중 (빌드 ID: 083948ee-6242-4e5f-940c-0e100ff06624)

2. **웹 데모**
   - 파일: `web/index.html`
   - 기능: 드래그&드롭, 이미지 분류, 결과 표시

3. **모바일 앱**
   - 파일: `mobile/App.js`
   - 환경 변수: `mobile/.env` 설정 완료
   - 기능: 카메라/갤러리, 이미지 분류

## 🚀 다음 단계

### 1. 빌드 완료 확인 (10-15분 소요)
```bash
# 빌드 상태 확인
gcloud builds describe 083948ee-6242-4e5f-940c-0e100ff06624 \
  --region asia-northeast3 \
  --project my-project-720-476405 \
  --format="value(status)"
```

### 2. API 테스트
```bash
# 헬스 체크
curl https://garbage-classifier-16970477973.asia-northeast3.run.app/health

# 이미지 분류 테스트
curl -X POST https://garbage-classifier-16970477973.asia-northeast3.run.app/predict \
  -F "file=@test.jpg"
```

### 3. 웹사이트 배포 (3가지 방법)

#### 방법 A: Netlify Drop (가장 간단)
1. https://app.netlify.com/drop 접속
2. `web` 폴더를 드래그&드롭
3. 자동으로 URL 생성됨

#### 방법 B: Vercel
```bash
cd web
npx vercel --prod
# 로그인 후 프롬프트 따라하기
```

#### 방법 C: GitHub Pages
```bash
# GitHub에 푸시 후 Settings > Pages에서 활성화
git add web/
git commit -m "Add web demo"
git push
```

### 4. 모바일 APK 빌드

#### EAS Build 사용 (권장)
```bash
cd mobile

# Expo 계정 로그인
npx expo login

# EAS CLI 설치
npm install -g eas-cli

# EAS 프로젝트 설정
eas build:configure

# Android APK 빌드
eas build -p android --profile preview

# 빌드 완료 후 QR 코드로 다운로드 또는
# https://expo.dev/accounts/[your-account]/projects/mobile/builds
```

#### APK 다이렉트 빌드 (로컬)
```bash
cd mobile
npm install

# Android Studio 필요
npx expo run:android
```

## 📱 테스트 방법

### 웹 테스트
1. 배포된 URL 접속
2. 쓰레기 이미지 업로드 (드래그 또는 클릭)
3. "분류하기" 버튼 클릭
4. 결과 확인

### 모바일 테스트
1. APK 다운로드 후 설치
2. 카메라 또는 갤러리에서 이미지 선택
3. "분류하기" 버튼 클릭
4. 결과 확인

## 🛠️ 문제 해결

### API 오류 발생 시
```bash
# 로그 확인
gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=garbage-classifier" \
  --limit 50 --format json
```

### 빌드 실패 시
```bash
# 빌드 로그 확인
gcloud builds log 083948ee-6242-4e5f-940c-0e100ff06624 \
  --region asia-northeast3
```

### 모바일 빌드 오류 시
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

## 📊 리소스 사용량
- Cloud Run: 무료 티어 (월 200만 요청)
- Cloud Build: 무료 티어 (일 120분)
- Netlify/Vercel: 무료 티어 (대역폭 100GB)

## 🔗 유용한 링크
- Cloud Run 콘솔: https://console.cloud.google.com/run?project=my-project-720-476405
- Cloud Build 콘솔: https://console.cloud.google.com/cloud-build?project=my-project-720-476405
- Hugging Face 모델: https://huggingface.co/yangy50/garbage-classification
