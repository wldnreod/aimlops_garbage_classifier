# Frontend (Next.js)

간단한 이미지 업로드 → 분류 결과 표시 데모.

## 설치 & 실행

```bash
npm install
npm run dev
```

`.env.local` 예시:
```env
NEXT_PUBLIC_API_BASE_URL=https://<CLOUD_RUN_URL>
```

## 배포 (Vercel)
1. Vercel에서 새 프로젝트 생성 → 이 디렉터리 연결
2. 환경변수 `NEXT_PUBLIC_API_BASE_URL` 설정 (Production / Preview 모두)
3. 배포 후 브라우저에서 이미지 업로드 테스트

## 주요 기능
- 라벨 목록 조회 (`/labels`)
- 이미지 분류 요청 (`/predict`)
- 추론 시간(ms) 표시

## 확장 아이디어
- 결과 히스토리 저장 (localStorage)
- 드래그 앤 드롭 업로드
- 다중 이미지 배치 업로드
