#!/bin/bash
# Cloud Run 배포 스크립트

PROJECT_ID="my-project-720-476405"
SERVICE_NAME="garbage-classifier"
REGION="asia-northeast3"

echo "🚀 Cloud Run 배포 시작..."
echo "프로젝트: $PROJECT_ID"
echo "서비스: $SERVICE_NAME"
echo "리전: $REGION"
echo ""

# Cloud Build로 배포
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID

echo ""
echo "✅ 배포 완료!"
echo "서비스 URL 확인:"
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)"
