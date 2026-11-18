
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image, ImageOps
from torchvision import models, transforms


# Project model checkpoint
MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "models"
    / "mobilenetv3_small_balanced_ft_best.pt"
)

DEVICE = torch.device("cpu")

# ImageNet normalization
PREPROCESS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


class RiceDiseaseModel:

    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model checkpoint not found: {MODEL_PATH}"
            )

        checkpoint = torch.load(
            MODEL_PATH,
            map_location=DEVICE,
            weights_only=True
        )

        self.class_names = checkpoint["class_names"]

        # Recreate the trained MobileNetV3-Small architecture
        self.model = models.mobilenet_v3_small(weights=None)

        output_features = self.model.classifier[3].in_features

        self.model.classifier[3] = nn.Linear(
            output_features,
            len(self.class_names)
        )

        self.model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        self.model.to(DEVICE)
        self.model.eval()

        self.experiment = checkpoint.get("experiment", "Unknown")

        print("AgriRakshak disease model loaded successfully.")
        print("Architecture: MobileNetV3-Small")
        print("Classes:", self.class_names)
        print("Device:", DEVICE)

    def predict(self, image: Image.Image):

        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")

        input_tensor = PREPROCESS(image)
        input_tensor = input_tensor.unsqueeze(0).to(DEVICE)

        with torch.inference_mode():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)

        confidence, predicted_index = torch.max(
            probabilities, dim=1
        )

        predicted_class = self.class_names[
            predicted_index.item()
        ]

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence.item() * 100, 2),
            "class_probabilities": {
                name: round(probability.item() * 100, 2)
                for name, probability in zip(
                    self.class_names,
                    probabilities[0]
                )
            }
        }


# Load the model once when this module is imported
rice_model = RiceDiseaseModel()
