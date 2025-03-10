import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Load trained models (ensure these are trained on 120-feature inputs)
mlr_model = joblib.load("models/bnb_regression_model.pkl")
xgb_model = joblib.load("models/bnb_xgboost_model.pkl")
lgbm_model = joblib.load("models/bnb_lightgbm_model.pkl")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

class PredictionRequest(BaseModel):
    features: list[float]

@app.post("/predict/{model_name}")
def predict(model_name: str, request: PredictionRequest):
    models = {
        "bnb_regression_model": mlr_model,
        "bnb_xgboost_model": xgb_model,
        "bnb_lightgbm_model": lgbm_model
    }
    if model_name not in models:
        return {"error": "Invalid model name. Use 'bnb_regression_model', 'bnb_xgboost_model', or 'bnb_lightgbm_model'."}
    
    model = models[model_name]
    features = np.array([request.features])
    prediction = model.predict(features)
    
    return {"model": model_name, "prediction": prediction.tolist()}