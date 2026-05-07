from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction
from .serializers import TransactionSerializer


@api_view(['GET', 'POST'])
def transaction_list_create(request):

    if request.method == 'GET':
        user_id = request.query_params.get('user') or request.query_params.get('userId')

        if not user_id:
            return Response([])

        transactions = Transaction.objects.filter(user_id=user_id)

        transactions = transactions.order_by('-id')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    serializer = TransactionSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def transaction_detail(request, pk):
    try:
        transaction = Transaction.objects.get(pk=pk)
    except Transaction.DoesNotExist:
        return Response({"message": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        serializer = TransactionSerializer(
            transaction,
            data=request.data,
            partial=request.method == 'PATCH'
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    transaction.delete()
    return Response({"message": "Transaction deleted successfully"}, status=status.HTTP_200_OK)
