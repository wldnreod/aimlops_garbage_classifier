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
                confidence, predicted_idx = torch.max(probs, dim=-1)
            
            # 10개 클래스 라벨
            labels = {
                0: "Battery", 1: "Biological", 2: "Cardboard", 3: "Clothes",
                4: "Glass", 5: "Metal", 6: "Paper", 7: "Plastic",
                8: "Shoes", 9: "Trash"
            }
            
            label = labels[predicted_idx.item()]
            score = confidence.item()
            
            return {
                "label": label,
                "score": float(score)
            }
            
        except Exception as e:
            logger.error(f"예측 실패: {str(e)}")
            raise
