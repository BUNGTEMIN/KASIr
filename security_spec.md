# Security Specification - KassaPro POS

## Data Invariants
1. A transaction cannot be created without a valid cashier (userId).
2. A product's price must be non-negative.
3. Only admins can modify products or categories.
4. Cashiers can create transactions but not modify them after creation (except for status changes if permitted, though for POS we usually want immutability).
5. Users can only see their own profile unless they are admins.

## The Dirty Dozen Payloads (Target: DENIED)
1. **Unauth Create**: Attempt to create product without logging in.
2. **Price Poisoning**: Create product with negative price.
3. **Identity Spoofing**: Create transaction with another user's ID.
4. **Role Escalation**: Update own user profile to set `role: 'admin'`.
5. **Phantom Product**: Create transaction referencing non-existent product (application logic check, but rules will check existence of user).
6. **Transaction Sabotage**: Update another cashier's transaction.
7. **Massive ID**: Inject 1MB string as product ID.
8. **Field Injection**: Add `isVerified: true` to a product during creation.
9. **Negative Stock**: Update product stock to -50.
10. **Transaction Overwrite**: Modify items in a 'paid' transaction.
11. **Shadow User**: Create a user profile with an email different from auth.token.email.
12. **PII Leak**: Non-admin reading list of all users' private info.

## The Test Runner
(Tests would be implemented in `firestore.rules.test.ts` if environment supports it, but I will simulate these constraints in the rules).
