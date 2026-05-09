from django.db.models import Sum
from apps.transactions.models import Transaction


def get_dashboard_summary():
    total_income = Transaction.objects.filter(transaction_type='income').aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    total_expense = Transaction.objects.filter(transaction_type='expense').aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "transaction_count": Transaction.objects.count()
    }