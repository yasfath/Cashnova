from services.analytics_service import get_dashboard_summary


def generate_ai_insight():
    summary = get_dashboard_summary()

    total_income = summary["total_income"]
    total_expense = summary["total_expense"]
    balance = summary["balance"]

    if total_income == 0 and total_expense == 0:
        insight = "No transaction data available yet. Add income and expenses to generate insights."
    elif balance < 0:
        insight = "Your expenses are higher than your income. Reduce non-essential spending to improve cash flow."
    elif total_expense > total_income * 0.7:
        insight = "Your expenses are consuming more than 70% of income. Try improving savings this month."
    else:
        insight = "Your cash flow looks healthy. Continue tracking income and expenses regularly."

    summary["insight"] = insight
    return summary