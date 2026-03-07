// Razorpay integration — actual payment logic lives in apps/workers/src/routes/payments.ts
// This file is a legacy placeholder; Razorpay checkout is loaded client-side via CDN script.
export const razorpayClient = { createOrder: async () => { throw new Error('Use Workers /payments/create-order endpoint'); } };
// Kept for backward compat — old imports won't break
export const stripeClient = razorpayClient;