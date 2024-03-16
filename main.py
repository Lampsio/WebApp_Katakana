from fastapi import FastAPI, File, UploadFile , HTTPException , Request , Form , Body 
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tensorflow as tf
import numpy as np
import io
from io import BytesIO
import base64
from fastapi.responses import JSONResponse
from base64 import b64decode
from pydantic import BaseModel


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = tf.keras.models.load_model('Katakana3.h5')  # Wczytaj swój wytrenowany model

# Przygotowanie listy nazw klas
kana_names = [
    'a', 'ba', 'be', 'bi', 'bo', 'bu', 'chi', 'da', 'de', 'do',
    'dzi', 'dzu', 'e', 'fu', 'ga', 'ge', 'gi', 'go', 'gu', 'ha',
    'he', 'hi', 'ho', 'i', 'ji', 'ka', 'ke', 'ki', 'ko', 'ku',
    'long',
    'ma', 'me', 'mi', 'mo', 'mu','n','na', 'ne', 'ni', 'no', 'nu',
    'o', 'pa', 'pe', 'pi', 'po', 'pu', 'ra', 're', 'ri', 'ro',
    'ru', 'sa', 'se', 'shi', 'so', 'su', 'ta', 'te', 'to', 'tsu',
    'u', 'wa','we','wi', 'wo', 'ya', 'yo', 'yu', 'za', 'ze', 'zo', 'zu'
]

@app.post("/predict")
async def predict(file: UploadFile):

    # Odczytaj przesłany plik
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))

    image_mode = image.mode

    # Sprawdź, czy obraz ma 4 kanały
    if image_mode == "RGBA":
    # Konwersja obrazu RGBA do RGB
        image = image.convert("RGB")

    # Przeskaluj obraz do wymiarów 100x100
    image_resized = image.resize((100, 100))

    # Przekształć obraz do tablicy numpy
    image_array = np.array(image_resized)

    # Normalizuj wartości pikseli do zakresu [0, 1]
    image_array_normalized = image_array / 255.0

     # Dodaj wymiar do tablicy (dla modeli Keras)
    image_with_batch_dim = np.expand_dims(image_array_normalized, axis=0)

    # Przewiduj klasę obrazu
    prediction = model.predict(image_with_batch_dim)

    # Pobierz 5 klas z najwyższym prawdopodobieństwem
    top_5_pred_indices = np.argsort(prediction[0])[-5:][::-1]
    top_5_pred_probabilities = prediction[0][top_5_pred_indices]
    top_5_pred_classes = [kana_names[i] for i in top_5_pred_indices]

    # Wygeneruj odpowiedź
    response = {
        "classes": top_5_pred_classes,
        "probabilities": top_5_pred_probabilities.tolist(),
    }

    return response

# Model danych przyjmowanych przez API
class ImageData(BaseModel):
    image: str

# Endpoint do przetwarzania danych obrazu
@app.post("/upload-image")
def upload_image(image_data: ImageData):
        # Wyodrębnienie danych base64
        # print(image_data)
        base64_data = image_data.image

        # Dekodowanie base64 do obrazu
        image_data = base64.b64decode(base64_data)
        #image_bytes = BytesIO(base64.b64decode(base64_data))
        #image = Image.open(image_bytes)
        output = io.BytesIO(image_data)

        with open("image.jpg", "wb") as f:
            f.write(output.read())

        with open("image.jpg", "rb") as f:
            image_bytes = f.read()

        # Utwórz obraz z odczytanych danych
        image = Image.open(io.BytesIO(image_bytes))

        image_mode = image.mode

        # Sprawdź, czy obraz ma 4 kanały
        if image_mode == "RGBA":
        # Konwersja obrazu RGBA do RGB
            image = image.convert("RGB")

        # Przeskaluj obraz do wymiarów 100x100
        image_resized = image.resize((100, 100))

        # Przekształć obraz do tablicy numpy
        image_array = np.array(image_resized)

        # Normalizuj wartości pikseli do zakresu [0, 1]
        image_array_normalized = image_array / 255.0

        # Dodaj wymiar do tablicy (dla modeli Keras)
        image_with_batch_dim = np.expand_dims(image_array_normalized, axis=0)

        # Przewiduj klasę obrazu
        prediction = model.predict(image_with_batch_dim)

        # Pobierz 5 klas z najwyższym prawdopodobieństwem
        top_5_pred_indices = np.argsort(prediction[0])[-5:][::-1]
        top_5_pred_probabilities = prediction[0][top_5_pred_indices]
        top_5_pred_classes = [kana_names[i] for i in top_5_pred_indices]

        # Wygeneruj odpowiedź
        response = {
            "classes": top_5_pred_classes,
            "probabilities": top_5_pred_probabilities.tolist(),
        }

        return response
    
