import { db } from "@/integrations/firebase/client";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { QAQuestion, QAAnswer, QAStatus, QAAnalytics, QASettings } from "@/types/productQA";
import { dispatchNativePushNotification } from "@/services/notificationService";

const STORAGE_KEY = "durtup_product_questions_v1";
const SETTINGS_KEY = "durtup_qa_settings_v1";

export const DEFAULT_QA_SETTINGS: QASettings = {
  autoApproveVerifiedBuyers: true,
  autoApproveQuestions: true, // auto approve normal clean questions
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

const SEED_QUESTIONS: QAQuestion[] = [
  {
    id: "qa_seed_1",
    productId: "1",
    productName: "Period Pain Relief Waist Belt Heating Pad Device",
    productSlug: "period-pain-relief-waist-belt-heating-pad-device-8997",
    productImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop",
    sellerId: "durtup_seller_1",
    sellerName: "Durtup Health & Lifestyle",
    questionText: "এই বেল্টটি কি সরাসরি পাওয়ার ব্যাংক দিয়ে ব্যবহার করা যাবে?",
    authorName: "নুসরাত জাহান",
    authorId: "usr_seed_101",
    status: "approved",
    totalAnswers: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    answers: [
      {
        id: "ans_seed_1_1",
        questionId: "qa_seed_1",
        answerText: "জী আপু, এটি যেকোনো স্ট্যান্ডার্ড 5V/2A পাওয়ার ব্যাংক অথবা ইউএসবি অ্যাডাপ্টার দিয়ে অনায়াসে ব্যবহার করা যায়।",
        authorType: "seller",
        authorName: "Durtup Official Team",
        isOfficialStore: true,
        isVerifiedBuyer: false,
        helpfulCount: 8,
        helpfulVoters: [],
        createdAt: new Date(Date.now() - 2.8 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "ans_seed_1_2",
        questionId: "qa_seed_1",
        answerText: "আমি এটি কিনেছি, পাওয়ার ব্যাংক পকেটে রেখেও খুব আরামসে ব্যবহার করা যায়। হিটিং অনেক দ্রুত কাজ করে।",
        authorType: "verified_buyer",
        authorName: "ফারজানা আক্তার",
        isOfficialStore: false,
        isVerifiedBuyer: true,
        helpfulCount: 5,
        helpfulVoters: [],
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "qa_seed_2",
    productId: "2",
    productName: "Olevs Luxury Men’s Quartz Watch",
    productSlug: "olevs-waterproof-luxury-mens-quartz-watchblack-white-3287",
    productImage: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop",
    sellerId: "durtup_seller_2",
    sellerName: "Durtup Watch Gallery",
    questionText: "ঘড়িটি কি সম্পূর্ণ ওয়াটারপ্রুফ? সাঁতার কাটার সময় পরা যাবে?",
    authorName: "আসিফ আহমেদ",
    authorId: "usr_seed_102",
    status: "approved",
    totalAnswers: 1,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3.5 * 24 * 3600 * 1000).toISOString(),
    answers: [
      {
        id: "ans_seed_2_1",
        questionId: "qa_seed_2",
        answerText: "এটি 3ATM ওয়াটার রেজিস্ট্যান্ট। সাধারণ হাত ধোয়া বা বৃষ্টির পানিতে সমস্যা হবে না, তবে গরম পানিতে বা গভীর পানিতে সাঁতারের জন্য সুপারিশ করা হয় না।",
        authorType: "seller",
        authorName: "Durtup Watch Gallery",
        isOfficialStore: true,
        isVerifiedBuyer: false,
        helpfulCount: 12,
        helpfulVoters: [],
        createdAt: new Date(Date.now() - 3.5 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

// -------------------------------------------------------------
// Local Storage Helpers
// -------------------------------------------------------------
export function getLocalQuestions(): QAQuestion[] {
  if (typeof window === "undefined") return SEED_QUESTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_QUESTIONS));
      return SEED_QUESTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_QUESTIONS;
  } catch {
    return SEED_QUESTIONS;
  }
}

export function saveLocalQuestions(questions: QAQuestion[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions.slice(0, 500)));
    window.dispatchEvent(new CustomEvent("durtup_qa_updated"));
  } catch {}
}

export function getQASettings(): QASettings {
  if (typeof window === "undefined") return DEFAULT_QA_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_QA_SETTINGS, ...JSON.parse(raw) } : DEFAULT_QA_SETTINGS;
  } catch {
    return DEFAULT_QA_SETTINGS;
  }
}

export function saveQASettings(settings: QASettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

// -------------------------------------------------------------
// Spam & Quality Check
// -------------------------------------------------------------
export function checkQuestionSpam(text: string, settings: QASettings = DEFAULT_QA_SETTINGS): { isSpam: boolean; reason?: string } {
  const clean = text.trim();
  if (clean.length < 5) {
    return { isSpam: true, reason: "প্রশ্নটি অত্যন্ত সংক্ষিপ্ত। অনুগ্রহ করে বিস্তারিত লিখুন।" };
  }

  // 1. Check for blocked keywords or external URLs
  const lower = clean.toLowerCase();
  for (const word of settings.blockedWords) {
    if (lower.includes(word.toLowerCase())) {
      return { isSpam: true, reason: "প্রশ্নটিতে কোনো বহিরাগত লিঙ্ক বা অননুমোদিত শব্দ ব্যবহার করা যাবে না।" };
    }
  }

  // 2. Check for repetitive character spam (e.g. "aaaaaaa", "asdfasdfasdf")
  if (/(.)\1{5,}/.test(clean)) {
    return { isSpam: true, reason: "প্রশ্নটিতে অপ্রয়োজনীয় পুনরাবৃত্তিমূলক অক্ষর রয়েছে।" };
  }

  return { isSpam: false };
}

// -------------------------------------------------------------
// Duplicate Question Check
// -------------------------------------------------------------
export function isDuplicateQuestion(newText: string, existingQuestions: QAQuestion[]): { isDuplicate: boolean; duplicateOf?: QAQuestion } {
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

// -------------------------------------------------------------
// Verified Buyer Verification
// -------------------------------------------------------------
export async function checkIsVerifiedBuyer(productId: string, userIdOrEmail?: string): Promise<boolean> {
  if (!userIdOrEmail) return false;
  const target = userIdOrEmail.trim().toLowerCase();

  // 1. Check in localStorage orders
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("durtup_orders") || localStorage.getItem("orders");
      if (raw) {
        const orders = JSON.parse(raw);
        if (Array.isArray(orders)) {
          const match = orders.some((o: any) => {
            const matchesUser =
              (o.user_id && String(o.user_id).toLowerCase() === target) ||
              (o.customer_email && String(o.customer_email).toLowerCase() === target) ||
              (o.userId && String(o.userId).toLowerCase() === target);
            if (!matchesUser) return false;

            // Check if product is in order items
            if (Array.isArray(o.items)) {
              return o.items.some((it: any) => String(it.id || it.product_id) === String(productId));
            }
            return String(o.product_id || o.productId) === String(productId);
          });
          if (match) return true;
        }
      }
    } catch {}
  }

  // 2. Check in Firestore orders collection
  try {
    const ordersRef = collection(db, "orders");
    const q1 = query(ordersRef, where("user_id", "==", target), fsLimit(10));
    const snap = await getDocs(q1);
    for (const d of snap.docs) {
      const data = d.data();
      if (Array.isArray(data.items)) {
        if (data.items.some((it: any) => String(it.id || it.product_id) === String(productId))) {
          return true;
        }
      }
      if (String(data.product_id) === String(productId)) return true;
    }
  } catch {}

  return false;
}

// -------------------------------------------------------------
// 1. Get Questions for a Product
// -------------------------------------------------------------
export async function getProductQuestions(productId: string, includeUnapproved: boolean = false): Promise<QAQuestion[]> {
  const local = getLocalQuestions().filter((q) => String(q.productId) === String(productId));

  // Fetch from Firestore
  try {
    const qRef = collection(db, "product_questions");
    const qQuery = query(qRef, where("productId", "==", String(productId)), orderBy("createdAt", "desc"), fsLimit(50));
    const snap = await getDocs(qQuery);
    const remoteList: QAQuestion[] = [];
    snap.forEach((d) => {
      remoteList.push({ ...(d.data() as QAQuestion), id: d.id });
    });

    // Merge deduplicated
    const map = new Map<string, QAQuestion>();
    local.forEach((q) => map.set(q.id, q));
    remoteList.forEach((q) => map.set(q.id, q));

    const all = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (includeUnapproved) return all;
    return all.filter((q) => q.status === "approved");
  } catch {
    if (includeUnapproved) return local;
    return local.filter((q) => q.status === "approved");
  }
}

// -------------------------------------------------------------
// 2. Ask a Product Question
// -------------------------------------------------------------
export interface AskQuestionParams {
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string;
  sellerId?: string;
  sellerName?: string;
  questionText: string;
  authorName: string;
  authorId?: string;
  authorEmail?: string;
  authorPhone?: string;
}

export async function askProductQuestion(
  params: AskQuestionParams
): Promise<{ success: boolean; message: string; question?: QAQuestion }> {
  const text = (params.questionText || "").trim();
  const settings = getQASettings();

  // 1. Spam check
  const spam = checkQuestionSpam(text, settings);
  if (spam.isSpam) {
    return { success: false, message: spam.reason || "প্রশ্নটি গ্রহণ করা সম্ভব হয়নি।" };
  }

  // 2. Rate limit check (prevents rapid-fire bot requests)
  if (typeof window !== "undefined") {
    const lastAskKey = `durtup_last_qa_${params.productId}`;
    const lastTime = Number(sessionStorage.getItem(lastAskKey) || 0);
    const now = Date.now();
    if (now - lastTime < settings.rateLimitMinutes * 60 * 1000) {
      const waitSec = Math.ceil((settings.rateLimitMinutes * 60 * 1000 - (now - lastTime)) / 1000);
      return { success: false, message: `অনুগ্রহ করে আরও ${waitSec} সেকেন্ড অপেক্ষা করুন।` };
    }
  }

  // 3. Duplicate check for this product
  const existing = await getProductQuestions(params.productId, true);
  if (settings.preventDuplicateQuestions) {
    const duplicate = isDuplicateQuestion(text, existing);
    if (duplicate.isDuplicate) {
      return {
        success: false,
        message: "এই প্রোডাক্ট সম্পর্কে এই প্রশ্নটি ইতিপূর্বে করা হয়েছে। অনুগ্রহ করে নিচে উত্তর দেখে নিন।",
      };
    }
  }

  const questionId = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const status: QAStatus = settings.autoApproveQuestions ? "approved" : "pending";

  const newQuestion: QAQuestion = {
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
    authorPhone: params.authorPhone,
    status,
    answers: [],
    totalAnswers: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to LocalStorage
  const local = getLocalQuestions();
  local.unshift(newQuestion);
  saveLocalQuestions(local);

  if (typeof window !== "undefined") {
    sessionStorage.setItem(`durtup_last_qa_${params.productId}`, String(Date.now()));
  }

  // Save to Firestore
  try {
    await setDoc(doc(db, "product_questions", questionId), newQuestion);
  } catch (err) {
    console.warn("Firestore Q&A save notice:", err);
  }

  return {
    success: true,
    message:
      status === "approved"
        ? "আপনার প্রশ্নটি সফলভাবে জমা হয়েছে এবং প্রকাশিত হয়েছে!"
        : "আপনার প্রশ্নটি গৃহীত হয়েছে! মডারেশনের পর এটি প্রকাশিত হবে।",
    question: newQuestion,
  };
}

// -------------------------------------------------------------
// 3. Answer a Product Question
// -------------------------------------------------------------
export interface AnswerQuestionParams {
  questionId: string;
  answerText: string;
  authorType?: "seller" | "admin" | "verified_buyer" | "customer";
  authorName: string;
  authorId?: string;
  authorEmail?: string;
}

export async function answerProductQuestion(
  params: AnswerQuestionParams
): Promise<{ success: boolean; message: string; answer?: QAAnswer }> {
  const text = (params.answerText || "").trim();
  if (text.length < 3) {
    return { success: false, message: "অনুগ্রহ করে একটি সঠিক ও অর্থপূর্ণ উত্তর লিখুন।" };
  }

  // Find question
  const local = getLocalQuestions();
  const qIndex = local.findIndex((q) => q.id === params.questionId);

  let targetQuestion: QAQuestion | null = qIndex >= 0 ? local[qIndex] : null;

  if (!targetQuestion) {
    try {
      const snap = await getDoc(doc(db, "product_questions", params.questionId));
      if (snap.exists()) {
        targetQuestion = { ...(snap.data() as QAQuestion), id: snap.id };
      }
    } catch {}
  }

  if (!targetQuestion) {
    return { success: false, message: "প্রশ্নটি খুঁজে পাওয়া যায়নি।" };
  }

  // Check verified buyer status if authorType not already set to admin/seller
  let authorType = params.authorType || "customer";
  let isVerifiedBuyer = false;
  let isOfficialStore = false;

  if (authorType === "admin" || authorType === "seller") {
    isOfficialStore = true;
  } else {
    isVerifiedBuyer = await checkIsVerifiedBuyer(targetQuestion.productId, params.authorId || params.authorEmail);
    if (isVerifiedBuyer) {
      authorType = "verified_buyer";
    }
  }

  const answerId = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newAnswer: QAAnswer = {
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

  const updatedAnswers = [...(targetQuestion.answers || []), newAnswer];
  targetQuestion.answers = updatedAnswers;
  targetQuestion.totalAnswers = updatedAnswers.length;
  targetQuestion.updatedAt = new Date().toISOString();

  if (qIndex >= 0) {
    local[qIndex] = targetQuestion;
  } else {
    local.unshift(targetQuestion);
  }
  saveLocalQuestions(local);

  // Firestore update
  try {
    await updateDoc(doc(db, "product_questions", params.questionId), {
      answers: updatedAnswers,
      totalAnswers: updatedAnswers.length,
      updatedAt: targetQuestion.updatedAt,
    });
  } catch {}

  // 🔔 Send Push Notification to Question Author!
  try {
    const authorBadge = isOfficialStore ? "সেলার/স্টোর টিম" : isVerifiedBuyer ? "যাচাইকৃত ক্রেতা" : params.authorName;
    dispatchNativePushNotification({
      category: "system",
      title: `💬 আপনার প্রশ্নের উত্তর এসেছে!`,
      body: `"${targetQuestion.productName.slice(0, 30)}..."-এ ${authorBadge} উত্তর দিয়েছেন: "${text.slice(0, 50)}..."`,
      image: targetQuestion.productImage || "/icon-192.png",
      url: `/product/${targetQuestion.productSlug || targetQuestion.productId}#qa-${targetQuestion.id}`,
      userId: targetQuestion.authorId,
      tag: `qa-answer-${params.questionId}`,
      data: { questionId: targetQuestion.id, productId: targetQuestion.productId },
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    message: "আপনার উত্তরটি সফলভাবে প্রকাশিত হয়েছে। ধন্যবাদ!",
    answer: newAnswer,
  };
}

// -------------------------------------------------------------
// 4. Vote Helpful on an Answer
// -------------------------------------------------------------
export function voteHelpfulAnswer(
  questionId: string,
  answerId: string,
  voterId: string = "anonymous_device"
): { success: boolean; newCount: number; alreadyVoted?: boolean } {
  const local = getLocalQuestions();
  const q = local.find((item) => item.id === questionId);
  if (!q) return { success: false, newCount: 0 };

  const ans = q.answers.find((a) => a.id === answerId);
  if (!ans) return { success: false, newCount: 0 };

  ans.helpfulVoters = ans.helpfulVoters || [];

  // Check if already voted
  const voteKey = `qa_vote_${answerId}`;
  if (typeof window !== "undefined" && localStorage.getItem(voteKey)) {
    return { success: false, newCount: ans.helpfulCount, alreadyVoted: true };
  }

  if (ans.helpfulVoters.includes(voterId)) {
    return { success: false, newCount: ans.helpfulCount, alreadyVoted: true };
  }

  ans.helpfulCount = (ans.helpfulCount || 0) + 1;
  ans.helpfulVoters.push(voterId);

  saveLocalQuestions(local);

  if (typeof window !== "undefined") {
    localStorage.setItem(voteKey, "true");
  }

  // Background Firestore sync
  try {
    updateDoc(doc(db, "product_questions", questionId), {
      answers: q.answers,
    }).catch(() => {});
  } catch {}

  return { success: true, newCount: ans.helpfulCount };
}

// -------------------------------------------------------------
// 5. Admin Moderation
// -------------------------------------------------------------
export async function moderateQuestion(
  questionId: string,
  status: QAStatus,
  moderatorName: string = "Admin"
): Promise<{ success: boolean; message: string }> {
  const local = getLocalQuestions();
  const idx = local.findIndex((q) => q.id === questionId);
  if (idx >= 0) {
    local[idx].status = status;
    local[idx].moderatedAt = new Date().toISOString();
    local[idx].moderatedBy = moderatorName;
    saveLocalQuestions(local);
  }

  try {
    await updateDoc(doc(db, "product_questions", questionId), {
      status,
      moderatedAt: new Date().toISOString(),
      moderatedBy: moderatorName,
    });
  } catch {}

  return { success: true, message: `প্রশ্নটি সফলভাবে "${status}" হিসেবে মার্ক করা হয়েছে।` };
}

export async function deleteQuestion(questionId: string): Promise<{ success: boolean }> {
  const local = getLocalQuestions().filter((q) => q.id !== questionId);
  saveLocalQuestions(local);

  try {
    await deleteDoc(doc(db, "product_questions", questionId));
  } catch {}

  return { success: true };
}

// -------------------------------------------------------------
// 6. Admin Analytics & Listing
// -------------------------------------------------------------
export async function getAllQuestionsForAdmin(filters?: {
  status?: QAStatus | "all";
  search?: string;
  productId?: string;
}): Promise<QAQuestion[]> {
  let all = getLocalQuestions();

  try {
    const qRef = collection(db, "product_questions");
    const snap = await getDocs(query(qRef, orderBy("createdAt", "desc"), fsLimit(150)));
    const remoteList: QAQuestion[] = [];
    snap.forEach((d) => remoteList.push({ ...(d.data() as QAQuestion), id: d.id }));

    const map = new Map<string, QAQuestion>();
    all.forEach((q) => map.set(q.id, q));
    remoteList.forEach((q) => map.set(q.id, q));
    all = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {}

  if (filters?.status && filters.status !== "all") {
    all = all.filter((q) => q.status === filters.status);
  }

  if (filters?.productId) {
    all = all.filter((q) => q.productId === filters.productId);
  }

  if (filters?.search) {
    const queryStr = filters.search.toLowerCase().trim();
    all = all.filter(
      (q) =>
        q.questionText.toLowerCase().includes(queryStr) ||
        q.productName.toLowerCase().includes(queryStr) ||
        (q.authorName && q.authorName.toLowerCase().includes(queryStr)) ||
        (q.authorEmail && q.authorEmail.toLowerCase().includes(queryStr))
    );
  }

  return all;
}

export async function getQAAnalytics(): Promise<QAAnalytics> {
  const all = await getAllQuestionsForAdmin();
  const totalQuestions = all.length;
  const pendingQuestions = all.filter((q) => q.status === "pending").length;
  const approvedQuestions = all.filter((q) => q.status === "approved").length;
  const rejectedQuestions = all.filter((q) => q.status === "rejected" || q.status === "spam").length;

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
