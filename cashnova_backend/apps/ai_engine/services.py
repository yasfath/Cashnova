import os
import joblib
import pandas as pd
from django.conf import settings


MODEL_PATH = os.path.join(
    settings.BASE_DIR,
    "apps",
    "ai_engine",
    "models",
    "model.pkl"
)

model = joblib.load(MODEL_PATH)


def generate_cashflow_insight(total_income, total_expense, balance):
    total_income = float(total_income or 0)
    total_expense = float(total_expense or 0)
    balance = float(balance or 0)

    if total_income == 0 and total_expense == 0:
        return "No transaction data available yet. Add income and expenses to generate insights."

    if balance < 0:
        return "Your expenses are higher than your income. Reduce non-essential spending."

    if total_expense > total_income * 0.7:
        return "Your expenses are more than 70% of income. Try improving savings."

    return "Your cash flow looks healthy."


def predict_expense(total_income):
    input_data = pd.DataFrame({
        "total_income": [float(total_income)]
    })

    prediction = model.predict(input_data)
    return round(float(prediction[0]), 2)


def generate_insights(total_income, predicted_expense):
    total_income = float(total_income)
    predicted_expense = float(predicted_expense)
    savings = total_income - predicted_expense

    if predicted_expense > total_income:
        return ["Expenses may exceed income."]

    if savings < 5000:
        return ["Low savings expected."]

    if predicted_expense > total_income * 0.7:
        return ["High spending ratio detected."]

    return ["Financial condition looks stable."]
