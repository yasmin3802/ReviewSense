
import re
import joblib
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware


# 1. Define project paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


# 2. Load saved ML components
model = joblib.load(MODEL_DIR / "ReviewSense_SVM_Model.pkl")
vectorizer = joblib.load(MODEL_DIR / "ReviewSense_TFIDF_Vectorizer.pkl")
custom_stop_words = joblib.load(MODEL_DIR / "ReviewSense_Stopwords.pkl")


# 3. Initialize FastAPI
app = FastAPI(
    title="ReviewSense API",
    description="Movie Review Sentiment Classification API",
    version="1.0"
)


# 4. Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 5. Define request structure
class ReviewRequest(BaseModel):
    review: str = Field(min_length=1)

    @field_validator("review")
    @classmethod
    def validate_review(cls, value):
        if not value.strip():
            raise ValueError("Review cannot be empty.")
        return value


# 6. Text preprocessing
def preprocess_text(text):

    text = str(text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.lower()
    text = re.sub(r"[^\w\s']", "", text)

    words = text.split()

    filtered_words = [
        word for word in words
        if word not in custom_stop_words
    ]

    return " ".join(filtered_words)


# 7. Home endpoint
@app.get("/")
def home():
    return {"message": "Welcome to ReviewSense API!"}


# 8. Prediction endpoint
@app.post("/predict")
def predict(request: ReviewRequest):

    cleaned_review = preprocess_text(request.review)

    review_vector = vectorizer.transform([cleaned_review])

    prediction = model.predict(review_vector)[0]
    score = model.decision_function(review_vector)[0]

    sentiment = "Positive" if prediction == 1 else "Negative"

    return {
        "review": request.review,
        "sentiment": sentiment,
        "decision_score": round(float(score), 4)
    }
