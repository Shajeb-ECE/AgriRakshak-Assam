
from pathlib import Path
from PIL import Image
from app.disease_model import rice_model

IMAGE_DIR = Path(__file__).resolve().parent / "diagnostic_images"

image_names = [
    "blast_388.jpg",
    "blast_966.jpg",
    "blast_240.jpg",
    "blast_851.jpg",
]

def center_crop(image, crop_ratio=0.70):
    width, height = image.size

    new_width = int(width * crop_ratio)
    new_height = int(height * crop_ratio)

    left = (width - new_width) // 2
    top = (height - new_height) // 2

    return image.crop((
        left,
        top,
        left + new_width,
        top + new_height
    ))

print("\n========== CROP DIAGNOSTIC EXPERIMENT ==========")

for filename in image_names:
    image_path = IMAGE_DIR / filename

    if not image_path.exists():
        print(f"\nMissing image: {filename}")
        continue

    image = Image.open(image_path).convert("RGB")

    # Prediction on original image
    original_result = rice_model.predict(image)

    # Prediction on centre-cropped image
    cropped_image = center_crop(image)
    cropped_result = rice_model.predict(cropped_image)

    print(f"\nIMAGE: {filename}")
    print("-----------------------------------")

    print("Original prediction:",
          original_result["predicted_class"])
    print("Original confidence:",
          original_result["confidence"], "%")

    print("Cropped prediction:",
          cropped_result["predicted_class"])
    print("Cropped confidence:",
          cropped_result["confidence"], "%")

print("\n========== DIAGNOSTIC COMPLETED ==========")
