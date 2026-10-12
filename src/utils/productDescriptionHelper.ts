/**
 * Smart Product Description Generator & Formatter for Durtup.shop
 * Ensures real supplier descriptions (Bengali/English) are always preserved and displayed,
 * and generates authentic, category-accurate descriptions when raw descriptions are missing.
 */

export interface ProductDescriptionContext {
  id?: string;
  name: string;
  category?: string;
  category_id?: string;
  brand?: string;
  rawDescription?: string | null;
  short_description?: string | null;
  sku?: string;
  price?: number;
}

const GENERIC_PLACEHOLDERS = new Set([
  "high quality product.",
  "high quality product",
  "high quality product from store.",
  "high quality product from store",
  "international quality product.",
  "international quality product",
  "product",
  "untitled product",
  "good product",
  "test product",
  "n/a",
  "undefined",
  "null",
  "none",
  ""
]);

/**
 * Checks if a description is just an empty placeholder or too minimal.
 * Safe for Bengali and all international Unicode character sets.
 */
export function isPlaceholderDescription(desc?: string | null): boolean {
  if (!desc || typeof desc !== "string") return true;
  const clean = desc.trim();
  if (clean.length < 5) return true;
  
  // Strip HTML tags safely to check inner text content
  const strippedHtml = clean.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  if (strippedHtml.length < 5) return true;

  const lower = strippedHtml.toLowerCase();
  if (GENERIC_PLACEHOLDERS.has(lower)) return true;
  
  // If it's only punctuation or whitespace
  if (/^[\s.,!?;:_\-\*\/\\]+$/.test(strippedHtml)) return true;
  
  return false;
}

/**
 * Generates an intelligent, authentic, and category-accurate description
 * when raw catalog items lack a detailed description.
 */
