export type QAStatus = "approved" | "pending" | "rejected" | "spam";

export type QAAuthorType = "seller" | "admin" | "verified_buyer" | "customer";

export interface QAAnswer {
  id: string;
  questionId: string;
  answerText: string;
  authorType: QAAuthorType;
  authorName: string;
  authorId?: string;
  authorEmail?: string;
  isVerifiedBuyer: boolean;
  isOfficialStore: boolean;
  helpfulCount: number;
  helpfulVoters?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface QAQuestion {
  id: string;
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
  status: QAStatus;
  moderatedAt?: string;
  moderatedBy?: string;
  answers: QAAnswer[];
  totalAnswers: number;
  createdAt: string;
  updatedAt: string;
}

export interface QASettings {
  autoApproveVerifiedBuyers: boolean;
  autoApproveQuestions: boolean;
  preventDuplicateQuestions: boolean;
  rateLimitMinutes: number;
  blockedWords: string[];
}

export interface QAAnalytics {
  totalQuestions: number;
  pendingQuestions: number;
  approvedQuestions: number;
  rejectedQuestions: number;
  totalAnswers: number;
  unansweredQuestions: number;
  responseRate: number;
}
