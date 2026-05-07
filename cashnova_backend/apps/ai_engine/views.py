from collections import defaultdict

from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum

from apps.transactions.models import Transaction
from .services import generate_cashflow_insight, predict_expense, generate_insights


def _as_float(value):
    return float(value or 0)


def _money(value):
    return f"{_as_float(value):,.2f}"


def _month_bounds():
    today = timezone.localdate()
    start = today.replace(day=1)

    if start.month == 12:
        next_start = start.replace(year=start.year + 1, month=1)
    else:
        next_start = start.replace(month=start.month + 1)

    if start.month == 1:
        previous_start = start.replace(year=start.year - 1, month=12)
    else:
        previous_start = start.replace(month=start.month - 1)

    return today, start, next_start, previous_start


def _build_assistant_context(transactions):
    transaction_list = list(
        transactions.select_related("category").order_by("-transaction_date", "-id")
    )
    total_income = sum(
        _as_float(transaction.amount)
        for transaction in transaction_list
        if transaction.transaction_type == "income"
    )
    total_expense = sum(
        _as_float(transaction.amount)
        for transaction in transaction_list
        if transaction.transaction_type == "expense"
    )
    balance = total_income - total_expense
    today, month_start, next_month_start, previous_month_start = _month_bounds()
    category_totals = defaultdict(float)

    for transaction in transaction_list:
        if transaction.transaction_type == "expense":
            category_name = transaction.category.name if transaction.category else "Others"
            category_totals[category_name] += _as_float(transaction.amount)

    current_month_transactions = [
        transaction
        for transaction in transaction_list
        if month_start <= transaction.transaction_date < next_month_start
    ]
    previous_month_transactions = [
        transaction
        for transaction in transaction_list
        if previous_month_start <= transaction.transaction_date < month_start
    ]
    today_transactions = [
        transaction for transaction in transaction_list if transaction.transaction_date == today
    ]

    def sum_by_type(items, transaction_type):
        return sum(
            _as_float(transaction.amount)
            for transaction in items
            if transaction.transaction_type == transaction_type
        )

    current_month_income = sum_by_type(current_month_transactions, "income")
    current_month_expense = sum_by_type(current_month_transactions, "expense")
    previous_month_income = sum_by_type(previous_month_transactions, "income")
    previous_month_expense = sum_by_type(previous_month_transactions, "expense")
    top_category = max(category_totals.items(), key=lambda item: item[1], default=("None", 0))
    recent_transaction = transaction_list[0] if transaction_list else None
    savings_rate = ((balance / total_income) * 100) if total_income > 0 else 0

    return {
        "transactions": transaction_list,
        "transaction_count": len(transaction_list),
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "current_month_income": current_month_income,
        "current_month_expense": current_month_expense,
        "current_month_balance": current_month_income - current_month_expense,
        "previous_month_income": previous_month_income,
        "previous_month_expense": previous_month_expense,
        "previous_month_balance": previous_month_income - previous_month_expense,
        "today_income": sum_by_type(today_transactions, "income"),
        "today_expense": sum_by_type(today_transactions, "expense"),
        "top_category_name": top_category[0],
        "top_category_amount": top_category[1],
        "recent_transaction": recent_transaction,
        "savings_rate": savings_rate,
    }


def _contains_any(text, words):
    return any(word in text for word in words)


