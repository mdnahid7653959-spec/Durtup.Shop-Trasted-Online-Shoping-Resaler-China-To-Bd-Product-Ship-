import { db } from "../integrations/firebase/client";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction 
} from "firebase/firestore";

interface ReferralSettings {
  enabled: boolean;
  referrerReward: number;
  newCustomerDiscount: number;
  minimumOrderAmount: number;
  rewardTrigger: string;
  maxDailyRewards: number;
  withdrawEnabled: boolean;
  minimumWithdrawAmount: number;
}

export async function getReferralSettings(): Promise<ReferralSettings> {
  try {
    const sDoc = await getDoc(doc(db, "settings", "referral"));
    if (sDoc.exists()) {
      const d = sDoc.data();
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
    console.warn("Failed fetching settings/referral in dev API:", e);
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

export async function handleReferralDevRequest(action: string, payload: any) {
  const settings = await getReferralSettings();

  // A. Process Order Delivery Reward
  if (action === "process-order-reward") {
    const { orderId, newStatus } = payload || {};
    if (!orderId) throw new Error("Missing orderId");

    if (!settings.enabled) {
      return { skipped: true, reason: "Referral system disabled" };
    }

    const triggerStatus = (settings.rewardTrigger || "delivered").toLowerCase();
    const currentStatus = (newStatus || "").toLowerCase();

    if (currentStatus !== triggerStatus) {
      return { skipped: true, reason: `Status '${currentStatus}' does not match trigger '${triggerStatus}'` };
    }

    return await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
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

      // Idempotency: Check if wallet transaction already exists
      const txCol = collection(db, "wallet_transactions");
      const existingTxQuery = query(txCol, where("referenceId", "==", orderId), where("category", "==", "referral_reward"));
      const existingTxSnap = await getDocs(existingTxQuery);
      if (!existingTxSnap.empty) {
        return { success: true, message: "Reward already issued (idempotent)", rewarded: true };
      }

      // Check customer prior delivered orders
      if (referredUserId && !referredUserId.startsWith("guest_")) {
        const prevQuery = query(collection(db, "orders"), where("user_id", "==", referredUserId), where("status", "==", triggerStatus));
        const prevSnap = await getDocs(prevQuery);
        const prior = prevSnap.docs.filter(d => d.id !== orderId);
        if (prior.length > 0) {
          return { skipped: true, reason: "Customer already has a prior delivered order" };
        }
      }

      // Read Referrer Profile
      const referrerRef = doc(db, "profiles", referrerId);
      const referrerSnap = await transaction.get(referrerRef);
      const referrerData = referrerSnap.exists() ? referrerSnap.data() : {};

      const currentBalance = Number(referrerData.wallet_balance || referrerData.walletBalance || 0);
      const currentTotalEarned = Number(referrerData.total_earned || referrerData.totalEarned || 0);
      const currentSuccessful = Number(referrerData.successful_referrals || referrerData.successfulReferrals || 0);

      const newBalance = currentBalance + settings.referrerReward;
      const newTotalEarned = currentTotalEarned + settings.referrerReward;
      const newSuccessful = currentSuccessful + 1;

      const nowIso = new Date().toISOString();

      // Mutate Referrer Profile
      transaction.set(referrerRef, {
        wallet_balance: newBalance,
        walletBalance: newBalance,
        total_earned: newTotalEarned,
        totalEarned: newTotalEarned,
        successful_referrals: newSuccessful,
        successfulReferrals: newSuccessful,
        updated_at: nowIso
      }, { merge: true });

      // Create immutable Wallet Transaction
      const newTxRef = doc(collection(db, "wallet_transactions"));
      transaction.set(newTxRef, {
        id: newTxRef.id,
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

      // Update Referrals Collection
      const referralId = orderData.referral_id || orderData.referralId || `ref-${orderId}`;
      const refDocRef = doc(db, "referrals", referralId);
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

      // Mark order
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
  }

  // B. Request Withdrawal
  if (action === "request-withdrawal") {
    const { userId, amount, method, accountNumber } = payload || {};
    const numAmount = Number(amount);
    if (!userId || !numAmount || !method || !accountNumber) {
      throw new Error("Missing required withdrawal fields");
    }

    if (!settings.withdrawEnabled) {
      throw new Error("Withdrawals are currently paused");
    }

    if (numAmount < settings.minimumWithdrawAmount) {
      throw new Error(`Minimum withdrawal amount is ৳${settings.minimumWithdrawAmount}`);
    }

    const cleanPhone = String(accountNumber).replace(/\D/g, "");
    if (cleanPhone.length < 11) {
      throw new Error("Invalid mobile banking account number");
    }

    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "profiles", userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error("User profile not found");

      const userData = userSnap.data();
      const currentBalance = Number(userData.wallet_balance || userData.walletBalance || 0);

      if (currentBalance < numAmount) {
        throw new Error(`Insufficient wallet balance. Available: ৳${currentBalance}`);
      }

      const newBalance = currentBalance - numAmount;
      const nowIso = new Date().toISOString();

      transaction.set(userRef, {
        wallet_balance: newBalance,
        walletBalance: newBalance,
        updated_at: nowIso
      }, { merge: true });

      const withdrawRef = doc(collection(db, "withdrawals"));
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

      const txRef = doc(collection(db, "wallet_transactions"));
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
  }

  // C. Process Withdrawal
  if (action === "process-withdrawal") {
    const { withdrawalId, status, adminNote, adminId } = payload || {};
    if (!withdrawalId || !["approved", "rejected", "paid"].includes(status)) {
      throw new Error("Invalid withdrawal status or id");
    }

    return await runTransaction(db, async (transaction) => {
      const withdrawRef = doc(db, "withdrawals", withdrawalId);
      const withdrawSnap = await transaction.get(withdrawRef);
      if (!withdrawSnap.exists()) throw new Error("Withdrawal request not found");
      const wData = withdrawSnap.data();

      const nowIso = new Date().toISOString();
      const userId = wData.userId || wData.user_id;
      const amount = Number(wData.amount || 0);

      if (status === "rejected") {
        const userRef = doc(db, "profiles", userId);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const curBal = Number(uData.wallet_balance || uData.walletBalance || 0);
          const restoredBalance = curBal + amount;

          transaction.set(userRef, {
            wallet_balance: restoredBalance,
            walletBalance: restoredBalance,
            updated_at: nowIso
          }, { merge: true });

          const txRef = doc(collection(db, "wallet_transactions"));
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

      transaction.set(withdrawRef, {
        status,
        adminNote: adminNote || null,
        processedBy: adminId || "admin",
        processedAt: nowIso,
        updated_at: nowIso
      }, { merge: true });

      return { success: true, status, processedAt: nowIso };
    });
  }

  // D. Manual Adjustment
  if (action === "manual-adjustment") {
    const { userId, type, amount, reason, adminId } = payload || {};
    const numAmount = Number(amount);
    if (!userId || !numAmount || !["credit", "debit"].includes(type)) {
      throw new Error("Invalid adjustment parameters");
    }

    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "profiles", userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const uData = userSnap.data();

      const curBal = Number(uData.wallet_balance || uData.walletBalance || 0);
      const newBal = type === "credit" ? curBal + numAmount : Math.max(0, curBal - numAmount);
      const nowIso = new Date().toISOString();

      transaction.set(userRef, {
        wallet_balance: newBal,
        walletBalance: newBal,
        updated_at: nowIso
      }, { merge: true });

      const txRef = doc(collection(db, "wallet_transactions"));
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
  }

  throw new Error(`Unrecognized action: ${action}`);
}
