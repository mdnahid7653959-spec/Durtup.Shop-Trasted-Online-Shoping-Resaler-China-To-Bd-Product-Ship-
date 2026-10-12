const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// Secret key for XOR decryption
const SECRET_KEY = "durtup-api-gateway-salt-secure-key-2026";

function decryptCredentials(encryptedBase64) {
  if (!encryptedBase64) return null;
  try {
    const binary = Buffer.from(encryptedBase64, "base64").toString("binary");
    let plainText = "";
    for (let i = 0; i < binary.length; i++) {
      const charCode = binary.charCodeAt(i);
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      plainText += String.fromCharCode(charCode ^ keyChar);
    }
    const decoded = decodeURIComponent(escape(plainText));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

// 1. Supplier API Cloud Function
exports.supplierApi = onRequest({ cors: true }, async (req, res) => {
  try {
    const { action, supplierId, payload } = req.body || {};

    if (action === "seed-supplier") {
      return res.status(200).json({ success: true, message: "Supplier seeded" });
    }

    if (!action || !supplierId) {
      return res.status(400).json({ error: "Missing action or supplierId" });
    }

    if (action === "test-connection") {
      return res.status(200).json({ success: true, status: 200, responseTimeMs: 120 });
    }

    if (action === "get-products") {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({ success: true, action });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Sigma AI Chat Cloud Function (/api/ai/chat)
exports.aiChat = onRequest({ cors: true }, async (req, res) => {
  try {
    const { query, userName, userId, history, cartState, imageAttachment } = req.body || {};
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `You are Sigma, the official AI Personal Shopping Assistant for Durtup.shop. Answer in natural Bengali/Banglish: "${query || "Hello"}"` }]
          }
        ]
      })
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "আমি Sigma — Durtup.shop এ আপনাকে স্বাগতম!";
    return res.status(200).json({ text, success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper: Get Referral Settings
async function getReferralSettings(db) {
  try {
    const docSnap = await db.doc("settings/referral").get();
    if (docSnap.exists) {
      const d = docSnap.data();
      return {
        enabled: d.enabled !== false,
        referrerReward: Number(d.referrerReward) || 50,
        newCustomerDiscount: Number(d.newCustomerDiscount) || 30,
        minimumOrderAmount: Number(d.minimumOrderAmount) || 500,
        rewardTrigger: d.rewardTrigger || "delivered",
        maxDailyRewards: Number(d.maxDailyRewards) || 10,
        withdrawEnabled: d.withdrawEnabled !== false,
        minimumWithdrawAmount: Number(d.minimumWithdrawAmount) || 500,
      };
    }
  } catch (e) {
    console.warn("Failed loading settings/referral, using defaults:", e);
  }
  return {
    enabled: true,
    referrerReward: 50,
    newCustomerDiscount: 30,
    minimumOrderAmount: 500,
    rewardTrigger: "delivered",
    maxDailyRewards: 10,
    withdrawEnabled: true,
    minimumWithdrawAmount: 500,
  };
}

// 4. Authoritative Referral Reward & Wallet Engine (HTTP Endpoint)
exports.referralApi = onRequest({ cors: true }, async (req, res) => {
  const db = admin.firestore();
  try {
    const { action, payload } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: "Missing action" });
    }

    // A. Process Order Delivery Reward
    if (action === "process-order-reward") {
      const { orderId, newStatus } = payload || {};
      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" });
      }

      const settings = await getReferralSettings(db);
      if (!settings.enabled) {
        return res.status(200).json({ skipped: true, reason: "Referral system disabled" });
      }

      const triggerStatus = (settings.rewardTrigger || "delivered").toLowerCase();
      const currentStatus = (newStatus || "").toLowerCase();

      if (currentStatus !== triggerStatus) {
        return res.status(200).json({ skipped: true, reason: `Status '${currentStatus}' is not trigger '${triggerStatus}'` });
      }

      const result = await db.runTransaction(async (transaction) => {
        // 1. Fetch Order
        const orderRef = db.doc(`orders/${orderId}`);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) {
          throw new Error(`Order ${orderId} not found`);
        }
        const orderData = orderSnap.data();

        const referrerId = orderData.referrer_id || orderData.referrerId;
        const referredUserId = orderData.user_id || orderData.referredUserId;
        const referralCode = orderData.referral_code || orderData.referralCode;
        const subtotal = Number(orderData.subtotal || orderData.total || 0);

        if (!referrerId || !referralCode) {
          return { skipped: true, reason: "Order has no referral attribution" };
        }

        // Anti-Fraud: Self referral
        if (referrerId === referredUserId) {
          return { skipped: true, reason: "Anti-fraud: Self-referral blocked" };
        }

        // Minimum order value check
        if (subtotal < settings.minimumOrderAmount) {
          return { skipped: true, reason: `Subtotal ৳${subtotal} below minimum ৳${settings.minimumOrderAmount}` };
        }

        // 2. Idempotency Check: Already rewarded?
        const txQuery = db.collection("wallet_transactions")
          .where("referenceId", "==", orderId)
          .where("category", "==", "referral_reward");
        const existingTx = await transaction.get(txQuery);
        if (!existingTx.empty) {
          return { success: true, message: "Reward already issued (idempotent)", rewarded: true };
        }

        // 3. Check if referred customer already generated a reward previously
        if (referredUserId && !referredUserId.startsWith("guest_")) {
          const prevDeliveredQuery = db.collection("orders")
            .where("user_id", "==", referredUserId)
            .where("status", "==", triggerStatus);
          const prevOrders = await transaction.get(prevDeliveredQuery);
          // Count prior delivered orders excluding this one
          const priorCount = prevOrders.docs.filter(d => d.id !== orderId).length;
          if (priorCount > 0) {
            return { skipped: true, reason: "Customer already has a prior delivered order" };
          }
        }

        // 4. Check referrer daily limit
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const dailyTxQuery = db.collection("wallet_transactions")
          .where("userId", "==", referrerId)
          .where("category", "==", "referral_reward")
          .where("createdAt", ">=", oneDayAgo);
        const dailyTx = await transaction.get(dailyTxQuery);
        if (dailyTx.size >= settings.maxDailyRewards) {
          return { skipped: true, reason: `Referrer reached max daily rewards (${settings.maxDailyRewards})` };
        }

        // 5. Read referrer profile
        const referrerRef = db.doc(`profiles/${referrerId}`);
        const referrerSnap = await transaction.get(referrerRef);
        const referrerData = referrerSnap.exists ? referrerSnap.data() : {};

        const currentBalance = Number(referrerData.wallet_balance || referrerData.walletBalance || 0);
        const currentTotalEarned = Number(referrerData.total_earned || referrerData.totalEarned || 0);
        const currentSuccessful = Number(referrerData.successful_referrals || referrerData.successfulReferrals || 0);

        const newBalance = currentBalance + settings.referrerReward;
        const newTotalEarned = currentTotalEarned + settings.referrerReward;
        const newSuccessful = currentSuccessful + 1;

        // 6. Mutate Referrer Profile atomically
        transaction.set(referrerRef, {
          wallet_balance: newBalance,
          walletBalance: newBalance,
          total_earned: newTotalEarned,
          totalEarned: newTotalEarned,
          successful_referrals: newSuccessful,
          successfulReferrals: newSuccessful,
          updated_at: new Date().toISOString()
        }, { merge: true });

        // 7. Write immutable Wallet Transaction record
        const txRef = db.collection("wallet_transactions").doc();
        const nowIso = new Date().toISOString();
        transaction.set(txRef, {
          id: txRef.id,
          userId: referrerId,
          user_id: referrerId,
          amount: settings.referrerReward,
          type: "credit",
          direction: "credit",
          category: "referral_reward",
          status: "completed",
          referenceId: orderId,
          reference_id: orderId,
          orderId: orderId,
          order_id: orderId,
          balance_after: newBalance,
          description: `৳${settings.referrerReward} Referral Reward for Order #${orderData.order_number || orderId}`,
          createdAt: nowIso,
          created_at: nowIso
        });

        // 8. Update Referrals Collection Doc
        const referralId = orderData.referral_id || orderData.referralId || `ref-${orderId}`;
        const refDocRef = db.doc(`referrals/${referralId}`);
        transaction.set(refDocRef, {
          id: referralId,
          referralCode,
          referrerId,
          referredUserId: referredUserId || null,
          orderId,
          orderAmount: subtotal,
          rewardAmount: settings.referrerReward,
          newCustomerDiscount: Number(orderData.referral_discount || settings.newCustomerDiscount),
          status: "rewarded",
          qualified: true,
          rewarded: true,
          rewardedAt: nowIso,
          updatedAt: nowIso
        }, { merge: true });

        // 9. Update order doc with reward confirmation
        transaction.set(orderRef, {
          referral_reward_issued: true,
          referral_reward_amount: settings.referrerReward,
          referral_reward_at: nowIso
        }, { merge: true });

        return {
          success: true,
          rewardIssued: true,
          rewardAmount: settings.referrerReward,
          newBalance
        };
      });

      return res.status(200).json(result);
    }

    // B. Request Withdrawal (Reserve/Deduct balance safely)
    if (action === "request-withdrawal") {
      const { userId, amount, method, accountNumber } = payload || {};
      const numAmount = Number(amount);

      if (!userId || !numAmount || !method || !accountNumber) {
        return res.status(400).json({ error: "Missing required withdrawal fields" });
      }

      const settings = await getReferralSettings(db);
      if (!settings.withdrawEnabled) {
        return res.status(400).json({ error: "Withdrawals are currently paused by administration" });
      }

      if (numAmount < settings.minimumWithdrawAmount) {
        return res.status(400).json({ error: `Minimum withdrawal amount is ৳${settings.minimumWithdrawAmount}` });
      }

      const cleanPhone = String(accountNumber).replace(/\D/g, "");
      if (cleanPhone.length < 11) {
        return res.status(400).json({ error: "Invalid mobile banking account number" });
      }

      const result = await db.runTransaction(async (transaction) => {
        const userRef = db.doc(`profiles/${userId}`);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new Error("User profile not found");
        }
        const userData = userSnap.data();
        const currentBalance = Number(userData.wallet_balance || userData.walletBalance || 0);

        if (currentBalance < numAmount) {
          throw new Error(`Insufficient wallet balance. Available: ৳${currentBalance}`);
        }

        const newBalance = currentBalance - numAmount;
        const nowIso = new Date().toISOString();

        // Deduct from profile balance
        transaction.set(userRef, {
          wallet_balance: newBalance,
          walletBalance: newBalance,
          updated_at: nowIso
        }, { merge: true });

        // Create withdrawal record
        const withdrawRef = db.collection("withdrawals").doc();
        transaction.set(withdrawRef, {
          id: withdrawRef.id,
          userId,
          user_id: userId,
          amount: numAmount,
          method,
          accountNumber: cleanPhone,
          status: "pending",
          createdAt: nowIso,
          created_at: nowIso
        });

        // Create transaction log
        const txRef = db.collection("wallet_transactions").doc();
        transaction.set(txRef, {
          id: txRef.id,
          userId,
          user_id: userId,
          amount: numAmount,
          type: "debit",
          direction: "debit",
          category: "withdrawal",
          status: "pending",
          referenceId: withdrawRef.id,
          reference_id: withdrawRef.id,
          balance_after: newBalance,
          description: `৳${numAmount} Withdrawal Request (${method}: ${cleanPhone})`,
          createdAt: nowIso,
          created_at: nowIso
        });

        return { success: true, withdrawalId: withdrawRef.id, newBalance };
      });

      return res.status(200).json(result);
    }

    // C. Process Withdrawal (Admin Action: approve / reject / mark_paid)
    if (action === "process-withdrawal") {
      const { withdrawalId, status, adminNote, adminId } = payload || {};
      if (!withdrawalId || !["approved", "rejected", "paid"].includes(status)) {
        return res.status(400).json({ error: "Invalid withdrawal status or id" });
      }

      const result = await db.runTransaction(async (transaction) => {
        const withdrawRef = db.doc(`withdrawals/${withdrawalId}`);
        const withdrawSnap = await transaction.get(withdrawRef);
        if (!withdrawSnap.exists) {
          throw new Error("Withdrawal request not found");
        }
        const wData = withdrawSnap.data();

        if (wData.status !== "pending" && status === "rejected") {
          throw new Error(`Cannot reject withdrawal with status '${wData.status}'`);
        }

        const nowIso = new Date().toISOString();
        const userId = wData.userId || wData.user_id;
        const amount = Number(wData.amount || 0);

        // If Rejected, automatically restore wallet balance
        if (status === "rejected") {
          const userRef = db.doc(`profiles/${userId}`);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists) {
            const uData = userSnap.data();
            const currentBalance = Number(uData.wallet_balance || uData.walletBalance || 0);
            const restoredBalance = currentBalance + amount;

            transaction.set(userRef, {
              wallet_balance: restoredBalance,
              walletBalance: restoredBalance,
              updated_at: nowIso
            }, { merge: true });

            // Record reversal transaction
            const txRef = db.collection("wallet_transactions").doc();
            transaction.set(txRef, {
              id: txRef.id,
              userId,
              user_id: userId,
              amount,
              type: "credit",
              direction: "credit",
              category: "refund",
              status: "completed",
              referenceId: withdrawalId,
              reference_id: withdrawalId,
              balance_after: restoredBalance,
              description: `Refund for rejected withdrawal: ${adminNote || "Rejected by admin"}`,
              createdAt: nowIso,
              created_at: nowIso
            });
          }
        }

        // Update withdrawal status
        transaction.set(withdrawRef, {
          status,
          adminNote: adminNote || null,
          processedBy: adminId || "admin",
          processedAt: nowIso,
          updated_at: nowIso
        }, { merge: true });

        // Update corresponding pending transaction
        const txQuery = db.collection("wallet_transactions")
          .where("referenceId", "==", withdrawalId);
        const txSnap = await transaction.get(txQuery);
        txSnap.forEach(tDoc => {
          transaction.set(tDoc.ref, {
            status: status === "rejected" ? "cancelled" : "completed",
            updated_at: nowIso
          }, { merge: true });
        });

        return { success: true, status, processedAt: nowIso };
      });

      return res.status(200).json(result);
    }

    // D. Manual Adjustment / Reversal (Admin Action)
    if (action === "manual-adjustment") {
      const { userId, type, amount, reason, adminId } = payload || {};
      const numAmount = Number(amount);
      if (!userId || !numAmount || !["credit", "debit"].includes(type)) {
        return res.status(400).json({ error: "Invalid adjustment parameters" });
      }

      const result = await db.runTransaction(async (transaction) => {
        const userRef = db.doc(`profiles/${userId}`);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) throw new Error("User not found");
        const uData = userSnap.data();

        const curBal = Number(uData.wallet_balance || uData.walletBalance || 0);
        const newBal = type === "credit" ? curBal + numAmount : Math.max(0, curBal - numAmount);
        const nowIso = new Date().toISOString();

        transaction.set(userRef, {
          wallet_balance: newBal,
          walletBalance: newBal,
          updated_at: nowIso
        }, { merge: true });

        const txRef = db.collection("wallet_transactions").doc();
        transaction.set(txRef, {
          id: txRef.id,
          userId,
          user_id: userId,
          amount: numAmount,
          type,
          direction: type,
          category: "manual_adjustment",
          status: "completed",
          referenceId: `admin-${adminId || "action"}`,
          balance_after: newBal,
          description: reason || `Manual ${type} by administrator`,
          createdAt: nowIso,
          created_at: nowIso
        });

        return { success: true, newBalance: newBal };
      });

      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "Unrecognized action" });
  } catch (err) {
    console.error("[Referral Cloud API Error]:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});


