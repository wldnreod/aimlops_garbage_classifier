from PIL import Image
from transformers import AutoImageProcessor, SiglipForImageClassification
import torch
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GarbageClassifier:
    def __init__(self):
        self.model_name = "prithivMLmods/Augmented-Waste-Classifier-SigLIP2"
        self.model = None
        self.processor = None
        self._load_model()
    
    def _load_model(self):
        try:
            logger.info(f"모델 로딩 시작: {self.model_name}")
            self.model = SiglipForImageClassification.from_pretrained(self.model_name)
            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model.eval()
            
            logger.info("모델 로드 성공 - SigLIP2 (99.26% accuracy, 10 classes)")
        except Exception as e:
            logger.error(f"모델 로드 실패: {str(e)}")
            raise
    
    def is_loaded(self):
        return self.model is not None
    
    def predict(self, image: Image.Image):
        try:
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # SigLIP processor 사용
            inputs = self.processor(images=image, return_tensors="pt")
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=1).squeeze()
            
            # 10개 클래스 라벨
            labels = {
                0: "Battery", 1: "Biological", 2: "Cardboard", 3: "Clothes",
                4: "Glass", 5: "Metal", 6: "Paper", 7: "Plastic",
                8: "Shoes", 9: "Trash"
            }
            
            # 상위 2개 예측 가져오기
            top2_probs, top2_indices = torch.topk(probs, k=2)
            
            predicted_idx = top2_indices[0].item()
            predicted_label = labels[predicted_idx]
            predicted_score = top2_probs[0].item()
            
            # Glass vs Plastic 혼동 방지: 차이가 작으면 Plastic 우선
            if predicted_label == "Glass" and top2_indices[1].item() == 7:  # 7 = Plastic
                prob_diff = top2_probs[0].item() - top2_probs[1].item()
                if prob_diff < 0.25:  # 차이가 25% 미만이면 Plastic으로 (기존 15%에서 증가)
                    logger.info(f"Glass({top2_probs[0].item():.3f}) vs Plastic({top2_probs[1].item():.3f}) - Plastic 선택")
                    predicted_idx = 7
                    predicted_label = "Plastic"
                    predicted_score = top2_probs[1].item()
            
            return {
                "label": predicted_label,
                "score": float(predicted_score),
                "top2": {
                    "labels": [labels[idx.item()] for idx in top2_indices],
                    "scores": [float(prob) for prob in top2_probs]
                }
            }
            
        except Exception as e:
            logger.error(f"예측 실패: {str(e)}")
            raise
