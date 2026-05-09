from datetime import datetime


def format_currency(amount):
    """
    Format number into currency string
    """
    return f"₹{float(amount):,.2f}"


def calculate_balance(income, expense):
    return income - expense


def current_date():
    return datetime.now().date()