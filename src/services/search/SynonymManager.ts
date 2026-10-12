import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export interface SynonymRule {
  id: string;
  term: string;
  synonyms: string[];
  category?: string;
  language?: "en" | "bn" | "bilingual";
  updated_at?: string;
}

// Built-in initial bilingual synonym dictionary for instant out-of-the-box matching
const DEFAULT_SYNONYMS: SynonymRule[] = [
  {
    id: "syn-tshirt",
    term: "t-shirt",
    synonyms: ["t shirt", "tshirt", "polo t-shirt", "graphic t-shirt", "oversized t-shirt", "cotton t-shirt", "টি শার্ট", "টি-শার্ট", "টিশার্ট", "গেঞ্জি"],
    language: "bilingual"
  },
  {
    id: "syn-shirt",
    term: "shirt",
    synonyms: ["casual shirt", "formal shirt", "shart", "শার্ট"],
    language: "bilingual"
  },
  {
    id: "syn-panjabi",
    term: "panjabi",
    synonyms: ["punjabi", "kabli", "kurta", "পাঞ্জাবি", "পাঞ্জাবী", "কাবলি", "কুর্তা", "পাঞ্জাবীর কাপড়"],
    language: "bilingual"
  },
  {
    id: "syn-pant",
    term: "pant",
    synonyms: ["trouser", "jeans", "gabardine", "joggers", "cargo", "প্যান্ট", "জিন্স", "গেবার্ডিন", "পাজামা"],
    language: "bilingual"
  },
  {
    id: "syn-trimmer",
    term: "trimmer",
    synonyms: ["clipper", "shaver", "hair trimmer", "nose trimmer", "beard trimmer", "hair clipper", "ট্রিমার", "শেভার", "নাক ট্রিমার", "দাড়ি কাটার মেশিন"],
    language: "bilingual"
  },
  {
    id: "syn-fan",
    term: "fan",
    synonyms: ["mini fan", "hand fan", "portable fan", "rechargeable fan", "table fan", "ফ্যান", "মিনি ফ্যান", "হাত ফ্যান", "চার্জার ফ্যান"],
    language: "bilingual"
  },
  {
    id: "syn-microphone",
    term: "microphone",
    synonyms: ["mic", "wireless mic", "collar mic", "k35", "k8", "k9", "vlogging mic", "মাইক্রোফোন", "মাইক", "কলার মাইক"],
    language: "bilingual"
  },
  {
    id: "syn-speaker",
    term: "speaker",
    synonyms: ["bluetooth speaker", "soundbox", "portable speaker", "mini speaker", "স্পিকার", "সাউন্ডবক্স", "ব্লুটুথ স্পিকার"],
    language: "bilingual"
  },
  {
    id: "syn-camera",
    term: "camera",
    synonyms: ["cctv", "ip camera", "wifi camera", "wi-fi camera", "mini camera", "spy camera", "bulb camera", "security camera", "cctv camera", "wireless camera", "surveillance", "v380", "a9", "x5", "ক্যামেরা", "সিসিটিভি", "সিকিউরিটি ক্যামেরা"],
    language: "bilingual"
  },
  {
    id: "syn-charger",
    term: "charger",
    synonyms: ["fast charger", "charging cable", "adapter", "usb cable", "type-c", "charging", "socket", "power strip", "চার্জার", "ক্যাবল", "মাল্টিপ্লাগ"],
    language: "bilingual"
  },
  {
    id: "syn-headphones",
    term: "headphones",
    synonyms: ["earphones", "earbuds", "headset", "airpods", "tws", "wireless earbuds", "হেডফোন", "ইয়ারফোন", "ইয়ারবাডস", "এয়ারপডস"],
    language: "bilingual"
  },
  {
    id: "syn-smartwatch",
    term: "smartwatch",
    synonyms: ["smart watch", "fitness band", "smartband", "watch", "wrist watch", "quartz watch", "স্মার্টওয়াচ", "স্মার্ট ওয়াচ", "ঘড়ি", "ঘড়ি", "হাত ঘড়ি", "হাত ঘড়ি"],
    language: "bilingual"
  },
  {
    id: "syn-powerbank",
    term: "power bank",
    synonyms: ["powerbank", "portable charger", "battery pack", "পাওয়ার ব্যাংক", "পাওয়ার ব্যাংক"],
    language: "bilingual"
  },
  {
    id: "syn-keyboard",
    term: "keyboard",
    synonyms: ["key pad", "keypad", "mechanical keyboard", "কীবোর্ড"],
    language: "bilingual"
  },
  {
    id: "syn-mouse",
    term: "mouse",
    synonyms: ["gaming mouse", "wireless mouse", "মাউস", "গেমিং মাউস"],
    language: "bilingual"
  },
  {
    id: "syn-shoes",
    term: "shoes",
    synonyms: ["shoe", "sneakers", "sneaker", "footwear", "boots", "sandals", "loafers", "জুতা", "জুতো", "স্নিকার্স", "স্যান্ডেল", "লোফার"],
    language: "bilingual"
  },
  {
    id: "syn-beauty",
    term: "beauty",
    synonyms: ["cream", "serum", "lotion", "shampoo", "facewash", "face wash", "perfume", "attar", "lipstick", "makeup", "ক্রিম", "সিরাম", "লোশন", "শ্যাম্পু", "ফেসওয়াশ", "পারফিউম", "আতর"],
    language: "bilingual"
  },
  {
    id: "syn-dispenser",
    term: "water dispenser",
    synonyms: ["dispenser", "water pump", "rechargeable water dispenser", "automatic water pump", "পাম্প", "ডিসপেন্সার", "পানির পাম্প"],
    language: "bilingual"
  },
  {
    id: "syn-mobile",
    term: "mobile",
    synonyms: ["mobile phone", "phone", "smartphone", "cell phone", "button phone", "feature phone", "মোবাইল", "ফোন", "স্মার্টফোন", "বাটন মোবাইল"],
    language: "bilingual"
  },
  {
    id: "syn-bag",
    term: "bag",
    synonyms: ["backpack", "handbag", "school bag", "travel bag", "side bag", "wallet", "ব্যাগ", "হ্যান্ডব্যাগ", "ব্যাকপ্যাক", "মানিব্যাগ"],
    language: "bilingual"
  },
  {
    id: "syn-fridge",
    term: "fridge",
    synonyms: ["refrigerator", "deep fridge", "mini fridge", "ফ্রিজ", "রেফ্রিজারেটর", "ডিপ ফ্রিজ"],
    language: "bilingual"
  }
];

