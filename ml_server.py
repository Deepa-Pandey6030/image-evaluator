# from flask import Flask, request, jsonify
# from PIL import Image
# from sentence_transformers import SentenceTransformer
# import os
# import torch

# app = Flask(__name__)

# # -----------------------------
# # Load FAST CLIP Model locally
# # -----------------------------
# MODEL_PATH = "./models/clip-ViT-B-32"  # folder where you saved the model
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# print(f"Loading SentenceTransformer CLIP model from {MODEL_PATH} on {DEVICE}...")

# try:
#     model = SentenceTransformer(MODEL_PATH, device=DEVICE)
#     print("✅ Model loaded successfully!")
# except Exception as e:
#     print(f"❌ FATAL: Failed to load CLIP model. Error: {e}")
#     exit(1)


# # -----------------------------
# # Generate CLIP embedding
# # -----------------------------
# def generate_clip_embedding(image_path):
#     image = Image.open(image_path).convert("RGB")
#     embedding = model.encode(
#         image,
#         convert_to_tensor=True,
#         device=DEVICE
#     )
#     return embedding.cpu().numpy().tolist()  # returns 512-dim vector


# # -----------------------------
# # API Endpoint
# # -----------------------------
# @app.route('/embed', methods=['POST'])
# def embed_image():
#     data = request.json
#     image_path = data.get('filePath')

#     if not image_path:
#         return jsonify({"error": "Missing filePath"}), 400

#     if not os.path.exists(image_path):
#         return jsonify({"error": f"Image not found: {image_path}"}), 404

#     try:
#         clip_vector = generate_clip_embedding(image_path)
#         return jsonify({"clipEmbedding": clip_vector}), 200
#     except Exception as e:
#         print(f"Error during embedding: {e}")
#         return jsonify({"error": f"Python embedding failed: {str(e)}"}), 500


# # -----------------------------
# # Manual Test
# # -----------------------------
# if __name__ == '__main__':
#     TEST_IMAGE_PATH = r'D:/Deepa/Internship/web app/backend/Gemini_Generated_Image_tyivm6tyivm6tyiv.png'

#     print("\n===================================")
#     print("STARTING MANUAL CLIP TEST")

#     if not os.path.exists(TEST_IMAGE_PATH):
#         print(f"❌ ERROR: Test image does NOT exist at:\n{TEST_IMAGE_PATH}")
#         print("Please correct TEST_IMAGE_PATH before running.")
#     else:
#         print(f"✅ Found test image: {TEST_IMAGE_PATH}")
#         try:
#             vector = generate_clip_embedding(TEST_IMAGE_PATH)
#             print(f"✅ SUCCESS! Vector generated. Dimension = {len(vector)}")
#             print(f"First 5 values: {vector[:5]}")
#         except Exception as e:
#             print(f"❌ ERROR generating embedding: {e}")

#     print("===================================")
#     print("Starting Flask API...")
#     app.run(port=5000)


# from sentence_transformers import SentenceTransformer
# import torch
# import os

# LOCAL_MODEL_PATH = "./models/clip-ViT-B-32"
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# print("Loading CLIP from local folder:", LOCAL_MODEL_PATH)
# model = SentenceTransformer(LOCAL_MODEL_PATH, device=DEVICE)
# print("Loading is completed")


# ml_server.py
from flask import Flask, request, jsonify
from PIL import Image
from sentence_transformers import SentenceTransformer
import os
import torch

app = Flask(__name__)

# -----------------------------
# Load FAST CLIP Model locally
# -----------------------------
MODEL_PATH = "./models/clip-ViT-B-32"  # <-- Use the local model folder
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading SentenceTransformer CLIP model from {MODEL_PATH} on {DEVICE}...")

try:
    model = SentenceTransformer(MODEL_PATH, device=DEVICE)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ FATAL: Failed to load CLIP model. Error: {e}")
    exit(1)

# -----------------------------
# Generate CLIP embedding
# -----------------------------
def generate_clip_embedding(image_path):
    image = Image.open(image_path).convert("RGB")
    embedding = model.encode(
        image,
        convert_to_tensor=True,
        device=DEVICE
    )
    return embedding.cpu().numpy().tolist()  # 512-dim vector

# -----------------------------
# API Endpoint
# -----------------------------
@app.route('/embed', methods=['POST'])
def embed_image():
    data = request.json
    image_path = data.get('filePath')

    if not image_path:
        return jsonify({"error": "Missing filePath"}), 400
    if not os.path.exists(image_path):
        return jsonify({"error": f"Image not found: {image_path}"}), 404

    try:
        clip_vector = generate_clip_embedding(image_path)
        return jsonify({"clipEmbedding": clip_vector}), 200
    except Exception as e:
        print(f"Error during embedding: {e}")
        return jsonify({"error": f"Python embedding failed: {str(e)}"}), 500

# -----------------------------
# Manual Test
# -----------------------------
if __name__ == '__main__':
    TEST_IMAGE_PATH = r'D:/Deepa/Internship/web app1/backend/Gemini_Generated_Image_tyivm6tyivm6tyiv.png'

    if os.path.exists(TEST_IMAGE_PATH):
        print(f"✅ Found test image: {TEST_IMAGE_PATH}")
        try:
            vector = generate_clip_embedding(TEST_IMAGE_PATH)
            print(f"✅ SUCCESS! Vector generated. Dimension = {len(vector)}")
            print(f"First 5 values: {vector[:5]}")
        except Exception as e:
            print(f"❌ ERROR generating embedding: {e}")
    else:
        print(f"❌ Test image does NOT exist: {TEST_IMAGE_PATH}")

    print("Starting Flask API...")
    app.run(port=5000)
