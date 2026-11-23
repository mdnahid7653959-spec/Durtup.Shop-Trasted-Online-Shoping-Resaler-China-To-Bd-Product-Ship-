const assert = require("assert");

// Mock browser environment for node testing
if (typeof global.window === "undefined") {
  const store = {};
  const sessionStore = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
  global.sessionStorage = {
    getItem: (key) => sessionStore[key] || null,
    setItem: (key, val) => { sessionStore[key] = String(val); },
    removeItem: (key) => { delete sessionStore[key]; },
    clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); }
  };
  global.window = {
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    dispatchEvent: () => true
  };
  global.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };
}

// Emulate productQAService logic directly in node to test full business rules
const DEFAULT_QA_SETTINGS = {
  autoApproveVerifiedBuyers: true,
  autoApproveQuestions: true,
  preventDuplicateQuestions: true,
  rateLimitMinutes: 1,
  blockedWords: [
    "http://",
    "https://",
    "t.me/",
    "telegram",
    "whatsapp",
    "porn",
    "gambling",
    "casino",
    "betting",
    "scam",
  ],
};

function checkQuestionSpam(text, settings = DEFAULT_QA_SETTINGS) {
  const clean = (text || "").trim();
  if (clean.length < 5) {
    return { isSpam: true, reason: "প্রশ্নটি অত্যন্ত সংক্ষিপ্ত। অনুগ্রহ করে বিস্তারিত লিখুন।" };
  }
  const lower = clean.toLowerCase();
  for (const word of settings.blockedWords) {
    if (lower.includes(word.toLowerCase())) {
      return { isSpam: true, reason: "প্রশ্নটিতে কোনো বহিরাগত লিঙ্ক বা অননুমোদিত শব্দ ব্যবহার করা যাবে না।" };
    }
  }
  if (/(.)\1{5,}/.test(clean)) {
    return { isSpam: true, reason: "প্রশ্নটিতে অপ্রয়োজনীয় পুনরাবৃত্তিমূলক অক্ষর রয়েছে।" };
  }
  return { isSpam: false };
}

function isDuplicateQuestion(newText, existingQuestions) {
  const cleanNew = newText.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, "").trim();
  if (!cleanNew) return { isDuplicate: false };

  for (const q of existingQuestions) {
    const cleanExisting = q.questionText.toLowerCase().replace(/[^\w\u0980-\u09FF]/g, "").trim();
    if (cleanExisting === cleanNew) {
      return { isDuplicate: true, duplicateOf: q };
    }
  }
  return { isDuplicate: false };
}

function checkIsVerifiedBuyer(productId, userIdOrEmail) {
  if (!userIdOrEmail) return false;
  const target = userIdOrEmail.trim().toLowerCase();
  try {
    const raw = global.localStorage.getItem("durtup_orders");
    if (raw) {
      const orders = JSON.parse(raw);
      if (Array.isArray(orders)) {
        return orders.some(o => {
          const matchesUser =
            (o.user_id && String(o.user_id).toLowerCase() === target) ||
            (o.customer_email && String(o.customer_email).toLowerCase() === target) ||
            (o.userId && String(o.userId).toLowerCase() === target);
          if (!matchesUser) return false;
          if (Array.isArray(o.items)) {
            return o.items.some(it => String(it.id || it.product_id) === String(productId));
          }
          return String(o.product_id || o.productId) === String(productId);
        });
      }
    }
  } catch {}
  return false;
}

let notificationDispatches = [];
function mockDispatchNativePushNotification(payload) {
  notificationDispatches.push(payload);
  return Promise.resolve(true);
}