class SynonymManager {
  private rules: Map<string, SynonymRule> = new Map();
  private synonymToTermMap: Map<string, string> = new Map();
  private termToSynonymsMap: Map<string, Set<string>> = new Map();
  private isLoaded = false;

  constructor() {
    this.loadDefaultRules();
  }

  private loadDefaultRules() {
    for (const rule of DEFAULT_SYNONYMS) {
      this.addRuleToMemory(rule);
    }
  }

  private addRuleToMemory(rule: SynonymRule) {
    this.rules.set(rule.id, rule);
    const mainTerm = rule.term.toLowerCase().trim();
    
    if (!this.termToSynonymsMap.has(mainTerm)) {
      this.termToSynonymsMap.set(mainTerm, new Set([mainTerm]));
    }
    
    for (const syn of rule.synonyms) {
      const normalizedSyn = syn.toLowerCase().trim();
      this.synonymToTermMap.set(normalizedSyn, mainTerm);
      this.termToSynonymsMap.get(mainTerm)?.add(normalizedSyn);
    }
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const snapshot = await getDocs(collection(db, "search_synonyms"));
      if (!snapshot.empty) {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as SynonymRule;
          this.addRuleToMemory({ ...data, id: docSnap.id });
        });
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn("[SynonymManager] Firestore fetch failed, using default synonyms", err);
      this.isLoaded = true;
    }
  }

  public getAllRules(): SynonymRule[] {
    return Array.from(this.rules.values());
  }

  public expandQuery(query: string): { expandedTerms: string[]; matchedRules: string[] } {
    const rawQuery = query.toLowerCase().trim();
    const rawTokens = rawQuery.split(/[\s-]+/).filter((t) => t.length >= 2);
    const expandedSet = new Set<string>([rawQuery]);
    const matchedRulesSet = new Set<string>();

    const matchesSynonym = (target: string, term: string): boolean => {
      if (!target || !term) return false;
      const t = target.toLowerCase().trim();
      const s = term.toLowerCase().trim();
      if (t === s) return true;
      if (t.length >= 3 && s.length >= 3) {
        const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(?:^|[^\\w\\u0980-\\u09FF])${escaped}(?:$|[^\\w\\u0980-\\u09FF])`, "i");
        return regex.test(t);
      }
      return false;
    };

    // 1. Check exact phrase against synonym rules
    for (const rule of this.rules.values()) {
      const allSyns = [rule.term, ...rule.synonyms].map((s) => s.toLowerCase().trim());
      if (allSyns.some((syn) => matchesSynonym(rawQuery, syn))) {
        matchedRulesSet.add(rule.term);
        allSyns.forEach((syn) => expandedSet.add(syn));
      }
    }

    // 2. Check individual query tokens against rule terms
    for (const token of rawTokens) {
      for (const rule of this.rules.values()) {
        const allSyns = [rule.term, ...rule.synonyms].map((s) => s.toLowerCase().trim());
        if (allSyns.some((syn) => matchesSynonym(token, syn))) {
          matchedRulesSet.add(rule.term);
          allSyns.forEach((syn) => expandedSet.add(syn));
        }
      }
    }

    return {
      expandedTerms: Array.from(expandedSet),
      matchedRules: Array.from(matchedRulesSet)
    };
  }

  public async saveRule(rule: Omit<SynonymRule, "id"> & { id?: string }): Promise<SynonymRule> {
    const id = rule.id || `syn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const fullRule: SynonymRule = {
      id,
      term: rule.term,
      synonyms: rule.synonyms,
      category: rule.category || "General",
      language: rule.language || "bilingual",
      updated_at: new Date().toISOString()
    };

    this.addRuleToMemory(fullRule);

    try {
      await setDoc(doc(db, "search_synonyms", id), fullRule, { merge: true });
    } catch (e) {
      console.warn("[SynonymManager] Save to Firestore warning:", e);
    }

    return fullRule;
  }

  public async deleteRule(id: string): Promise<void> {
    this.rules.delete(id);
    try {
      await deleteDoc(doc(db, "search_synonyms", id));
    } catch (e) {
      console.warn("[SynonymManager] Delete from Firestore warning:", e);
    }
  }
}

export const synonymManager = new SynonymManager();
