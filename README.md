# 🗑️ Garbage Classification MLOps Project

AI 기반 쓰레기 분류 시스템 - Hugging Face 모델 배포 프로젝트

## 📋 프로젝트 개요

- **모델**: `yangy50/garbage-classification`
- **기능**: 이미지 업로드 → 쓰레기 카테고리 분류
- **배포**: Google Cloud Run
- **API**: FastAPI

## 🚀 빠른 시작

```bash
# 의존성 설치
pip install -r requirements.txt

# 로컬 실행
python main.py

# API 테스트
curl -X POST "http://localhost:8080/predict" -F "file=@garbage.jpg"
```

## 📁 프로젝트 구조

```
aimlops_garbage_classifier/
├── main.py              # FastAPI 서버
├── model.py             # 모델 로드 및 추론
├── requirements.txt     # Python 패키지
├── Dockerfile          # Docker 이미지 빌드
├── cloudbuild.yaml     # Cloud Build 설정
└── README.md           # 프로젝트 문서
```

## 🛠️ 기술 스택

- **ML Framework**: Hugging Face Transformers
- **API Framework**: FastAPI
- **Deployment**: Docker + Google Cloud Run
- **CI/CD**: Google Cloud Build
