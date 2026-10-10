const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Called by client if timer runs out, or can be run via pubsub scheduler
exports.expireOrder = onCall(async (request) => {
  const { orderId } = request.data;
  
  if (!orderId) {
    throw new HttpsError('invalid-argument', 'Missing orderId');
  }

  const db = getFirestore();
  const orderRef = db.collection('pendingPayments').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError('not-found', 'Order not found');
  }

  const data = orderSnap.data();
  if (data.status !== 'pending') {
    // Already paid, failed, or expired. Do nothing.
    return { success: true, status: data.status };
  }

  // Idempotent update
  await orderRef.update({
    status: 'expired',
    expiredAt: FieldValue.serverTimestamp(),
  });

  return { success: true, status: 'expired' };
});
