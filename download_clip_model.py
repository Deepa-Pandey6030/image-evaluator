from sentence_transformers import SentenceTransformer
import os

MODEL_NAME = "clip-ViT-B-32"
SAVE_PATH = "./models/clip-ViT-B-32"

os.makedirs(SAVE_PATH, exist_ok=True)

print("Downloading and saving model to:", SAVE_PATH)

model = SentenceTransformer(MODEL_NAME)
model.save(SAVE_PATH)

print("Model saved to:", SAVE_PATH)
