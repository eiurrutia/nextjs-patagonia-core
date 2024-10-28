from transformers import CLIPProcessor, CLIPModel
from PIL import Image  # Importar PIL para manejar imágenes
import numpy as np
import sys

# Path to pre-downloaded model
model_path = './public/models/clip-vit-base-patch32'

# Load the model and processor
model = CLIPModel.from_pretrained(model_path, local_files_only=True)
processor = CLIPProcessor.from_pretrained(model_path, local_files_only=True)


# Function to get image embedding
def get_image_embedding(image_path):
    image = Image.open(image_path)
    inputs = processor(images=image, return_tensors="pt")
    embedding = model.get_image_features(**inputs).detach().numpy()
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.tolist()


if __name__ == "__main__":
    image_path = sys.argv[1]
    embedding = get_image_embedding(image_path)
    print(embedding)
