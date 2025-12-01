# Mobile (Expo React Native)

간단한 카메라/갤러리 이미지 업로드 → Cloud Run API 분류 결과 표시.

## 실행
```bash
npm install
npm start
```

`.env` 또는 환경변수:
```
EXPO_PUBLIC_API_BASE_URL=https://<CLOUD_RUN_URL>
```

Android USB 디버깅:
1. 휴대폰 개발자 옵션 → USB 디버깅 활성화
2. `adb devices`로 인식 확인
3. Expo DevTools에서 연결된 기기 실행

## APK 빌드 (EAS)
```bash
eas build -p android --profile preview
```
(EAS 설정 필요 시 `eas.json` 추가 가능)

## 기능
- 라벨 목록 조회
- 카메라 촬영 / 갤러리 선택
- 추론 시간(ms) 확인

## 확장 아이디어
- 오프라인 큐 저장 후 재전송
- 예측 결과 로컬 히스토리
- 모델 버전 표기 (/health 연동)
