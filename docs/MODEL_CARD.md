Model Card — AgriRakshak Assam

1. Model Overview

Attribute| Details
Project| AgriRakshak Assam
Model Architecture| MobileNetV3-Small
Framework| PyTorch
Model Type| Convolutional Neural Network (CNN)
Learning Approach| Transfer Learning
Input Image Size| 224 × 224 pixels
Number of Classes| 6
Training Environment| Google Colab
Training Hardware| NVIDIA Tesla T4 GPU

Purpose: The model performs preliminary rice leaf image classification to support crop-health screening within the AgriRakshak Assam platform.

2. Intended Use

The model is designed for:

- Preliminary screening of rice leaf images.
- Classification into six supported categories.
- Displaying prediction probabilities to application users.
- Supporting agricultural monitoring and research demonstrations.

The model is not intended to replace expert agricultural diagnosis or laboratory testing.

3. Dataset Information

Dataset: RiceLeafDiseaseBD — Version 3

Dataset Information| Image Count
Original audited dataset| 9,769
Cleaned candidate unique images| 9,722
Training set| 6,805
Validation set| 1,458
Testing set| 1,459

The cleaned candidate dataset was used for the final documented data split.

3.1 Classification Categories

Class ID| Category
0| Healthy
1| Blast
2| Brown Spot
3| Leaf Smut
4| Rice Tungro
5| Sheath Blight

4. Model Architecture

MobileNetV3-Small is a lightweight convolutional neural network used for image classification.

The project uses pretrained MobileNetV3-Small weights from Torchvision and adapts the classifier for six rice leaf categories.

Processing Workflow

1. Input rice leaf image.
2. Image preprocessing and resizing to 224 × 224 pixels.
3. Feature extraction using MobileNetV3-Small.
4. Classification through the adapted output layer.
5. Prediction probabilities for six categories.
6. Display of the predicted category and confidence information.

5. Training Configuration

Parameter| Details
Optimizer| AdamW
Learning Rate Scheduler| ReduceLROnPlateau
Mixed Precision| Enabled
Training Platform| Google Colab
GPU| NVIDIA Tesla T4
Input Resolution| 224 × 224

The project included a baseline experiment and a subsequent balanced fine-tuning experiment.

Important: The configuration above includes recorded training settings from the balanced fine-tuning experiment. It should not be assumed that every setting was identical in the baseline experiment.

6. Evaluation Results

6.1 Baseline Experiment

Metric| Result
Test Accuracy| 71.69%

The following classification metrics belong to the baseline experiment.

6.2 Class-wise Performance

Category| Precision| Recall| F1-Score
Healthy| 0.6862| 0.8432| 0.7567
Blast| 0.5924| 0.5477| 0.5692
Brown Spot| 0.6518| 0.7156| 0.6822
Leaf Smut| 0.5657| 0.5185| 0.5411
Rice Tungro| 0.8316| 0.7329| 0.7792
Sheath Blight| 0.8692| 0.7954| 0.8306
Macro Average| 0.6995| 0.6922| 0.6932

6.3 Interpretation

- Sheath Blight achieved the highest class-wise F1-score in the baseline results.
- Leaf Smut had comparatively lower classification performance.
- The results indicate that model performance varies across categories.
- Further evaluation on diverse, real-world field images is necessary.

Performance note: The 71.69% test accuracy and class-wise metrics refer to the baseline experiment only. The balanced fine-tuning checkpoint must be evaluated separately before assigning it a test accuracy.

7. Model Checkpoints

The project includes the following recorded checkpoints:

Checkpoint| Description
"mobilenetv3_small_best.pt"| Baseline model checkpoint
"mobilenetv3_small_balanced_ft_best.pt"| Balanced fine-tuning checkpoint

The balanced fine-tuning experiment recorded its best checkpoint at epoch 7, with a validation loss of 0.5806038356.

This validation loss is not a test accuracy measurement.

8. Limitations

- The model is trained on a particular dataset and may not generalise to all field conditions.
- Image quality, lighting, background and leaf orientation may affect predictions.
- Similar visual symptoms can lead to classification errors.
- A high prediction probability does not guarantee a correct diagnosis.
- Performance on unseen local field images has not been established by the baseline test result alone.
- The model supports only the six configured categories.

9. Responsible Use

- Treat predictions as preliminary screening results.
- Verify suspected diseases with qualified agricultural experts.
- Do not use model outputs alone to prescribe pesticides or chemical treatments.
- Avoid interpreting synthetic or demonstration data as actual farm observations.
- Communicate uncertainty when multiple classes receive similar prediction probabilities.

10. Future Improvements

- Evaluate the balanced fine-tuning checkpoint on the held-out test set.
- Improve generalisation using more diverse field images.
- Collect expert-verified local rice leaf samples.
- Perform additional confusion matrix and error analysis.
- Evaluate model performance under different lighting and image conditions.
- Explore lightweight deployment for mobile and edge devices.

11. Project Information

Attribute| Details
Project| AgriRakshak Assam — Phase 1
Developer| Shajeb Ansari
Institution| Tezpur University, Assam
Academic Programme| B.Tech ECE + MBA Dual Degree
Repository| https://github.com/Shajeb-ECE/AgriRakshak-Assam

---

This model card documents the current experimental model and its known limitations. Results should be updated when additional evaluation experiments are completed.