# from transformers import pipeline

# detector = pipeline(
#     "image-classification",
#     model="umm-maybe/AI-image-detector"
# )

# result = detector("D:/Deepa/Internship/web app/frontend/AI/Gemini_Generated_Image_tyivm6tyivm6tyiv.png")
# print(result)
# ai_score = next(
#     item["score"] for item in result
#     if item["label"].lower() in ["ai-generated", "artificial"]
# )

# print("AI Probability:", round(ai_score, 3))




import cv2
import numpy as np

img = cv2.imread("D:/Deepa/Internship/web app/backend/Gemini_Generated_Image_tyivm6tyivm6tyiv.png", cv2.IMREAD_GRAYSCALE)

f = np.fft.fft2(img)
fshift = np.fft.fftshift(f)
mag = np.log(np.abs(fshift) + 1)

h, w = mag.shape
center_h, center_w = h//2, w//2

hf = mag[
    center_h - h//4 : center_h + h//4,
    center_w - w//4 : center_w + w//4
]

hf_energy = np.mean(hf)
print("High Frequency Energy:", hf_energy)
