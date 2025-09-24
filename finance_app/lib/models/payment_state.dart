class PaymentState {
  final List<dynamic> payments;
  final bool isLoading;
  final String? error;

  const PaymentState({
    required this.payments,
    required this.isLoading,
    this.error,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PaymentState &&
        other.payments.length == payments.length &&
        other.isLoading == isLoading &&
        other.error == error;
  }

  @override
  int get hashCode {
    return Object.hash(
      payments.length,
      isLoading,
      error,
    );
  }

  PaymentState copyWith({
    List<dynamic>? payments,
    bool? isLoading,
    String? error,
  }) {
    return PaymentState(
      payments: payments ?? this.payments,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}