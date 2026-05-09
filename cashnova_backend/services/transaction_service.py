from apps.transactions.models import Transaction


def get_all_transactions():
    return Transaction.objects.all().order_by('-id')


def create_transaction(data):
    return Transaction.objects.create(**data)