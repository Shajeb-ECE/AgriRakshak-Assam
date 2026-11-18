
from pathlib import Path
from PIL import Image

from app.disease_model import rice_model


# Find a sample image inside the project
image_path = Path(__file__).resolve().parent / "test_rice_leaf.jpg"

if not image_path.exists():
    raise FileNotFoundError(
        "Place a rice leaf image named test_rice_leaf.jpg "
        "in the backend folder."
    )

image = Image.open(image_path)

result = rice_model.predict(image)

print("\n========== AGRIRAKSHAK MODEL TEST ==========")
print("Predicted disease:", result["predicted_class"])
print("Confidence:", result["confidence"], "%")

print("\nClass probabilities:")

for name, probability in result["class_probabilities"].items():
    print(f"{name}: {probability}%")

print("\nMODEL INFERENCE SUCCESSFUL")
