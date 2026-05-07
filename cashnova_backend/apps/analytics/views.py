from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum

from apps.transactions.models import Transaction


@api_view(['GET'])
def dashboard_summary(request):
    transactions = Transaction.objects.all()
    user_id = request.query_params.get('user') or request.query_params.get('userId')

    if user_id:
        transactions = transactions.filter(user_id=user_id)

    total_income = transactions.filter(transaction_type='income').aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    total_expense = transactions.filter(transaction_type='expense').aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    balance = total_income - total_expense
    transaction_count = transactions.count()

    return Response({
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "transaction_count": transaction_count
    })
