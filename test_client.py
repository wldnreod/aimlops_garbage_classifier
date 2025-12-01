"""간단한 로컬 테스트 클라이언트
이미지 파일을 FastAPI /predict 엔드포인트에 업로드하여 결과를 출력

사용법:
    python test_client.py --image path/to/image.jpg --url http://localhost:8080/predict
"""

import argparse
import requests
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="업로드할 이미지 경로")
    parser.add_argument("--url", default="http://localhost:8080/predict", help="예측 API URL")
    args = parser.parse_args()

    img_path = Path(args.image)
    if not img_path.exists():
        raise FileNotFoundError(f"이미지 파일을 찾을 수 없습니다: {img_path}")

    files = {"file": (img_path.name, img_path.open("rb"), "image/jpeg")}
    print(f"[요청] {args.url} 로 {img_path.name} 업로드...")
    resp = requests.post(args.url, files=files, timeout=60)

    if resp.status_code != 200:
        print(f"[오류] status={resp.status_code}: {resp.text}")
        return

    data = resp.json()
    print("[결과]")
    print(data)


if __name__ == "__main__":
    main()