const STORAGE_KEY = "durtup_product_questions_v1";
function getLocalQuestions() {
  const raw = global.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveLocalQuestions(questions) {
  global.localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

function askProductQuestion(params) {
  const text = (params.questionText || "").trim();
  const spam = checkQuestionSpam(text);
  if (spam.isSpam) {
    return { success: false, message: spam.reason };
  }

  const lastAskKey = `durtup_last_qa_${params.productId}`;
  const lastTime = Number(global.sessionStorage.getItem(lastAskKey) || 0);
  const now = Date.now();
  if (now - lastTime < DEFAULT_QA_SETTINGS.rateLimitMinutes * 60 * 1000) {
    const waitSec = Math.ceil((DEFAULT_QA_SETTINGS.rateLimitMinutes * 60 * 1000 - (now - lastTime)) / 1000);
    return { success: false, message: `অনুগ্রহ করে আরও ${waitSec} সেকেন্ড অপেক্ষা করুন।` };
  }

  const existing = getLocalQuestions().filter(q => q.productId === params.productId);
  if (DEFAULT_QA_SETTINGS.preventDuplicateQuestions) {
    const duplicate = isDuplicateQuestion(text, existing);
    if (duplicate.isDuplicate) {
      return { success: false, message: "এই প্রোডাক্ট সম্পর্কে এই প্রশ্নটি ইতিপূর্বে করা হয়েছে।" };
    }
  }

  const questionId = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newQuestion = {
    id: questionId,
    productId: String(params.productId),
    productName: params.productName,
    productSlug: params.productSlug,
    productImage: params.productImage || "/durtup-logo.png",
    sellerId: params.sellerId,
    sellerName: params.sellerName || "Durtup Official Store",
    questionText: text,
    authorName: params.authorName || "সম্মানিত ক্রেতা",
    authorId: params.authorId,
    authorEmail: params.authorEmail,
    status: "approved",
    answers: [],
    totalAnswers: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const local = getLocalQuestions();
  local.unshift(newQuestion);
  saveLocalQuestions(local);
  global.sessionStorage.setItem(lastAskKey, String(now));

  return { success: true, question: newQuestion };
}

function answerProductQuestion(params) {
  const text = (params.answerText || "").trim();
  if (text.length < 3) {
    return { success: false, message: "অনুগ্রহ করে একটি সঠিক ও অর্থপূর্ণ উত্তর লিখুন।" };
  }

  const local = getLocalQuestions();
  const targetQuestion = local.find(q => q.id === params.questionId);
  if (!targetQuestion) return { success: false, message: "প্রশ্নটি খুঁজে পাওয়া যায়নি।" };

  let authorType = params.authorType || "customer";
  let isVerifiedBuyer = false;
  let isOfficialStore = false;

  if (authorType === "admin" || authorType === "seller") {
    isOfficialStore = true;
  } else {
    isVerifiedBuyer = checkIsVerifiedBuyer(targetQuestion.productId, params.authorId || params.authorEmail);
    if (isVerifiedBuyer) authorType = "verified_buyer";
  }

  const answerId = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newAnswer = {
    id: answerId,
    questionId: params.questionId,
    answerText: text,
    authorType,
    authorName: params.authorName || (isOfficialStore ? "Durtup Official Team" : "Verified Customer"),
    authorId: params.authorId,
    authorEmail: params.authorEmail,
    isVerifiedBuyer,
    isOfficialStore,
    helpfulCount: 0,
    helpfulVoters: [],
    createdAt: new Date().toISOString(),
  };

  targetQuestion.answers.push(newAnswer);
  targetQuestion.totalAnswers = targetQuestion.answers.length;
  targetQuestion.updatedAt = new Date().toISOString();
  saveLocalQuestions(local);

  // Dispatch Notification
  mockDispatchNativePushNotification({
    category: "system",
    title: `💬 আপনার প্রশ্নের উত্তর এসেছে!`,
    body: `"${targetQuestion.productName.slice(0, 30)}..."-এ উত্তর দেওয়া হয়েছে: "${text.slice(0, 50)}..."`,
    url: `/product/${targetQuestion.productSlug || targetQuestion.productId}#qa-${targetQuestion.id}`,
    userId: targetQuestion.authorId,
  });

  return { success: true, answer: newAnswer };
}

function voteHelpfulAnswer(questionId, answerId, voterId = "device_123") {
  const local = getLocalQuestions();
  const q = local.find(item => item.id === questionId);
  if (!q) return { success: false, newCount: 0 };
  const ans = q.answers.find(a => a.id === answerId);
  if (!ans) return { success: false, newCount: 0 };

  ans.helpfulVoters = ans.helpfulVoters || [];
  const voteKey = `qa_vote_${answerId}`;
  if (global.localStorage.getItem(voteKey) || ans.helpfulVoters.includes(voterId)) {
    return { success: false, newCount: ans.helpfulCount, alreadyVoted: true };
  }

  ans.helpfulCount = (ans.helpfulCount || 0) + 1;
  ans.helpfulVoters.push(voterId);
  saveLocalQuestions(local);
  global.localStorage.setItem(voteKey, "true");

  return { success: true, newCount: ans.helpfulCount };
}

function moderateQuestion(questionId, status, moderatorName = "Admin") {
  const local = getLocalQuestions();
  const q = local.find(item => item.id === questionId);
  if (!q) return { success: false };
  q.status = status;
  q.moderatedBy = moderatorName;
  q.moderatedAt = new Date().toISOString();
  saveLocalQuestions(local);
  return { success: true };
}

function getQAAnalytics() {
  const all = getLocalQuestions();
  const totalQuestions = all.length;
  const pendingQuestions = all.filter(q => q.status === "pending").length;
  const approvedQuestions = all.filter(q => q.status === "approved").length;
  const rejectedQuestions = all.filter(q => q.status === "rejected" || q.status === "spam").length;
  let totalAnswers = 0;
  let answeredQuestions = 0;
  for (const q of all) {
    const ansCount = (q.answers || []).length;
    totalAnswers += ansCount;
    if (ansCount > 0) answeredQuestions++;
  }
  const unansweredQuestions = Math.max(0, totalQuestions - answeredQuestions);
  const responseRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  return {
    totalQuestions,
    pendingQuestions,
    approvedQuestions,
    rejectedQuestions,
    totalAnswers,
    unansweredQuestions,
    responseRate,
  };
}

// -------------------------------------------------------------
// TEST RUNNER
// -------------------------------------------------------------
async function runTests() {
  console.log("=================================================");
  console.log("🚀 Testing Durtup.shop Product Q&A System");
  console.log("=================================================");

  // 1. Anti-spam test: Too short
  const shortRes = checkQuestionSpam("Hi");
  assert.strictEqual(shortRes.isSpam, true, "Should block short question");
  console.log("✔ Test 1: Short question spam block passed");

  // 2. Anti-spam test: Link / Telegram / WhatsApp
  const linkRes = checkQuestionSpam("Contact me on whatsapp 01712345678 or telegram");
  assert.strictEqual(linkRes.isSpam, true, "Should block whatsapp/telegram spam");
  console.log("✔ Test 2: URL & Contact spam block passed");

  // 3. Anti-spam test: Repetitive character spam
  const repRes = checkQuestionSpam("Helloooooooo is this real?????");
  assert.strictEqual(repRes.isSpam, true, "Should block excessive repeated characters");
  console.log("✔ Test 3: Repetitive character spam block passed");

  // 4. Legitimate Question Submission
  const validQ = askProductQuestion({
    productId: "prod_smartwatch_101",
    productName: "T900 Ultra 2 Smartwatch",
    productSlug: "t900-ultra-2-smartwatch",
    questionText: "এই ঘড়িটিতে কি ব্লুটুথ কলিং সাপোর্ট করে?",
    authorName: "তানভীর আহমেদ",
    authorId: "user_tanvir_1",
    authorEmail: "tanvir@example.com",
  });
  assert.strictEqual(validQ.success, true, "Legitimate question should be accepted");
  assert.strictEqual(validQ.question.status, "approved");
  console.log("✔ Test 4: Legitimate question submission passed (ID: " + validQ.question.id + ")");

  // 5. Duplicate Question Check
  // Clear session storage rate limit to test duplicate specifically
  global.sessionStorage.clear();
  const dupQ = askProductQuestion({
    productId: "prod_smartwatch_101",
    productName: "T900 Ultra 2 Smartwatch",
    questionText: "এই ঘড়িটিতে কি ব্লুটুথ কলিং সাপোর্ট করে???",
    authorName: "অন্য ক্রেতা",
  });
  assert.strictEqual(dupQ.success, false, "Should block duplicate question");
  assert(dupQ.message.includes("ইতিপূর্বে করা হয়েছে"), "Message should mention duplicate");
  console.log("✔ Test 5: Duplicate question detection passed");

  // 6. Verified Buyer Check
  global.localStorage.setItem("durtup_orders", JSON.stringify([
    {
      id: "ord_1001",
      user_id: "buyer_rahim",
      customer_email: "rahim@durtup.com",
      items: [{ id: "prod_smartwatch_101", name: "T900 Ultra 2" }]
    }
  ]));

  const isVerified1 = checkIsVerifiedBuyer("prod_smartwatch_101", "buyer_rahim");
  assert.strictEqual(isVerified1, true, "Rahim should be verified buyer");
  const isVerified2 = checkIsVerifiedBuyer("prod_smartwatch_101", "unknown_user");
  assert.strictEqual(isVerified2, false, "Unknown user should NOT be verified buyer");
  console.log("✔ Test 6: Verified Buyer check passed");

  // 7. Verified Buyer Answer Submission
  const qId = validQ.question.id;
  const buyerAns = answerProductQuestion({
    questionId: qId,
    answerText: "হ্যাঁ ভাই, আমি এটি কিনেছি। ব্লুটুথ কলিং খুব ক্লিয়ার কাজ করে।",
    authorName: "রাহিম (যাচাইকৃত ক্রেতা)",
    authorId: "buyer_rahim",
    authorEmail: "rahim@durtup.com",
  });
  assert.strictEqual(buyerAns.success, true);
  assert.strictEqual(buyerAns.answer.isVerifiedBuyer, true, "Answer must have verified buyer badge");
  assert.strictEqual(buyerAns.answer.authorType, "verified_buyer");
  console.log("✔ Test 7: Verified Buyer answer submission & badge passed");

  // 8. Seller / Official Store Answer Submission
  const sellerAns = answerProductQuestion({
    questionId: qId,
    answerText: "ধন্যবাদ! এটিতে বিল্ট-ইন এইচডি স্পিকার ও মাইক্রোফোন রয়েছে যা ব্লুটুথ কলিং ১০০% সাপোর্ট করে।",
    authorName: "Durtup Official Team",
    authorType: "seller",
  });
  assert.strictEqual(sellerAns.success, true);
  assert.strictEqual(sellerAns.answer.isOfficialStore, true, "Answer must have official store badge");
  console.log("✔ Test 8: Official Seller answer submission & badge passed");

  // 9. Push Notification Trigger on Answer
  assert.strictEqual(notificationDispatches.length, 2, "Push notification should be triggered for each answer");
  assert.strictEqual(notificationDispatches[0].userId, "user_tanvir_1", "Notification must target original asker");
  assert(notificationDispatches[0].url.includes("qa-" + qId), "Notification url must deep-link to the question");
  console.log("✔ Test 9: Native Push Notification on question answer passed");

  // 10. Helpful Voting & Duplicate Vote Prevention
  const ansId = buyerAns.answer.id;
  const vote1 = voteHelpfulAnswer(qId, ansId, "device_abc");
  assert.strictEqual(vote1.success, true);
  assert.strictEqual(vote1.newCount, 1);

  const vote2 = voteHelpfulAnswer(qId, ansId, "device_abc");
  assert.strictEqual(vote2.alreadyVoted, true, "Same voter should not be able to vote again");
  assert.strictEqual(vote2.newCount, 1, "Count should remain 1");
  console.log("✔ Test 10: Helpful voting and duplicate prevention passed");

  // 11. Admin Moderation & Analytics
  const modRes = moderateQuestion(qId, "approved", "SuperAdmin");
  assert.strictEqual(modRes.success, true);

  const analytics = getQAAnalytics();
  assert.strictEqual(analytics.totalQuestions, 1);
  assert.strictEqual(analytics.approvedQuestions, 1);
  assert.strictEqual(analytics.totalAnswers, 2);
  assert.strictEqual(analytics.responseRate, 100);
  console.log("✔ Test 11: Admin moderation and KPI analytics passed");

  console.log("\n=================================================");
  console.log("🎉 ALL 11 TESTS PASSED SUCCESSFULLY! (100%)");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
