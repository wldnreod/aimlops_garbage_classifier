import subprocess
import sys

model_code = '''from PIL import Image
from transformers import AutoModelForImageClassification
import torch
from torchvision import transforms
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GarbageClassifier:
    def __init__(self):
        self.model_name = "yangy50/garbage-classification"
        self.model = None
        self.transform = None
        self._load_model()
    
    def _load_model(self):
        try:
            logger.info(f"모델 로딩 시작: {self.model_name}")
            self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
            self.model.eval()
            
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            logger.info("모델 로드 성공")
        except Exception as e:
            logger.error(f"모델 로드 실패: {str(e)}")
            raise
    
    def is_loaded(self):
        return self.model is not None
    
    def predict(self, image: Image.Image):
        try:
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            input_tensor = self.transform(image).unsqueeze(0)
            
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
                confidence, predicted_idx = torch.max(probs, dim=-1)
            
            label = self.model.config.id2label[predicted_idx.item()]
            score = confidence.item()
            
            return {
                "label": label,
                "score": float(score)
            }
            
        except Exception as e:
            logger.error(f"예측 실패: {str(e)}")
            raise
'''

# Cloud Shell에 파일 생성 명령 실행
cmd = [
    r'C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd',
    'cloud-shell', 'ssh',
    '--authorize-session',
    '--command',
    f'cd ~/garbage-classifier && cat > model.py && cat model.py && gcloud builds submit --config cloudbuild.yaml'
]

process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
output, _ = process.communicate(input='y\n' + model_code)
print(output)
