import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/tenantContext';
import { BillingService, CheckoutInput } from './billingService';

const router = Router({ mergeParams: true });

/**
 * POST /api/v1/phc/:phcId/billing/checkout
 * Idempotent FEFO checkout (Architecture SS3.3.1).
 * 409 on insufficient stock; 200 with already_existed:true on duplicate client_txn_id.
 */
router.post('/billing/checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const { client_txn_id, patient_ref, dispensed_by_staff_id, items, client_timestamp } = req.body;

    if (!client_txn_id) {
      res.status(400).json({ error_code: 'MISSING_CLIENT_TXN_ID', message: 'client_txn_id is required for idempotency.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error_code: 'EMPTY_BILLING_ITEMS', message: 'items array must not be empty.' });
      return;
    }
    for (const item of items) {
      if (!item.medicine_id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({ error_code: 'INVALID_ITEM', message: 'Each item requires medicine_id and a positive quantity.' });
        return;
      }
    }

    const input: CheckoutInput = { client_txn_id, patient_ref, dispensed_by_staff_id, items, client_timestamp };
    const result = await BillingService.checkoutRest(phcId, input);

    if (result.outcome === 'insufficient_stock') {
      res.status(409).json({
        error_code: 'INSUFFICIENT_STOCK',
        message: 'One or more requested medicines cannot be fulfilled.',
        shortfalls: result.shortfalls,
      });
      return;
    }

    const statusCode = result.already_existed ? 200 : 201;
    res.status(statusCode).json({
      data: {
        transaction_id: result.transaction_id,
        client_txn_id: result.client_txn_id,
        already_existed: result.already_existed,
        total_amount: result.total_amount,
        dispensed_items: result.dispensed_items,
      },
    });
  } catch (err: any) {
    console.error('POST /billing/checkout error', err);
    res.status(500).json({ error_code: 'CHECKOUT_FAILED', message: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/v1/phc/:phcId/billing/transactions
 * Most recent billing transactions for this PHC (up to 500).
 */
router.get('/billing/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId } = req.params;
    const result = await BillingService.listTransactions(phcId, req.tenantClaims!);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('GET /billing/transactions error', err);
    res.status(500).json({ error_code: 'LIST_FAILED', message: err.message });
  }
});

/**
 * GET /api/v1/phc/:phcId/billing/transactions/:transactionId
 * Full transaction detail including all dispensed_items.
 */
router.get('/billing/transactions/:transactionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phcId, transactionId } = req.params;
    const result = await BillingService.getTransactionDetails(phcId, transactionId, req.tenantClaims!);
    res.status(200).json({ data: result });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({ error_code: err.message || 'DETAIL_FAILED' });
  }
});

export default router;