"""로컬에서 모델 추론이 동작하는지 빠르게 검증하는 스크립트.

사용:
    python quick_verify.py
"""
from PIL import Image
from model import GarbageClassifier

if __name__ == "__main__":
    clf = GarbageClassifier()
    img = Image.new("RGB", (500, 500), color=(30, 120, 200))  # 더미 이미지
    out = clf.predict(img)
    print("결과:", out)
    print("라벨 목록:", clf.get_labels())
