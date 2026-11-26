
/* =========================================
   1. API CONFIGURATION
========================================= */

// Replace this URL if your ngrok URL changes.
const API_URL = "http://127.0.0.1:8000/predict";


/* =========================================
   2. GET HTML ELEMENTS
========================================= */

const reviewInput = document.getElementById("reviewInput");
const charCount = document.getElementById("charCount");

const clearBtn = document.getElementById("clearBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");

const sampleButtons = document.querySelectorAll(".sample-btn");

const errorMessage = document.getElementById("errorMessage");
const loadingState = document.getElementById("loadingState");
const resultCard = document.getElementById("resultCard");

const sentimentResult = document.getElementById("sentimentResult");
const resultDescription = document.getElementById("resultDescription");
const sentimentIcon = document.getElementById("sentimentIcon");

const decisionScore = document.getElementById("decisionScore");
const scoreBar = document.getElementById("scoreBar");


/* =========================================
   3. CHARACTER COUNTER
========================================= */

// Updates the character count while the user types.

reviewInput.addEventListener("input", () => {
    const currentLength = reviewInput.value.length;

    charCount.textContent = `${currentLength} / 5000 characters`;
});


/* =========================================
   4. SAMPLE REVIEW BUTTONS
========================================= */

// Fills the textarea with an example review.

sampleButtons.forEach((button) => {

    button.addEventListener("click", () => {

        reviewInput.value = button.dataset.review;

        reviewInput.dispatchEvent(new Event("input"));

        hidePreviousResults();

        reviewInput.focus();
    });

});


/* =========================================
   5. CLEAR REVIEW
========================================= */

// Clears the input and resets the interface.

clearBtn.addEventListener("click", () => {

    reviewInput.value = "";

    reviewInput.dispatchEvent(new Event("input"));

    hidePreviousResults();

    reviewInput.focus();
});


/* =========================================
   6. HIDE PREVIOUS RESULTS
========================================= */

// Keeps the interface clean before a new analysis.

function hidePreviousResults() {

    resultCard.hidden = true;

    loadingState.hidden = true;

    errorMessage.hidden = true;

    errorMessage.textContent = "";

}


/* =========================================
   7. ANALYZE REVIEW
========================================= */

// Sends the review to our FastAPI backend.

analyzeBtn.addEventListener("click", analyzeReview);

async function analyzeReview() {

    const review = reviewInput.value.trim();

    // Validate the input before sending it.

    if (!review) {

        errorMessage.textContent =
            "Please enter a movie review before analyzing.";

        errorMessage.hidden = false;

        reviewInput.focus();

        return;
    }

    // Reset the previous interface.

    hidePreviousResults();

    // Display loading state.

    loadingState.hidden = false;

    analyzeBtn.disabled = true;

    analyzeBtn.querySelector("span:first-child").textContent =
        "Analyzing...";


    try {

        // Send the review to FastAPI.

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                review: review
            })

        });


        // Check whether the server returned an error.

        if (!response.ok) {

            const errorData = await response.json().catch(() => null);

            throw new Error(
                errorData?.detail || `Server error: ${response.status}`
            );
        }


        // Convert the response into JavaScript data.

        const data = await response.json();


        // Display the prediction.

        displayResult(data);


    } catch (error) {

        console.error("Analysis error:", error);

        errorMessage.textContent =
            "Unable to analyze your review. Please check that the API server and ngrok connection are running.";

        errorMessage.hidden = false;

    } finally {

        // Restore the interface whether successful or not.

        loadingState.hidden = true;

        analyzeBtn.disabled = false;

        analyzeBtn.querySelector("span:first-child").textContent =
            "Analyze Sentiment";

    }

}


/* =========================================
   8. DISPLAY PREDICTION
========================================= */

// Displays the sentiment and decision score returned by FastAPI.

function displayResult(data) {

    const sentiment = data.sentiment;

    const score = Number(data.decision_score);

    // Validate the backend response.

    if (
        !["Positive", "Negative"].includes(sentiment) ||
        !Number.isFinite(score)
    ) {
        throw new Error("The API returned an unexpected response.");
    }

    // Update sentiment information.

    sentimentResult.textContent = sentiment;

    if (sentiment === "Positive") {

        resultCard.classList.remove("negative");

        sentimentIcon.textContent = "✦";

        resultDescription.textContent =
            "This review expresses an overall positive opinion.";

    } else {

        resultCard.classList.add("negative");

        sentimentIcon.textContent = "✕";

        resultDescription.textContent =
            "This review expresses an overall negative opinion.";

    }

    // Display the model's decision score.

    decisionScore.textContent = score.toFixed(4);

    // Visualize the magnitude of the score.
    // This is NOT a probability or confidence percentage.

    const scoreMagnitude = Math.min(
        Math.abs(score) * 20,
        100
    );

    scoreBar.style.width = `${scoreMagnitude}%`;

    // Show the completed result.

    resultCard.hidden = false;

    resultCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* =========================================
   9. ANALYZE ANOTHER REVIEW
========================================= */

// Resets the analyzer for another prediction.

resetBtn.addEventListener("click", () => {

    reviewInput.value = "";

    reviewInput.dispatchEvent(new Event("input"));

    hidePreviousResults();

    reviewInput.focus();

});