export function generateSmartDescription(context: ProductDescriptionContext): string {
  const name = (context.name || "Premium Product").trim();
  const lowerName = name.toLowerCase();
  const category = (context.category || context.category_id || "").toLowerCase();

  // 1. Fashion, Apparel, Footwear, Bags, Panjabi, Pants, Joggers (MUST BE CHECKED FIRST)
  if (
    lowerName.match(/\b(pant|pants|jogger|joggers|trouser|trousers|jeans|denim|chinos|cargo|tracksuit|sweatpants|shirt|shirts|t-shirt|t-shirts|tshirt|tshirts|polo|panjabi|punjabi|kabli|kurta|pajama|pyjama|saree|sharee|kurti|kameez|three piece|3 piece|abaya|borkha|burqa|salwar|kamiz|jacket|jackets|hoodie|hoodies|sweater|sweaters|blazer|coat|shoe|shoes|sneaker|sneakers|loafer|loafers|sandal|sandals|slipper|slippers|slide|slides|bag|bags|backpack|backpacks|wallet|wallets|belt|belts|cloth|clothing|apparel|fashion|innerwear|boxer|brief|sock|socks)\b/i) ||
    /(প্যান্ট|জগার্স|ট্রাউজার|জিন্স|শার্ট|টি-শার্ট|পোলো|পাঞ্জাবি|কাবলি|পাজামা|পায়জামা|শাড়ি|কুর্তি|কামিজ|থ্রি পিস|বোরকা|হিজাব|জ্যাকেট|হুডি|সোয়েটার|জুতো|জুতা|স্নিকার্স|লোফার|স্যান্ডেল|ব্যাগ|মানিব্যাগ|বেল্ট|পোশাক)/i.test(name) ||
    category.includes("fashion") ||
    category.includes("clothing") ||
    category.includes("apparel") ||
    category.includes("mens") ||
    category.includes("womens") ||
    category.includes("men's") ||
    category.includes("women's")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    আপনার স্টাইল এবং আরামদায়ক ব্যবহারের জন্য প্রিমিয়াম কোয়ালিটির <strong>${name}</strong>। উন্নত মানের ফেব্রিক, আকর্ষণীয় কালার এবং নিখুঁত ফিনিশিংয়ে তৈরি—যা প্রতিদিনের ক্যাজুয়াল, অফিস কিংবা বিশেষ যেকোনো অনুষ্ঠানে পরার জন্য উপযুক্ত।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      পণ্যের মূল বৈশিষ্ট্য ও বিবরণ (Key Highlights):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>প্রিমিয়াম ফেব্রিক:</strong> অত্যন্ত আরামদায়ক, নরম এবং দীর্ঘস্থায়ী ফেব্রিক যা সারাদিন পরে থাকলেও স্বস্তি দেয়।</li>
      <li><strong>ট্রেন্ডি ডিজাইন ও পারফেক্ট ফিটিং:</strong> আধুনিক স্টাইলিশ কাটিং যা যেকোনো লুকের সাথে সহজে মানিয়ে যায়।</li>
      <li><strong>মজবুত স্টিচিং:</strong> নিখুঁত ও টেকসই সেলাই, ফলে সহজে সেলাই খোলার ভয় নেই।</li>
      <li><strong>কালার ও সাইজ গ্যারান্টি:</strong> বারবার ওয়াশের পরও রঙের উজ্জ্বলতা ও মাপ ঠিক থাকে।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>ক্যাটাগরি:</strong> Fashion & Lifestyle</div>
    <div><strong>ফিটিং টাইপ:</strong> Regular / Slim Comfort Fit</div>
    <div><strong>ব্যবহার:</strong> ক্যাজুয়াল, ট্রাভেল ও ডেইলি ওয়্যার</div>
    <div><strong>কোয়ালিটি:</strong> ১০০% কোয়ালিটি চ্যাকড জেনুইন প্রডাক্ট</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি সুবিধা:</strong> সারাদেশে ক্যাশ অন ডেলিভারি (কুরিয়ারের সামনে পণ্য চেক করে পেমেন্ট করার সুবিধা)।</p>
  </div>
</div>
`.trim();
  }

  // 2. Watches & Smartwatches
  if (
    lowerName.match(/\b(watch|watches|smartwatch|smart watch|chronograph|quartz|dial|clock|wristband|fitness band)\b/i) ||
    /(ঘড়ি|ঘড়ি|স্মার্টওয়াচ|স্মার্ট ওয়াচ)/i.test(name) ||
    category.includes("watch")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    আপনার ব্যক্তিত্বে আভিজাত্য যোগ করতে প্রিমিয়াম ডিজাইনের <strong>${name}</strong>। নিখুঁত টাইমকিপিং, আকর্ষণীয় ডায়াল এবং প্রিমিয়াম মেটিরিয়াল দিয়ে তৈরি একটি নির্ভরযোগ্য ঘড়ি।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      মূল বৈশিষ্ট্যসমূহ (Key Features):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>নিখুঁত ডিসপ্লে ও মুভমেন্ট:</strong> হাই-অ্যাকিউরেট মুভমেন্ট এবং স্ক্র্যাচ-রেজিস্ট্যান্ট স্বচ্ছ গ্লাস ডায়াল।</li>
      <li><strong>প্রিমিয়াম স্ট্র্যাপ:</strong> দীর্ঘস্থায়ী, টেকসই ও ত্বকের জন্য সম্পূর্ণ আরামদায়ক স্ট্র্যাপ।</li>
      <li><strong>দৈনন্দিন ওয়াটার রেজিস্ট্যান্ট:</strong> হাত ধোয়া বা হালকা পানির ছিঁটা থেকে সুরক্ষার সুবিধা।</li>
      <li><strong>১০০% অথেনটিক কোয়ালিটি:</strong> প্রতিটি ইউনিট সম্পূর্ণ নতুন ও কোয়ালিটি চেক করে প্যাকেজিং করা।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>ক্যাটাগরি:</strong> Watches & Accessories</div>
    <div><strong>কন্ডিশন:</strong> 100% Brand New Authentic</div>
    <div><strong>ওয়ারেন্টি:</strong> ৭ দিনের রিটার্ন ও রিপ্লেসমেন্ট সুবিধা</div>
    <div><strong>প্যাকেজ:</strong> অরিজিনাল সিকিউর বক্স প্যাকেজিং</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি:</strong> ঢাকা সিটিতে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ৪৮-৭২ ঘণ্টায় ক্যাশ অন ডেলিভারি।</p>
  </div>
</div>
`.trim();
  }

  // 3. Audio, Chargers, Power Banks, Gadgets & Electronics
  if (
    lowerName.match(/\b(charger|chargers|cable|cables|adapter|power bank|powerbank|earbud|earbuds|airpod|airpods|headphone|headphones|earphone|earphones|headset|headsets|speaker|speakers|soundbar|bluetooth|tws|wireless|trimmer|trimmers|shaver|shavers|clipper|clippers|mouse|keyboard|router|stand|tripod|holder|microphone|mic)\b/i) ||
    /(হেডফোন|এয়ারবাডস|স্পিকার|চার্জার|ক্যাবল|পাওয়ার ব্যাংক|ট্রিমার|মাউস|কীবোর্ড|রাউটার|মাইক্রোফোন)/i.test(name) ||
    category.includes("gadget") ||
    category.includes("electronic")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    আপনার স্মার্ট ডিজিটাল লাইফকে আরও সহজ ও আনন্দদায়ক করতে <strong>${name}</strong>। আধুনিক প্রযুক্তি, হাই-পারফরম্যান্স এবং দীর্ঘস্থায়ী স্থায়িত্বের নিশ্চয়তা।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      বিশেষ সুবিধাসমূহ (Key Specifications):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>হাই-স্পিড ও স্ট্যাবল পারফরম্যান্স:</strong> দ্রুত রেসপন্স ও নিরবচ্ছিন্ন আউটপুট প্রদানের জন্য বিশেষভাবে তৈরি।</li>
      <li><strong>ইউনিভার্সাল কম্প্যাটিবিলিটি:</strong> অ্যান্ড্রয়েড, আইওএস ও যেকোনো স্মার্ট ডিভাইসের সাথে সহজে কানেক্টেবল।</li>
      <li><strong>স্মার্ট সেফটি প্রটেকশন:</strong> ওভার-ভোল্টেজ, শর্ট সার্কিট ও অতিরিক্ত গরম হওয়া রোধে আধুনিক বিল্ট-ইন সুরক্ষা।</li>
      <li><strong>কমপ্যাক্ট ও পোর্টেবল:</strong> সহজে বহনযোগ্য এবং প্রতিদিনের ব্যবহারে অত্যন্ত টেকসই।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>ডিভাইস টাইপ:</strong> স্মার্ট গ্যাজেটস ও এক্সেসরিজ</div>
    <div><strong>বিল্ড মেটেরিয়াল:</strong> ফায়ারপ্রুফ প্রিমিয়াম কম্পোনেন্টস</div>
    <div><strong>কোয়ালিটি:</strong> ১০০% টেস্টেড ও ভেরিফায়েড</div>
    <div><strong>ডেলিভারি:</strong> হোম ডেলিভারিতে পণ্য দেখে নেওয়ার সুবিধা</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>পেমেন্ট:</strong> সারাদেশে ক্যাশ অন ডেলিভারি এবং অনলাইন পেমেন্ট সুবিধা।</p>
  </div>
</div>
`.trim();
  }

  // 4. Kitchen & Home Appliances (Strict word boundaries - NEVER match 'pant' or fashion!)
  if (
    lowerName.match(/\b(electric pot|hot pot|rice cooker|steamer|blender|blenders|kettle|kettles|air fryer|fryer|grinder|grinders|frying pan|cooking pot|juicer|juicers|oven|ovens|chopper|choppers|cooker|cookware|gas stove|induction|mixer)\b/i) ||
    /(রাইস কুকার|ব্লেন্ডার|কেটলি|এয়ার ফ্রায়ার|গ্রাইন্ডার|চপার|ওভেন|কুকিং পট|রান্না)/i.test(name) ||
    (category.includes("kitchen") && !lowerName.match(/\b(pant|pants|fashion|cloth|shirt)\b/i))
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    আপনার রান্নাঘরের দৈনন্দিন রান্নার কাজকে দ্রুত ও আরামদায়ক করতে <strong>${name}</strong>। আধুনিক ডিজাইন, বিদ্যুৎ সাশ্রয়ী প্রযুক্তি এবং মজবুত বডি ম্যাটেরিয়ালে তৈরি।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      বৈশিষ্ট্য ও সুবিধা (Key Features):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>মাল্টি-ফাংশনাল ব্যবহার:</strong> দ্রুত রান্না, সিদ্ধ, ফ্রাই কিংবা খাবার গরম করার জন্য অত্যন্ত উপযোগী।</li>
      <li><strong>নন-স্টিক কোটিং:</strong> খাবার পাত্রের গায়ে লেগে যায় না এবং অল্প তেলেই সহজে রান্না করা যায়।</li>
      <li><strong>সহজ পরিষ্কার:</strong> ওয়াশেবল ডিজাইন হওয়ায় রান্নার পর ঝটপট পরিষ্কার করা যায়।</li>
      <li><strong>নিরাপত্তা সুরক্ষা:</strong> অতিরিক্ত গরম হওয়া থেকে সুরক্ষায় স্মার্ট থার্মোস্ট্যাট সেন্সর।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>ক্যাটাগরি:</strong> Kitchen & Home Appliances</div>
    <div><strong>ম্যাটেরিয়াল:</strong> ফুড-গ্রেড স্টেইনলেস স্টিল ও হিট-রেজিস্ট্যান্ট এবিএস</div>
    <div><strong>কন্ডিশন:</strong> 100% Brand New Authentic</div>
    <div><strong>ব্যবহার:</strong> হোম, অফিস কিংবা ব্যাচেলর কিচেন</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি:</strong> সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি (কুরিয়ারের সামনে দেখে নেওয়ার সুবিধা)।</p>
  </div>
</div>
`.trim();
  }

  // 5. Beauty, Skincare & Grooming
  if (
    lowerName.match(/\b(serum|cream|lotion|facewash|face wash|soap|shampoo|conditioner|sunscreen|moisturizer|toner|oil|hair oil|perfume|attar|body spray|mist|lipstick|makeup|beauty|skincare|hair care)\b/i) ||
    /(সিরাম|ক্রিম|লোশন|ফেসওয়াশ|শ্যাম্পু|সানস্ক্রিন|তেল|পারফিউম|আতর|লিপস্টিক|মেকআপ|সৌন্দর্য)/i.test(name) ||
    category.includes("beauty") ||
    category.includes("skincare")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    আপনার ত্বক ও রূপচর্চাকে সতেজ রাখতে আসল ও কার্যকরী <strong>${name}</strong>। স্বাস্থ্যসম্মত উপাদানে তৈরি যা দৈনন্দিন স্কিন ও পার্সোনাল কেয়ারের জন্য অত্যন্ত উপকারী।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      উপকারিতা ও বৈশিষ্ট্য (Key Benefits):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>আসল উপাদান:</strong> প্রাকৃতিক ও কার্যকরী উপাদান দিয়ে তৈরি যা ত্বকের স্বাভাবিক উজ্জ্বলতা বজায় রাখে।</li>
      <li><strong>সব ধরনের ত্বকে মানানসই:</strong> সংবেদনশীল ত্বকসহ নিয়মিত ব্যবহারের জন্য উপযোগী।</li>
      <li><strong>ত্বক ও চুলের পুষ্টি:</strong> গভীর থেকে আর্দ্রতা ও পুষ্টি জোগায়।</li>
      <li><strong>১০০% জেনুইন প্রডাক্ট:</strong> সম্পূর্ণ নতুন ও সিলগালা করা অথেনটিক পণ্য।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>ক্যাটাগরি:</strong> Beauty & Personal Care</div>
    <div><strong>ব্যবহার:</strong> প্রতিদিনের রূপচর্চা ও পার্সোনাল গ্রুমিং</div>
    <div><strong>গুণমান:</strong> ১০০% অথেনটিক কোয়ালিটি</div>
    <div><strong>প্যাকিং:</strong> অরিজিনাল সিল্ড প্যাক</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি:</strong> সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা।</p>
  </div>
</div>
`.trim();
  }

  // 6. Orthotic, Pain Relief, Healthcare, Insoles & Wellness
  if (
    lowerName.match(/\b(insole|insoles|magnetic|orthotic|orthopedic|pain relief|posture|massager|massage|therapy|belt support|knee cap|knee support)\b/i) ||
    /(ইনসোল|ম্যাসাজার|ব্যথা মুক্তি|বেল্ট|হাঁটুর ক্যাপ)/i.test(name) ||
    category.includes("health")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    দৈনন্দিন শারীরিক আরাম ও দীর্ঘক্ষণ হাঁটা-চলাফেরাকে স্বাচ্ছন্দ্যময় করতে <strong>${name}</strong>। বিশেষ এর্গোনমিক ডিজাইন যা শরীরের ব্যালেন্স ঠিক রাখতে এবং পেশির ক্লান্তি কমাতে সহায়ক।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      মূল উপকারিতা (Key Benefits):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>আরামদায়ক সাপোর্ট:</strong> শরীরের ভর সমানভাবে বণ্টন করে পায়ে ও জয়েন্টে চাপ কমায়।</li>
      <li><strong>শ্বাস-প্রশ্বাস উপযোগী ডিজাইন:</strong> দীর্ঘক্ষণ ব্যবহারে পা ঘামা ও দুর্গন্ধ প্রতিরোধ করে।</li>
      <li><strong>উচ্চমানের ম্যাটেরিয়াল:</strong> মেডিকেল গ্রেড আরামদায়ক ও টেকসই উপাদান দিয়ে তৈরি।</li>
      <li><strong>সহজ ব্যবহার:</strong> দৈনন্দিন জুতো কিংবা পোশাকে সহজে অ্যাডজাস্ট করে নেওয়া যায়।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>উপযোগী:</strong> দীর্ঘ সময় দাঁড়িয়ে কাজ, হাঁটা ও জয়েন্ট স্বস্তি</div>
    <div><strong>ব্যবহারকারী:</strong> নারী ও পুরুষ উভয়ের জন্য প্রযোজ্য</div>
    <div><strong>কন্ডিশন:</strong> 100% Brand New Authentic</div>
    <div><strong>কোয়ালিটি:</strong> যাচাইকৃত হাই কোয়ালিটি</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি:</strong> ক্যাশ অন ডেলিভারিতে সারাদেশে পৌঁছে দেওয়া হয়।</p>
  </div>
</div>
`.trim();
  }

  // 7. Foods, Honey, Ghee, Dates, Dry Fruits, Organic Groceries
  if (
    lowerName.match(/\b(honey|ghee|mustard oil|dates|nut|nuts|kaju|badam|chia|chia seed|protein|supplement|milk shake|milkshake|weight gain|organic|tea|coffee|chili|spice|spices)\b/i) ||
    /(মধু|ঘি|সরিষার তেল|খেজুর|বাদাম|কাজু|চিয়া সিড|চা|কফি|মসলা|অর্গানিক ফুড)/i.test(name) ||
    category.includes("food") ||
    category.includes("organic")
  ) {
    return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    বিশুদ্ধতা ও পুষ্টিগুণে ভরপুর প্রিমিয়াম কোয়ালিটির <strong>${name}</strong>। সম্পূর্ণ স্বাস্থ্যসম্মত উপায়ে সংগৃহীত এবং ভেজালমুক্ত খাঁটি উপাদান সমৃদ্ধ।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      গুণাগুণ ও বৈশিষ্ট্য (Quality Highlights):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>১০০% খাঁটি ও প্রাকৃতিক:</strong> কোনো প্রকার কৃত্রিম ক্ষতিকর কেমিক্যাল বা প্রিজারভেটিভ মুক্ত।</li>
      <li><strong>পুষ্টিগুণে ভরপুর:</strong> রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি ও সুস্বাস্থ্যের জন্য অত্যন্ত কার্যকরী।</li>
      <li><strong>স্বাস্থ্যসম্মত হাইজিন প্যাকেজিং:</strong> সতেজতা ও গুণমান অক্ষুণ্ণ রাখতে বিশেষ এয়ার-টাইট প্যাক।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>ক্যাটাগরি:</strong> Organic Foods & Nutrition</div>
    <div><strong>বিশুদ্ধতা:</strong> ১০০% গ্যারান্টিযুক্ত খাঁটি পণ্য</div>
    <div><strong>প্যাকিং:</strong> ফুড গ্রেড হাইজিন সিল্ড জার/প্যাক</div>
    <div><strong>পেমেন্ট:</strong> ক্যাশ অন ডেলিভারি সুবিধা</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি:</strong> সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি।</p>
  </div>
</div>
`.trim();
  }

  // 8. Universal Default for all other products
  return `
<div class="space-y-4">
  <p class="text-sm leading-relaxed text-foreground/90 font-medium">
    সেরা মান এবং সাশ্রয়ী মূল্যে আসল <strong>${name}</strong>। নির্ভরযোগ্য কোয়ালিটি ও দীর্ঘস্থায়িত্বের নিশ্চয়তায় তৈরি একটি খাঁটি পণ্য।
  </p>

  <div class="bg-muted/30 border border-border/70 rounded-xl p-4 my-3">
    <h4 class="font-semibold text-sm text-foreground mb-2.5">
      পণ্যের মূল বিবরণ ও বৈশিষ্ট্য (Product Highlights):
    </h4>
    <ul class="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
      <li><strong>১০০% অথেনটিক কোয়ালিটি:</strong> সম্পূর্ণ নতুন, ত্রুটিমুক্ত এবং কোয়ালিটি টেস্টেড পণ্য।</li>
      <li><strong>টেকসই ও দীর্ঘস্থায়ী:</strong> উন্নত মানের উপাদান দিয়ে তৈরি হওয়ায় দীর্ঘদিন স্বাচ্ছন্দ্যে ব্যবহার করা যায়।</li>
      <li><strong>সহজ ব্যবহার:</strong> কোনো জটিলতা ছাড়া সরাসরি ব্যবহারের উপযোগী।</li>
      <li><strong>সেরা মূল্যের নিশ্চয়তা:</strong> সরাসরি মার্কেটপ্লেস রেটে সেরা ডিল।</li>
    </ul>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border rounded-xl p-3 bg-muted/20">
    <div><strong>প্রডাক্ট:</strong> ${name}</div>
    <div><strong>কন্ডিশন:</strong> 100% Brand New Authentic</div>
    <div><strong>কোয়ালিটি:</strong> কোয়ালিটি চেকড ও ভেরিফায়েড</div>
    <div><strong>স্টক:</strong> ইন-স্টক (রেডি টু শিপ)</div>
  </div>

  <div class="text-xs text-muted-foreground pt-1 border-t border-border/60">
    <p><strong>ডেলিভারি:</strong> ঢাকা সহ সারাদেশে ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে চেক করে পেমেন্ট করার সুবিধা)।</p>
  </div>
</div>
`.trim();
}

/**
 * Ensures the product has a rich, properly formatted description.
 * If raw description from supplier exists, it is ALWAYS prioritized and returned.
 */
export function getEnhancedProductDescription(product: {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  category_id?: string;
  brand?: string;
  description?: string | null;
  details?: string | null;
  short_description?: string | null;
  sku?: string;
  price?: number;
}): string {
  const prodName = product.name || product.title || "Product";
  const rawDesc = product.details || product.description;

  if (!rawDesc || isPlaceholderDescription(rawDesc)) {
    return generateSmartDescription({
      id: product.id,
      name: prodName,
      category: product.category || product.category_id,
      brand: product.brand,
      rawDescription: rawDesc,
      short_description: product.short_description,
      price: product.price
    });
  }

  return rawDesc;
}
