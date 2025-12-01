"""
쓰레기 분류 API 서버
FastAPI를 사용한 이미지 분류 엔드포인트
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import logging
from model import GarbageClassifier

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Garbage Classification API",
    description="AI 기반 쓰레기 분류 시스템",
    version="1.0.0"
)

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (프로덕션에서는 특정 도메인만 허용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 로드 (전역 변수로 한 번만 로드)
logger.info("모델 로딩 시작...")
classifier = GarbageClassifier()
logger.info("모델 로딩 완료!")


@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "service": "Garbage Classification API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "model_loaded": classifier.is_loaded(),
        "model_name": "yangy50/garbage-classification"
    }


@app.options("/predict")
async def predict_options():
    """CORS preflight 요청 처리"""
    return JSONResponse(content={"status": "ok"})


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    이미지 업로드 및 쓰레기 카테고리 예측
    
    Args:
        file: 이미지 파일 (JPEG, PNG 등)
    
    Returns:
        JSON: 예측 결과 (카테고리, 확률)
    """
    try:
        # 파일 확장자 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다"
            )
        
        # 이미지 읽기
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        logger.info(f"이미지 처리 중: {file.filename}, 크기: {image.size}")
        
        # 모델 예측
        result = classifier.predict(image)
        
        logger.info(f"예측 완료: {result['label']} (확률: {result['score']:.2%})")
        
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "prediction": result
        })
        
    except Exception as e:
        logger.error(f"예측 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    # Cloud Run에서 PORT 환경변수 사용
    import os
    port = int(os.getenv("PORT", 8080))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