def _build_assistant_reply(message, context):
    lowered_message = message.lower()
    total_income = context["total_income"]
    total_expense = context["total_expense"]
    balance = context["balance"]

    if context["transaction_count"] == 0:
        if _contains_any(lowered_message, ["income", "revenue", "sales", "varavu"]):
            return "Your total income is 0.00. I do not see any income entries for this account yet."

        if _contains_any(lowered_message, ["expense", "spend", "spending", "selavu"]):
            return "Your total expense is 0.00. I do not see any expense entries for this account yet."

        if _contains_any(lowered_message, ["balance", "cash", "remaining", "irukku", "left"]):
            return "Your current balance is 0.00 because this account has no transactions yet."

        if _contains_any(lowered_message, ["hello", "hi", "hey"]):
            return "Hi. I am ready to help with your Cashnova account. Add income or expense entries and I can calculate totals, balance, spending categories, and forecasts."

        return (
            "I do not see any transactions yet. Add at least one income or expense entry, "
            "then I can answer totals, balance, categories, and forecasts accurately."
        )

    if _contains_any(lowered_message, ["hello", "hi", "hey"]):
        return (
            f"Hi. I can answer from your {context['transaction_count']} Cashnova records. "
            f"Current balance is {_money(balance)}, income is {_money(total_income)}, "
            f"and expense is {_money(total_expense)}."
        )

    if _contains_any(lowered_message, ["today", "inniku", "today's"]):
        return (
            f"Today income is {_money(context['today_income'])}, today expense is "
            f"{_money(context['today_expense'])}, and today's net is "
            f"{_money(context['today_income'] - context['today_expense'])}."
        )

    if _contains_any(lowered_message, ["previous", "last month", "pona month"]):
        return (
            f"Previous month income was {_money(context['previous_month_income'])}, expense was "
            f"{_money(context['previous_month_expense'])}, and net balance was "
            f"{_money(context['previous_month_balance'])}."
        )

    if _contains_any(lowered_message, ["this month", "month", "monthly", "intha month"]):
        return (
            f"This month income is {_money(context['current_month_income'])}, expense is "
            f"{_money(context['current_month_expense'])}, and net balance is "
            f"{_money(context['current_month_balance'])}."
        )

    if _contains_any(lowered_message, ["balance", "cash", "remaining", "irukku", "left"]):
        return (
            f"Your current balance is {_money(balance)}. Total income is {_money(total_income)} "
            f"and total expense is {_money(total_expense)}."
        )

    if _contains_any(lowered_message, ["predict", "forecast", "future"]):
        predicted_expense = predict_expense(total_income)
        suggestions = " ".join(generate_insights(total_income, predicted_expense))
        return (
            f"Predicted expense based on recorded income is {_money(predicted_expense)}. "
            f"{suggestions} Current balance is {_money(balance)}."
        )

    if _contains_any(lowered_message, ["income", "revenue", "sales", "varavu"]):
        return (
            f"Your total income is {_money(total_income)} across "
            f"{sum(1 for item in context['transactions'] if item.transaction_type == 'income')} "
            "income entries."
        )

    if _contains_any(lowered_message, ["expense", "spend", "spending", "selavu"]):
        return (
            f"Your total expense is {_money(total_expense)}. Biggest expense category is "
            f"{context['top_category_name']} with {_money(context['top_category_amount'])}."
        )

    if _contains_any(lowered_message, ["category", "highest", "biggest", "top"]):
        return (
            f"Top expense category is {context['top_category_name']} with "
            f"{_money(context['top_category_amount'])} spent."
        )

    if _contains_any(lowered_message, ["recent", "latest", "last transaction"]):
        transaction = context["recent_transaction"]
        category_name = transaction.category.name if transaction.category else "Others"
        return (
            f"Latest transaction is {transaction.title}: {transaction.transaction_type} "
            f"{_money(transaction.amount)} in {category_name} on {transaction.transaction_date}."
        )

    if _contains_any(lowered_message, ["saving", "savings", "save"]):
        return (
            f"Your current savings rate is {context['savings_rate']:.1f}%. "
            f"Income is {_money(total_income)}, expense is {_money(total_expense)}, "
            f"and retained balance is {_money(balance)}."
        )

    if _contains_any(lowered_message, ["advice", "suggest", "help", "improve", "tips"]):
        insight = generate_cashflow_insight(total_income, total_expense, balance)
        if context["top_category_amount"] > 0:
            return (
                f"{insight} Start by reviewing {context['top_category_name']}, your highest "
                f"expense category at {_money(context['top_category_amount'])}. "
                f"Your savings rate is {context['savings_rate']:.1f}%."
            )

        return insight

    insight = generate_cashflow_insight(total_income, total_expense, balance)
    return (
        f"{insight} Summary: income {_money(total_income)}, expense {_money(total_expense)}, "
        f"balance {_money(balance)}, records {context['transaction_count']}."
    )


@api_view(['GET'])
def ai_insight(request):
    user_id = request.query_params.get('user') or request.query_params.get('userId')

    if not user_id:
        transactions = Transaction.objects.none()
    else:
        transactions = Transaction.objects.filter(user_id=user_id)

    total_income = transactions.filter(transaction_type='income').aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    total_expense = transactions.filter(transaction_type='expense').aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    balance = total_income - total_expense
    insight = generate_cashflow_insight(total_income, total_expense, balance)

    return Response({
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "insight": insight
    })


@api_view(['POST'])
def predict_cashflow(request):
    total_income = request.data.get("total_income")

    if total_income is None:
        return Response({
            "status": "error",
            "message": "total_income is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    predicted_expense = predict_expense(total_income)
    insights = generate_insights(total_income, predicted_expense)

    return Response({
        "status": "success",
        "input": {
            "total_income": total_income
        },
        "prediction": {
            "predicted_expense": predicted_expense
        },
        "insights": insights
    })


@api_view(['POST'])
def assistant_reply(request):
    message = str(request.data.get("message") or "").strip()

    if not message:
        return Response({
            "status": "error",
            "message": "message is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    user_id = request.data.get("user") or request.data.get("userId")

    if not user_id:
        transactions = Transaction.objects.none()
    else:
        transactions = Transaction.objects.filter(user_id=user_id)

    context = _build_assistant_context(transactions)
    reply = _build_assistant_reply(message, context)

    return Response({
        "status": "success",
        "reply": reply,
        "summary": {
            "total_income": context["total_income"],
            "total_expense": context["total_expense"],
            "balance": context["balance"],
            "transaction_count": context["transaction_count"],
            "top_category": context["top_category_name"],
        }
    })
