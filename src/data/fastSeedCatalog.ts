export interface Product {
  id: string | number;
  name: string;
  slug?: string;
  product_code?: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  regular_price?: number;
  discount_price?: number;
  rating?: number;
  reviews?: number;
  sold?: number;
  stock?: number;
  image?: string;
  images?: string[];
  product_images?: any[];
  category?: string;
  category_name?: string;
  category_slug?: string;
  categorySlug?: string;
  categoryName?: string;
  product_variants?: any[];
  variants?: any[];
  details?: string;
  description?: string;
  [key: string]: any;
}

export const FAST_SEED_PRODUCTS: Product[] = [
  {
    "id": "ac0a83b2-e060-450f-aabe-6ef05e56eb31",
    "name": "X5 Full HD Mini WiFi IP Camera – Wireless Security CCTV with Night Vision, Motion Detection & Audio",
    "slug": "x5-full-hd-mini-wifi-ip-camera-ac0a83b2",
    "product_code": "X5-CAM-1080P",
    "sku": "X5-CAM-1080P",
    "category": "Gadgets, Mouse & Cameras",
    "category_name": "Gadgets, Mouse & Cameras",
    "category_slug": "gadgets",
    "categorySlug": "gadgets",
    "categoryName": "Gadgets, Mouse & Cameras",
    "image": "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
    "images": [
      "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
      "https://img.drz.lazcdn.com/g/kf/Sec2b1daa39534496942b05d978d99040g.jpg_720x720q80.jpg"
    ],
    "product_images": [
      {
        "id": "img-x5-1",
        "image_url": "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
        "is_primary": true
      },
      {
        "id": "img-x5-2",
        "image_url": "https://img.drz.lazcdn.com/g/kf/Sec2b1daa39534496942b05d978d99040g.jpg_720x720q80.jpg",
        "is_primary": false
      }
    ],
    "price": 1150,
    "originalPrice": 1650,
    "regular_price": 1650,
    "rating": 4.8,
    "reviews": 42,
    "sold": 185,
    "stock": 45,
    "product_variants": [],
    "details": "X5 Full HD Mini WiFi IP Camera – Wireless Security CCTV with Night Vision, Motion Detection & Audio",
    "description": "X5 Full HD Mini WiFi IP Camera – Wireless Security CCTV with Night Vision, Motion Detection & Audio"
  },
  {
    "id": "14",
    "name": "X01 Full Charge Separator – Type-C Auto Power Cut-Off Charging Protector with Mechanical Pop-Out Feature & Fast Charging Support",
    "slug": "x01-full-charge-separator-type-c-auto-power-cut-off-charging-14",
    "product_code": "3002",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/4BQ47gb7HC1anqjNVtyUAhgBukNWBFcYKXCXDIyj.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/4BQ47gb7HC1anqjNVtyUAhgBukNWBFcYKXCXDIyj.png",
      "https://mohasagor.com.bd/public/storage/images/products/MpLieZnq0evEREUoIqZj70ENzeyFLlkpKJLxtjgN.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/PvZLpfNrxwky3t4wDEv2kbY9FjQJLo2y6x8zV38O.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/4BQ47gb7HC1anqjNVtyUAhgBukNWBFcYKXCXDIyj.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/MpLieZnq0evEREUoIqZj70ENzeyFLlkpKJLxtjgN.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/PvZLpfNrxwky3t4wDEv2kbY9FjQJLo2y6x8zV38O.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 29,
    "sold": 59,
    "stock": 3,
    "product_variants": [
      {
        "id": "33022",
        "attribute": "Color",
        "variant": "Any Colour",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "রাতে ফোন চার্জে দিয়ে ঘুমিয়ে যাওয়ার পর দীর্ঘক্ষণ ফুল চার্জ হয়ে থাকার কারণে ফোনের ব্যাটারি নষ্ট হওয়ার ঝুঁকি নিয়ে কি আপনি চিন্তিত? এই সমস্যার স্থায়ী ও দা...",
    "description": "রাতে ফোন চার্জে দিয়ে ঘুমিয়ে যাওয়ার পর দীর্ঘক্ষণ ফুল চার্জ হয়ে থাকার কারণে ফোনের ব্যাটারি নষ্ট হওয়ার ঝুঁকি নিয়ে কি আপনি চিন্তিত? এই সমস্যার স্থায়ী ও দা...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "15",
    "name": "Universal Rechargeable Battery Charger – Multi-Functional Wall AC Fast Smart Charger with Auto-Stop, LED Indicator for 18650, 14500, 16340 & More Lithium-Ion Batteries",
    "slug": "rechargeable-battery-charger-3015",
    "product_code": "3015",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/GseLlSOFjGdTdRJk7KvAKcVMyWL0aGio8Q2jD1N2.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/GseLlSOFjGdTdRJk7KvAKcVMyWL0aGio8Q2jD1N2.png",
      "https://mohasagor.com.bd/public/storage/images/products/CPwe4ClU4pdrnLpcKfoenfYGJoHmEb5v5kx3xXIh.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/cUBdM1YSJQylIXi1jmsf2j64NMvpvm0q6f1JvLDI.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/HiIubNTOnuGlb92Mdhv0daLGn0VgqzXbAACfjNsc.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/5BiH5Z528wUOXKav4h470dZiIYp73rtVTE6qRrnb.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/GseLlSOFjGdTdRJk7KvAKcVMyWL0aGio8Q2jD1N2.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/CPwe4ClU4pdrnLpcKfoenfYGJoHmEb5v5kx3xXIh.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/cUBdM1YSJQylIXi1jmsf2j64NMvpvm0q6f1JvLDI.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/HiIubNTOnuGlb92Mdhv0daLGn0VgqzXbAACfjNsc.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/5BiH5Z528wUOXKav4h470dZiIYp73rtVTE6qRrnb.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 280,
    "originalPrice": 378,
    "regular_price": 378,
    "rating": 4.8,
    "reviews": 30,
    "sold": 60,
    "stock": 50,
    "product_variants": [],
    "details": "বিভিন্ন সাইজের রিচার্জেবল ব্যাটারি নিরাপদে এবং দ্রুত চার্জ করার জন্য একটি নির্ভরযোগ্য মাল্টি-ফাংশনাল চার্জার অত্যন্ত জরুরি। বাসা-বাড়ি কিংবা ভ্রমণের সম...",
    "description": "বিভিন্ন সাইজের রিচার্জেবল ব্যাটারি নিরাপদে এবং দ্রুত চার্জ করার জন্য একটি নির্ভরযোগ্য মাল্টি-ফাংশনাল চার্জার অত্যন্ত জরুরি। বাসা-বাড়ি কিংবা ভ্রমণের সম...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "17",
    "name": "Rechargeable Electric Water Dispenser Pump – Universal Wireless Smart Drinking Water Bottle Pump with USB Charging, 360-Degree Rotation & One-Touch Operation",
    "slug": "rechargeable-electric-water-dispenser-pump-universal-wireles-17",
    "product_code": "3017",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/ZASB51oXpZpUBguxcKN1AZXUOnfhBhpbHK8ccsij.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/ZASB51oXpZpUBguxcKN1AZXUOnfhBhpbHK8ccsij.png",
      "https://mohasagor.com.bd/public/storage/images/products/a8kuzJc3klXIe3v7V78UslSpwDPXWr8ZLKxwRxow.png",
      "https://mohasagor.com.bd/public/storage/images/products/GgsMIwN8eERfxZcdFpLedGY8JwK1WALGQe2SNSPK.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/xaNTFURiQFdV5ZlkUJTzCP2vGpYlZ8YvAg0HivFk.png",
      "https://mohasagor.com.bd/public/storage/images/products/8wtNp4jPeMAU3uzgyrdKEzYejRYcFSBcn6wmftMB.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ZASB51oXpZpUBguxcKN1AZXUOnfhBhpbHK8ccsij.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/a8kuzJc3klXIe3v7V78UslSpwDPXWr8ZLKxwRxow.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/GgsMIwN8eERfxZcdFpLedGY8JwK1WALGQe2SNSPK.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/xaNTFURiQFdV5ZlkUJTzCP2vGpYlZ8YvAg0HivFk.png",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/8wtNp4jPeMAU3uzgyrdKEzYejRYcFSBcn6wmftMB.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 780,
    "originalPrice": 1053,
    "regular_price": 1053,
    "rating": 4.8,
    "reviews": 32,
    "sold": 62,
    "stock": 1,
    "product_variants": [],
    "details": "অফিস, বাসা, স্কুল কিংবা যেকোনো স্থানে ভারী জারের পানি তোলা নিয়ে ঝামেলা এড়াতে নিয়ে এলাম আধুনিক ও স্মার্ট Rechargeable Electric Water Dispenser Pump। সন...",
    "description": "অফিস, বাসা, স্কুল কিংবা যেকোনো স্থানে ভারী জারের পানি তোলা নিয়ে ঝামেলা এড়াতে নিয়ে এলাম আধুনিক ও স্মার্ট Rechargeable Electric Water Dispenser Pump। সন...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "18",
    "name": "TP-Link Archer C6 AC1200 Dual-Band Gigabit Wi-Fi Router – MU-MIMO, Beamforming, Access Point Mode & OneMesh Support for Whole-Home Coverage",
    "slug": "tp-link-archer-c6-ac1200-dual-band-gigabit-wi-fi-router-mu-m-18",
    "product_code": "3018",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/bjRBtSU8DuVgoeK8FOUMK2Y47u7Q6FJQZk12goff.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/bjRBtSU8DuVgoeK8FOUMK2Y47u7Q6FJQZk12goff.png",
      "https://mohasagor.com.bd/public/storage/images/products/lNNAxNii3RL2cOaYtek9vNV1SKhqiIh5Vx71Yvjq.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/bLoksjPIRZecdWxgtP07FeaVmYki4SymLG8YSzIo.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/EZL2OZyhVicNz1HL1kl8xvz80yQwaKXnS1R1n8Yt.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Y8XgEzZqe2Q7wq9RRl81e9YAvvcDtjGhLp9zvccJ.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bjRBtSU8DuVgoeK8FOUMK2Y47u7Q6FJQZk12goff.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/lNNAxNii3RL2cOaYtek9vNV1SKhqiIh5Vx71Yvjq.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bLoksjPIRZecdWxgtP07FeaVmYki4SymLG8YSzIo.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/EZL2OZyhVicNz1HL1kl8xvz80yQwaKXnS1R1n8Yt.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Y8XgEzZqe2Q7wq9RRl81e9YAvvcDtjGhLp9zvccJ.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 3500,
    "originalPrice": 4725,
    "regular_price": 4725,
    "rating": 4.8,
    "reviews": 33,
    "sold": 63,
    "stock": 50,
    "product_variants": [],
    "details": "বাসা বা অফিসের জন্য হাই-স্পিড ইন্টারনেট এবং নিরবচ্ছিন্ন ওয়াইফাই কভারেজ নিশ্চিত করতে নিয়ে এলাম বিশ্বখ্যাত ব্র্যান্ড টি-লিংকের অত্যন্ত জনপ্রিয় একটি রাউট...",
    "description": "বাসা বা অফিসের জন্য হাই-স্পিড ইন্টারনেট এবং নিরবচ্ছিন্ন ওয়াইফাই কভারেজ নিশ্চিত করতে নিয়ে এলাম বিশ্বখ্যাত ব্র্যান্ড টি-লিংকের অত্যন্ত জনপ্রিয় একটি রাউট...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "19",
    "name": "Touch Lamp Portable Bluetooth Speaker with Smart Colour Changing Touch Mode Night Lamp",
    "slug": "touch-lamp-portable-bluetooth-speaker-with-smart-colour-chan-19",
    "product_code": "3019",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/clCZJDarpcI5XozS2t9Agf1XCVytG81K1E86lZuj.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/clCZJDarpcI5XozS2t9Agf1XCVytG81K1E86lZuj.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/EaJtVrVPdysYVPjD7t0qWiJMTVYPL72YedtL3YvF.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/vUHHZ4aaEFHLf2cf4IpnJYPlhu5fRCFbHruQiyfP.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/YjigKyvQ4zKSM83kJ0yWvqoEvOQGhwwW12QVypbw.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/639KVqo87xFu7ukhghhCAGdbx6CatFLSTsNA3A9W.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/zbiD9QqlJr1VSkzpwCq9ICeL6tQuuGUxHgF6t4Yc.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/clCZJDarpcI5XozS2t9Agf1XCVytG81K1E86lZuj.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/EaJtVrVPdysYVPjD7t0qWiJMTVYPL72YedtL3YvF.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/vUHHZ4aaEFHLf2cf4IpnJYPlhu5fRCFbHruQiyfP.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/YjigKyvQ4zKSM83kJ0yWvqoEvOQGhwwW12QVypbw.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/639KVqo87xFu7ukhghhCAGdbx6CatFLSTsNA3A9W.jpg",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/zbiD9QqlJr1VSkzpwCq9ICeL6tQuuGUxHgF6t4Yc.jpg",
        "is_primary": false,
        "sort_order": 6
      }
    ],
    "price": 699,
    "originalPrice": 944,
    "regular_price": 944,
    "rating": 4.8,
    "reviews": 34,
    "sold": 64,
    "stock": 50,
    "product_variants": [],
    "details": "Features :Brightness levels: 3Bluetooth : 4.1Support TF/SD card : YesAUX input function : YesSpecification_:Lamp Power : 1.6wSpeaker output power : 3w...",
    "description": "Features :Brightness levels: 3Bluetooth : 4.1Support TF/SD card : YesAUX input function : YesSpecification_:Lamp Power : 1.6wSpeaker output power : 3w...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "21",
    "name": "iCon Mobile i202 Magic",
    "slug": "icon-mobile-i202-magic-21",
    "product_code": "3021",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Pe5PuuhVK7nbnIN1jDNWOUExmRziYaoCNrI99xd4.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Pe5PuuhVK7nbnIN1jDNWOUExmRziYaoCNrI99xd4.png",
      "https://mohasagor.com.bd/public/storage/images/products/XVrdEQXWWfhKQXIWQKDFEq4wAuSKY27OZxItRpAQ.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/t9QA0shAYHLVoYjyF3WH7V3aXGg5G9qa3WGu7lYU.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/pN7cFlt7cmINOEixnRscxigynVdwgZzEK5NYvIyD.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/pF4AkcCukNes1kiWsxhGB5KfAf4suLO2GzxzHUNU.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Pe5PuuhVK7nbnIN1jDNWOUExmRziYaoCNrI99xd4.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/XVrdEQXWWfhKQXIWQKDFEq4wAuSKY27OZxItRpAQ.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/t9QA0shAYHLVoYjyF3WH7V3aXGg5G9qa3WGu7lYU.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pN7cFlt7cmINOEixnRscxigynVdwgZzEK5NYvIyD.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pF4AkcCukNes1kiWsxhGB5KfAf4suLO2GzxzHUNU.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 2990,
    "originalPrice": 4037,
    "regular_price": 4037,
    "rating": 4.8,
    "reviews": 36,
    "sold": 66,
    "stock": 50,
    "product_variants": [
      {
        "id": "32501",
        "attribute": "Color",
        "variant": "black",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32502",
        "attribute": "Color",
        "variant": "Golden",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "আকর্ষণীয় গোল্ডেন ডিজাইন, কমপ্যাক্ট সাইজ এবং চমৎকার সব স্মার্ট ফিচারের এক অনন্য সমন্বয় হলো iCon Mobile i202 Magic মিনি ফোন। যারা একটি স্টাইলিশ সেকেন্ড...",
    "description": "আকর্ষণীয় গোল্ডেন ডিজাইন, কমপ্যাক্ট সাইজ এবং চমৎকার সব স্মার্ট ফিচারের এক অনন্য সমন্বয় হলো iCon Mobile i202 Magic মিনি ফোন। যারা একটি স্টাইলিশ সেকেন্ড...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "29",
    "name": "240W 5A Fast Charging & Sync USB-C to USB-C Cable – Braided Cord with Built-in Folding Phone Stand for Landscape & Portrait Viewing",
    "slug": "240w-5a-fast-charging-sync-usb-c-to-usb-c-cable-braided-cord-29",
    "product_code": "3029",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Qtl3w4LH2dQ1eQTN69DxVQP6uk7Gz9Gg0APK6m55.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Qtl3w4LH2dQ1eQTN69DxVQP6uk7Gz9Gg0APK6m55.png",
      "https://mohasagor.com.bd/public/storage/images/products/CpbgKchlCAaMWybFug9tPzVKL0TQOTCHt7VBsju6.png",
      "https://mohasagor.com.bd/public/storage/images/products/NvOsYRGqDQxvfh53x2Ghmb3chXPTbnrMgtnQ5BNI.png",
      "https://mohasagor.com.bd/public/storage/images/products/G0Vf4qjWtMmJzkKlqqHb9MSMgCmiNQWqifIQfXwL.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/jVaPsyR6rDp4pgBbnFhGjXBrfkyzMuABHus0nxlk.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Qtl3w4LH2dQ1eQTN69DxVQP6uk7Gz9Gg0APK6m55.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/CpbgKchlCAaMWybFug9tPzVKL0TQOTCHt7VBsju6.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/NvOsYRGqDQxvfh53x2Ghmb3chXPTbnrMgtnQ5BNI.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/G0Vf4qjWtMmJzkKlqqHb9MSMgCmiNQWqifIQfXwL.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/jVaPsyR6rDp4pgBbnFhGjXBrfkyzMuABHus0nxlk.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 19,
    "sold": 74,
    "stock": 50,
    "product_variants": [],
    "details": "চার্জিং এবং ডেটা সিঙ্কের ধারণাকে সম্পূর্ণ বদলে দিতে নিয়ে এলাম উদ্ভাবনী ফিচারের 240W Fast Charging &amp; Sync USB-C to USB-C Cable। হাই-স্পিড পাওয়ার ডে...",
    "description": "চার্জিং এবং ডেটা সিঙ্কের ধারণাকে সম্পূর্ণ বদলে দিতে নিয়ে এলাম উদ্ভাবনী ফিচারের 240W Fast Charging &amp; Sync USB-C to USB-C Cable। হাই-স্পিড পাওয়ার ডে...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "33",
    "name": "HY300 Android Smart Mini Projector – 720P Portable WiFi & Bluetooth Projector with 180° Rotation, Auto Keystone Correction, 130\" Screen & Built-in Apps",
    "slug": "hy300-android-smart-mini-projector-720p-portable-wifi-blueto-33",
    "product_code": "3033",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/pmOa6Stx0vb74Tc9hKO5TbKniWOJpJP4EuxMnMrM.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/pmOa6Stx0vb74Tc9hKO5TbKniWOJpJP4EuxMnMrM.png",
      "https://mohasagor.com.bd/public/storage/images/products/y8ip8mVcwayNd72hqbgUuNVONEM7u6AQOqkQgHPd.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Y3Z31q8GvsJryKjeSBHlBsHgcdqi7N018ia9fsOO.png",
      "https://mohasagor.com.bd/public/storage/images/products/pock3KiuqqyBT6kGAqqS5X6PW6VnQtRmz9OfPZjR.png",
      "https://mohasagor.com.bd/public/storage/images/products/bg0VLNWNfS16kkDq6EfGe1E5ZJ86Ejq9JTakFJeY.png",
      "https://mohasagor.com.bd/public/storage/images/products/bKtaFz2HReEw8FuPdlMsZbQoClVX9HZ5XTwxxHdu.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pmOa6Stx0vb74Tc9hKO5TbKniWOJpJP4EuxMnMrM.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/y8ip8mVcwayNd72hqbgUuNVONEM7u6AQOqkQgHPd.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Y3Z31q8GvsJryKjeSBHlBsHgcdqi7N018ia9fsOO.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pock3KiuqqyBT6kGAqqS5X6PW6VnQtRmz9OfPZjR.png",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bg0VLNWNfS16kkDq6EfGe1E5ZJ86Ejq9JTakFJeY.png",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bKtaFz2HReEw8FuPdlMsZbQoClVX9HZ5XTwxxHdu.jpg",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 4950,
    "originalPrice": 6683,
    "regular_price": 6683,
    "rating": 4.8,
    "reviews": 23,
    "sold": 78,
    "stock": 50,
    "product_variants": [],
    "details": "আপনার ঘরের বেডরুম, লিভিং রুম কিংবা আউটডোর ক্যাম্পিংয়ে বড় পর্দায় সিনেমা দেখার অভিজ্ঞতাকে অন্য মাত্রায় নিয়ে যেতে নিয়ে এলাম জনপ্রিয় HY300 Android Smart M...",
    "description": "আপনার ঘরের বেডরুম, লিভিং রুম কিংবা আউটডোর ক্যাম্পিংয়ে বড় পর্দায় সিনেমা দেখার অভিজ্ঞতাকে অন্য মাত্রায় নিয়ে যেতে নিয়ে এলাম জনপ্রিয় HY300 Android Smart M...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "66",
    "name": "Premium Stainless Steel Manual Nose Hair Trimmer – Painless, Battery-Free, Washable & Portable Ear & Nose Grooming Clipper Tool for Men & Women",
    "slug": "premium-stainless-steel-manual-nose-hair-trimmer-p-66",
    "product_code": "3066",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/nq92SxylEfMY15iRJk7hRs4HRzvblIFuSCby1rmm.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/nq92SxylEfMY15iRJk7hRs4HRzvblIFuSCby1rmm.png",
      "https://mohasagor.com.bd/public/storage/images/products/uqFf6TAYsTa3b6ZzZq6pyZ66JQgTYtrz0eFwLUkr.png",
      "https://mohasagor.com.bd/public/storage/images/products/ijZg62mvMyucA6CgjqYGKMYyIAOZOCOpZOAUVzck.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/f6mU6Loi72Nd4PQGJKX7MoHNs5tWqKySVZz03q1Q.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&h=600&fit=crop",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/nq92SxylEfMY15iRJk7hRs4HRzvblIFuSCby1rmm.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/uqFf6TAYsTa3b6ZzZq6pyZ66JQgTYtrz0eFwLUkr.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ijZg62mvMyucA6CgjqYGKMYyIAOZOCOpZOAUVzck.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/f6mU6Loi72Nd4PQGJKX7MoHNs5tWqKySVZz03q1Q.png",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 280,
    "originalPrice": 378,
    "regular_price": 378,
    "rating": 4.8,
    "reviews": 31,
    "sold": 111,
    "stock": 50,
    "product_variants": [],
    "details": "নাকের অবাঞ্ছিত লোম পরিষ্কার করা এখন আর কোনো কষ্টকর বা ঝামেলার কাজ নয়! আমাদের প্রিমিয়াম Manual Nose Hair Trimmer-এর সাহায্যে খুব সহজেই, নিরাপদে এবং কো...",
    "description": "নাকের অবাঞ্ছিত লোম পরিষ্কার করা এখন আর কোনো কষ্টকর বা ঝামেলার কাজ নয়! আমাদের প্রিমিয়াম Manual Nose Hair Trimmer-এর সাহায্যে খুব সহজেই, নিরাপদে এবং কো...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "74",
    "name": "S21 Wireless Bluetooth Receiver & MP3 Player with Earphone – Portable Audio Clip Receiver with TF Card Slot, LED Battery Display, Touch/Button Controls & Hands-Free Calling",
    "slug": "s21-wireless-bluetooth-receiver-mp3-player-with-earphone-por-74",
    "product_code": "3074",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/FJCb6w4rblGquLfhi8ybRz14RQO4bx0A7PcGhvRe.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/FJCb6w4rblGquLfhi8ybRz14RQO4bx0A7PcGhvRe.png",
      "https://mohasagor.com.bd/public/storage/images/products/7Rf6HfJP9hNKyL1qZCmZyDBbwPLbgBxq26MAa1Zb.png",
      "https://mohasagor.com.bd/public/storage/images/products/wMApvbcYkE4N7T7aVbcSTVQeS1AszQJ3taugRLFQ.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/FJCb6w4rblGquLfhi8ybRz14RQO4bx0A7PcGhvRe.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/7Rf6HfJP9hNKyL1qZCmZyDBbwPLbgBxq26MAa1Zb.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/wMApvbcYkE4N7T7aVbcSTVQeS1AszQJ3taugRLFQ.png",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 890,
    "originalPrice": 1202,
    "regular_price": 1202,
    "rating": 4.8,
    "reviews": 39,
    "sold": 119,
    "stock": 3,
    "product_variants": [],
    "details": "সাধারণ ওয়্যারড ইয়ারফোনকে খুব সহজেই ওয়্যারলেস ব্লুটুথ ডিভাইসে রূপান্তর করতে এবং যেকোনো জায়গায় সহজে মিউজিক উপভোগ করতে নিয়ে এলাম S21 Wireless Bluetooth...",
    "description": "সাধারণ ওয়্যারড ইয়ারফোনকে খুব সহজেই ওয়্যারলেস ব্লুটুথ ডিভাইসে রূপান্তর করতে এবং যেকোনো জায়গায় সহজে মিউজিক উপভোগ করতে নিয়ে এলাম S21 Wireless Bluetooth...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "76",
    "name": "ZT rechargeable folding desktop fan with an integrated LED light",
    "slug": "zt-rechargeable-folding-desktop-fan-with-an-integrated-led-l-76",
    "product_code": "3076",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/MNR6iqZjSah2EA8eXxhvBCb9FfeuCx7uwgDNyJxL.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/MNR6iqZjSah2EA8eXxhvBCb9FfeuCx7uwgDNyJxL.png",
      "https://mohasagor.com.bd/public/storage/images/products/LrE5llPofvHVPGFvlxX3RtyfHEDj1UT8y6HD6UPW.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=600&h=600&fit=crop",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/MNR6iqZjSah2EA8eXxhvBCb9FfeuCx7uwgDNyJxL.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/LrE5llPofvHVPGFvlxX3RtyfHEDj1UT8y6HD6UPW.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 1590,
    "originalPrice": 2147,
    "regular_price": 2147,
    "rating": 4.8,
    "reviews": 16,
    "sold": 121,
    "stock": 50,
    "product_variants": [],
    "details": "স্মার্ট রিচার্জেবল ফোল্ডিং ফ্যান – প্রচণ্ড গরমে আপনার পকেটে থাকবে প্রশান্তি! ❄️📱&nbsp;লোকারণ্য বাস, অফিস ডেস্ক বা দীর্ঘক্ষণ বিদ্যুৎ না থাকা—সব জায়গার...",
    "description": "স্মার্ট রিচার্জেবল ফোল্ডিং ফ্যান – প্রচণ্ড গরমে আপনার পকেটে থাকবে প্রশান্তি! ❄️📱&nbsp;লোকারণ্য বাস, অফিস ডেস্ক বা দীর্ঘক্ষণ বিদ্যুৎ না থাকা—সব জায়গার...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "87",
    "name": "A9 Wi-Fi Night Vision Mini IP Camera – 1080P HD Wireless Security CCTV with 180° Wide-Angle Lens, Motion Detection, Loop Recording & Built-in Mic",
    "slug": "a9-wi-fi-night-vision-mini-ip-camera-1080p-hd-wireless-secur-87",
    "product_code": "3087",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/VLgxqqPCjw4tm2aY1bbgjjjfRjpJEKLcdS17inTm.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/VLgxqqPCjw4tm2aY1bbgjjjfRjpJEKLcdS17inTm.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://img.drz.lazcdn.com/g/kf/Sec2b1daa39534496942b05d978d99040g.jpg_720x720q80.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/VLgxqqPCjw4tm2aY1bbgjjjfRjpJEKLcdS17inTm.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 890,
    "originalPrice": 1202,
    "regular_price": 1202,
    "rating": 4.8,
    "reviews": 27,
    "sold": 132,
    "stock": 1,
    "product_variants": [],
    "details": "আপনার বাসা, অফিস, দোকান বা গুদামের গোপনীয় ও নির্ভরযোগ্য নিরাপত্তা নিশ্চিত করতে নিয়ে এলাম অত্যন্ত জনপ্রিয় ও কমপ্যাক্ট ডিজাইনের A9 Wi-Fi Night Vision Mi...",
    "description": "আপনার বাসা, অফিস, দোকান বা গুদামের গোপনীয় ও নির্ভরযোগ্য নিরাপত্তা নিশ্চিত করতে নিয়ে এলাম অত্যন্ত জনপ্রিয় ও কমপ্যাক্ট ডিজাইনের A9 Wi-Fi Night Vision Mi...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "88",
    "name": "FRB N-26 Wireless Bluetooth 5.4 Neckband Earphone - 600 Hours Standby",
    "slug": "frb-n-26-wireless-bluetooth-54-neckband-earphone---600-hours-88",
    "product_code": "3088",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/8LA7UVvvkdFdePE1KA8oQE11ae86IgS8OO4M5owT.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/8LA7UVvvkdFdePE1KA8oQE11ae86IgS8OO4M5owT.png",
      "https://mohasagor.com.bd/public/storage/images/products/ANNry0Wc73nxPl74rSnxTKuqxjFZ50WRCzkcMHs9.png",
      "https://mohasagor.com.bd/public/storage/images/products/W7a6SlDzKETp0vTM4XO2sOmjMRtFI2faWREYlaOY.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/TXbs8OJBAtvQHDVWpkRfVWaDqaeXtDruvpySgBuY.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/8LA7UVvvkdFdePE1KA8oQE11ae86IgS8OO4M5owT.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ANNry0Wc73nxPl74rSnxTKuqxjFZ50WRCzkcMHs9.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/W7a6SlDzKETp0vTM4XO2sOmjMRtFI2faWREYlaOY.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/TXbs8OJBAtvQHDVWpkRfVWaDqaeXtDruvpySgBuY.png",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 28,
    "sold": 133,
    "stock": 2,
    "product_variants": [],
    "details": "যারা একাধারে মিউজিক লাভার এবং গেমার, তাদের জন্য চার্জিংয়ের টেনশন দূর করতে চলে এলো আসল গেমিং বিস্ট FRB N-26 Wireless Neckband (FRB 600h)। অবিশ্বাস্য ৬০...",
    "description": "যারা একাধারে মিউজিক লাভার এবং গেমার, তাদের জন্য চার্জিংয়ের টেনশন দূর করতে চলে এলো আসল গেমিং বিস্ট FRB N-26 Wireless Neckband (FRB 600h)। অবিশ্বাস্য ৬০...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "91",
    "name": "Lightning to Type-C Converter – 2-in-1 Dual Function Audio & Charging Adapter with Mic Support & Portable Keychain Design",
    "slug": "lightning-to-type-c-converter-2-in-1-dual-function-audio-cha-91",
    "product_code": "3091",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/39WHEOhGtnuzh14TRgQG1SsWTp1nMdrblQukn1lC.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/39WHEOhGtnuzh14TRgQG1SsWTp1nMdrblQukn1lC.png",
      "https://mohasagor.com.bd/public/storage/images/products/PquEbE0vuLPVavnLDMEGjJug7mKZpk6mJmZcYC8a.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/39WHEOhGtnuzh14TRgQG1SsWTp1nMdrblQukn1lC.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/PquEbE0vuLPVavnLDMEGjJug7mKZpk6mJmZcYC8a.png",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 150,
    "originalPrice": 203,
    "regular_price": 203,
    "rating": 4.8,
    "reviews": 31,
    "sold": 136,
    "stock": 2,
    "product_variants": [],
    "details": "আধুনিক আইফোনে আলাদা হেডফোন জ্যাক না থাকার কারণে একসাথে চার্জিং এবং গান শোনার ক্ষেত্রে যে ঝামেলা পোহাতে হয়, তার সুনির্দিষ্ট ও সহজ সমাধান হলো Lightning ...",
    "description": "আধুনিক আইফোনে আলাদা হেডফোন জ্যাক না থাকার কারণে একসাথে চার্জিং এবং গান শোনার ক্ষেত্রে যে ঝামেলা পোহাতে হয়, তার সুনির্দিষ্ট ও সহজ সমাধান হলো Lightning ...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "95",
    "name": "CYXG Q1 True Wireless Stereo Earbuds – TWS with Super Deep Bass, ENC Noise Cancelling Mic, Smart Touch Control & Lightweight Comfort Fit",
    "slug": "cyxg-q1-true-wireless-stereo-earbuds-tws-with-super-deep-bas-95",
    "product_code": "3095",
    "category": "Gadgets & Electronics",
    "image": "https://mohasagor.com.bd/public/storage/images/products/838zHWP9B6bZG0O6IFqoRSVHXJhEBiN34CyZpZUw.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/838zHWP9B6bZG0O6IFqoRSVHXJhEBiN34CyZpZUw.png",
      "https://mohasagor.com.bd/public/storage/images/products/kIs7qGNuGdSPDzUAZUkIOVl0dp6IPkbJ9t0BOHzs.png",
      "https://mohasagor.com.bd/public/storage/images/products/jFKQuXjvpUBVJ8YRt1uANgQFgyv4qwqipNjYD0Ny.png",
      "https://mohasagor.com.bd/public/storage/images/products/w23wKA3ZeH3EXs4p9xQarGTlzL0HMSG5iXRQkAkG.png",
      "https://mohasagor.com.bd/public/storage/images/products/ozDOZXXyvOEW6H7sPsmF3xKzS2M8RL7mWPXALTd8.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/838zHWP9B6bZG0O6IFqoRSVHXJhEBiN34CyZpZUw.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/kIs7qGNuGdSPDzUAZUkIOVl0dp6IPkbJ9t0BOHzs.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/jFKQuXjvpUBVJ8YRt1uANgQFgyv4qwqipNjYD0Ny.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/w23wKA3ZeH3EXs4p9xQarGTlzL0HMSG5iXRQkAkG.png",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ozDOZXXyvOEW6H7sPsmF3xKzS2M8RL7mWPXALTd8.png",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 890,
    "originalPrice": 1202,
    "regular_price": 1202,
    "rating": 4.8,
    "reviews": 35,
    "sold": 140,
    "stock": 50,
    "product_variants": [],
    "details": "শক্তিশালী বেস, ক্রিস্টাল-ক্লিয়ার কলিং এবং চমৎকার কমফোর্টের এক দারুণ সংমিশ্রণ হলো CYXG Q1 True Wireless Stereo (TWS) Earbuds। দৈনন্দিন গান শোনা, বিনোদন...",
    "description": "শক্তিশালী বেস, ক্রিস্টাল-ক্লিয়ার কলিং এবং চমৎকার কমফোর্টের এক দারুণ সংমিশ্রণ হলো CYXG Q1 True Wireless Stereo (TWS) Earbuds। দৈনন্দিন গান শোনা, বিনোদন...",
    "category_slug": "gadgets-electronics",
    "categorySlug": "gadgets-electronics"
  },
  {
    "id": "98",
    "name": "Luminous Embrace  Brilliant Center Stone with Twisted Band Womens Ring",
    "slug": "luminous-embrace-brilliant-center-stone-with-twisted-band-wo-98",
    "product_code": "3098",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/YsXeUsao8ZslpqUYzT8mGbdMyBtpxKMR5PHLNYdl.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/YsXeUsao8ZslpqUYzT8mGbdMyBtpxKMR5PHLNYdl.png",
      "https://mohasagor.com.bd/public/storage/images/products/so1e9dTMbhEOmhygsZQLME1hQwWIrsYXbSXdNvpl.png",
      "https://mohasagor.com.bd/public/storage/images/products/Hi6Tlws2Q37rbPNGcKI63bGnPxHUcq2PcsWbXS69.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/YsXeUsao8ZslpqUYzT8mGbdMyBtpxKMR5PHLNYdl.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/so1e9dTMbhEOmhygsZQLME1hQwWIrsYXbSXdNvpl.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Hi6Tlws2Q37rbPNGcKI63bGnPxHUcq2PcsWbXS69.png",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 250,
    "originalPrice": 338,
    "regular_price": 338,
    "rating": 4.8,
    "reviews": 38,
    "sold": 143,
    "stock": 10,
    "product_variants": [
      {
        "id": "21327",
        "attribute": "Color",
        "variant": "White",
        "price": 0,
        "stock": 50
      },
      {
        "id": "21328",
        "attribute": "Color",
        "variant": "Golden",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Description:Nestled in a vibrant pink presentation box with a plush black interior, this exquisite ring features a brilliant, round-cut center stone h...",
    "description": "Description:Nestled in a vibrant pink presentation box with a plush black interior, this exquisite ring features a brilliant, round-cut center stone h...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "148",
    "name": "vibrant gold ring adorned with colorful gemstones",
    "slug": "vibrant-gold-ring-adorned-with-colorful-gemstones-148",
    "product_code": "3148",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/XNPJ5IUNon0YNVNYAhw3XcNRnJiyQXYMOA53jl4m.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/XNPJ5IUNon0YNVNYAhw3XcNRnJiyQXYMOA53jl4m.png",
      "https://mohasagor.com.bd/public/storage/images/products/O1EvGYkoIfg58yxWw3ycOb0TLwE0iZgQMjlGHoEX.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/crldMjVbAoqcvzkgZZAQahKHQ0EwDqNTvAOydyqy.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/4ZsuY9vk3b3n1EZGqH9ik4BcNDOYvTKMf9UCSybb.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Ovl66a82CtIZBwnopkZHAkFBUfzW7UYSf7Pskrhc.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/E04ljhINmMzGNnKyrL8pGYSnjOaFBqVssj7z1oJa.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/XNPJ5IUNon0YNVNYAhw3XcNRnJiyQXYMOA53jl4m.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/O1EvGYkoIfg58yxWw3ycOb0TLwE0iZgQMjlGHoEX.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/crldMjVbAoqcvzkgZZAQahKHQ0EwDqNTvAOydyqy.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/4ZsuY9vk3b3n1EZGqH9ik4BcNDOYvTKMf9UCSybb.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Ovl66a82CtIZBwnopkZHAkFBUfzW7UYSf7Pskrhc.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/E04ljhINmMzGNnKyrL8pGYSnjOaFBqVssj7z1oJa.jpg",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 300,
    "originalPrice": 405,
    "regular_price": 405,
    "rating": 4.8,
    "reviews": 38,
    "sold": 73,
    "stock": 9,
    "product_variants": [],
    "details": "🌈✨ দেখুন তো, এই মিষ্টি সোনার আংটিটা! একটা ছোট্ট রংধনুর মতো, তাই না? 🤩 উজ্জ্বল গোলাপী রঙের একটা সুন্দর বাক্সে রাখা, কালো মখমলের নরম বিছানায় যেন তার আ...",
    "description": "🌈✨ দেখুন তো, এই মিষ্টি সোনার আংটিটা! একটা ছোট্ট রংধনুর মতো, তাই না? 🤩 উজ্জ্বল গোলাপী রঙের একটা সুন্দর বাক্সে রাখা, কালো মখমলের নরম বিছানায় যেন তার আ...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "149",
    "name": "vibrant gold ring adorned with colorful gemstones,",
    "slug": "vibrant-gold-ring-adorned-with-colorful-gemstones-149",
    "product_code": "3149",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/G0MDTRMDj3gVh14uPIFFBV48Z4Wmu8x7MqNq6iM8.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/G0MDTRMDj3gVh14uPIFFBV48Z4Wmu8x7MqNq6iM8.png",
      "https://mohasagor.com.bd/public/storage/images/products/3PKUf1Ohy1H5mLJGNTY8cWCBaDXI2Cr92OzKEOaa.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/yJh9aMZCw14gaSoeI6W93z7WrPWWVZ9zBgWrIPvv.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/IRuNOQWOLU7G8InXvrk7O3Ui0p7oRqxbVV69RgcT.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/jxfkVaGP2ijz8tU3YBeeUjiu4tO8JThS2r5NnyGu.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/G0MDTRMDj3gVh14uPIFFBV48Z4Wmu8x7MqNq6iM8.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/3PKUf1Ohy1H5mLJGNTY8cWCBaDXI2Cr92OzKEOaa.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/yJh9aMZCw14gaSoeI6W93z7WrPWWVZ9zBgWrIPvv.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/IRuNOQWOLU7G8InXvrk7O3Ui0p7oRqxbVV69RgcT.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/jxfkVaGP2ijz8tU3YBeeUjiu4tO8JThS2r5NnyGu.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 300,
    "originalPrice": 405,
    "regular_price": 405,
    "rating": 4.8,
    "reviews": 39,
    "sold": 74,
    "stock": 8,
    "product_variants": [],
    "details": "🌈✨ দেখুন তো, এই মিষ্টি সোনার আংটিটা! একটা ছোট্ট রংধনুর মতো, তাই না? 🤩 উজ্জ্বল গোলাপী রঙের একটা সুন্দর বাক্সে রাখা, কালো মখমলের নরম বিছানায় যেন তার আ...",
    "description": "🌈✨ দেখুন তো, এই মিষ্টি সোনার আংটিটা! একটা ছোট্ট রংধনুর মতো, তাই না? 🤩 উজ্জ্বল গোলাপী রঙের একটা সুন্দর বাক্সে রাখা, কালো মখমলের নরম বিছানায় যেন তার আ...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "150",
    "name": "vibrant gold ring adorned with colorful gemstones.",
    "slug": "vibrant-gold-ring-adorned-with-colorful-gemstones-150",
    "product_code": "3150",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Axev8h9BsQTMVI6XNTOvWTNegMdUYrQIiP6Z4qXV.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Axev8h9BsQTMVI6XNTOvWTNegMdUYrQIiP6Z4qXV.png",
      "https://mohasagor.com.bd/public/storage/images/products/mwTqj4OiXTrHGHWSAuOYHyhLMSj2iAWv3TaHpw53.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/LS3VeQF4gP4QIurYltjCkw1UOh3BOQJ2Y56J2Otw.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/MDybjzY05Li4ZUD5ursbCCFMIyoOKrux9fTaJTbU.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/tWIJ3zpbeQcsCsNLOtuQd5GQwTsbqeRl1qJBhJKB.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Axev8h9BsQTMVI6XNTOvWTNegMdUYrQIiP6Z4qXV.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/mwTqj4OiXTrHGHWSAuOYHyhLMSj2iAWv3TaHpw53.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/LS3VeQF4gP4QIurYltjCkw1UOh3BOQJ2Y56J2Otw.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/MDybjzY05Li4ZUD5ursbCCFMIyoOKrux9fTaJTbU.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/tWIJ3zpbeQcsCsNLOtuQd5GQwTsbqeRl1qJBhJKB.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 300,
    "originalPrice": 405,
    "regular_price": 405,
    "rating": 4.8,
    "reviews": 15,
    "sold": 75,
    "stock": 7,
    "product_variants": [],
    "details": "🌈✨ দেখুন তো, এই মিষ্টি সোনার আংটিটা! একটা ছোট্ট রংধনুর মতো, তাই না? 🤩 উজ্জ্বল গোলাপী রঙের একটা সুন্দর বাক্সে রাখা, কালো মখমলের নরম বিছানায় যেন তার আ...",
    "description": "🌈✨ দেখুন তো, এই মিষ্টি সোনার আংটিটা! একটা ছোট্ট রংধনুর মতো, তাই না? 🤩 উজ্জ্বল গোলাপী রঙের একটা সুন্দর বাক্সে রাখা, কালো মখমলের নরম বিছানায় যেন তার আ...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "151",
    "name": "Double Rows Diamond Rings for Womens",
    "slug": "double-rows-diamond-rings-for-womens-151",
    "product_code": "3151",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/3LqKXN4Vc7WfOxQtVAo6jT97M9djpvF8UwUuVh6u.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/3LqKXN4Vc7WfOxQtVAo6jT97M9djpvF8UwUuVh6u.png",
      "https://mohasagor.com.bd/public/storage/images/products/djNsAJkJGd4G3hMn8NX2N0Mk26plSGZjbK01Hfxd.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/RRmUzFJMVe9X47NsspOSF9wDRDPSk94POsosmuEB.png",
      "https://mohasagor.com.bd/public/storage/images/products/waVrw4ysomN1XCOdo7NdigI8h9ukpZtUww7Soz41.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/3LqKXN4Vc7WfOxQtVAo6jT97M9djpvF8UwUuVh6u.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/djNsAJkJGd4G3hMn8NX2N0Mk26plSGZjbK01Hfxd.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/RRmUzFJMVe9X47NsspOSF9wDRDPSk94POsosmuEB.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/waVrw4ysomN1XCOdo7NdigI8h9ukpZtUww7Soz41.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 400,
    "originalPrice": 540,
    "regular_price": 540,
    "rating": 4.8,
    "reviews": 16,
    "sold": 76,
    "stock": 21,
    "product_variants": [],
    "details": "&nbsp;অবশ্যই!💎✨ এই সুন্দর আংটিটি যেন এক স্বপ্ন! ✨💍 ছবিতে দেখতে পাচ্ছি, একটি উজ্জ্বল ধাতুর তৈরি আংটি,&nbsp;&nbsp;যা একগুচ্ছ ছোট ছোট পাথর দিয়ে খচিত। প...",
    "description": "&nbsp;অবশ্যই!💎✨ এই সুন্দর আংটিটি যেন এক স্বপ্ন! ✨💍 ছবিতে দেখতে পাচ্ছি, একটি উজ্জ্বল ধাতুর তৈরি আংটি,&nbsp;&nbsp;যা একগুচ্ছ ছোট ছোট পাথর দিয়ে খচিত। প...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "175",
    "name": "Chowtushkoni Dyuti Women's Ring",
    "slug": "chowtushkoni-dyuti-womens-ring-175",
    "product_code": "3175",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/1NueF81R2bctHiZjWT9heNVMhkvTVyZMAHXDdVAy.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/1NueF81R2bctHiZjWT9heNVMhkvTVyZMAHXDdVAy.png",
      "https://mohasagor.com.bd/public/storage/images/products/wVJ9iirDmyFkLEaDgcI2nk8UnpSv85kK2swcMmts.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/4JI5FR2XPoeOSkYJOoTanfSd9Rk471Lfdc3aBeVs.png",
      "https://mohasagor.com.bd/public/storage/images/products/bKo3ZlDlfvfN4PMVzEbctUJLnNwLzpE5fMQhfSeh.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/1NueF81R2bctHiZjWT9heNVMhkvTVyZMAHXDdVAy.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/wVJ9iirDmyFkLEaDgcI2nk8UnpSv85kK2swcMmts.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/4JI5FR2XPoeOSkYJOoTanfSd9Rk471Lfdc3aBeVs.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bKo3ZlDlfvfN4PMVzEbctUJLnNwLzpE5fMQhfSeh.webp",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 300,
    "originalPrice": 405,
    "regular_price": 405,
    "rating": 4.8,
    "reviews": 15,
    "sold": 100,
    "stock": 11,
    "product_variants": [],
    "details": "অবশ্যই! 💙✨ ছবিতে একটি সুন্দর পান্না কাট-এর নীলকান্তমণি আংটি দেখা যাচ্ছে, যা এক মনোরম পরিবেশে পরিধান করা হয়েছে। 💍🌿&nbsp;উজ্জ্বল নীল রঙের পাথরটি যেন ...",
    "description": "অবশ্যই! 💙✨ ছবিতে একটি সুন্দর পান্না কাট-এর নীলকান্তমণি আংটি দেখা যাচ্ছে, যা এক মনোরম পরিবেশে পরিধান করা হয়েছে। 💍🌿&nbsp;উজ্জ্বল নীল রঙের পাথরটি যেন ...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "177",
    "name": "Diamond Dyuti Women's Ring",
    "slug": "one-stone-diamond-nose-pin-6cn-3177",
    "product_code": "3177",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/JZEGxI9xqgXPUlrq1xrQh8xWHoL5chQhezf3GFIH.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/JZEGxI9xqgXPUlrq1xrQh8xWHoL5chQhezf3GFIH.png",
      "https://mohasagor.com.bd/public/storage/images/products/EfC6PIRBSOCNcQaodFQNjp4CrMZuoDPJ43o48nuk.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/rNQekwUhmBHn4HsGlwihRGJLicQayjKoIBAyut0x.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/JZEGxI9xqgXPUlrq1xrQh8xWHoL5chQhezf3GFIH.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/EfC6PIRBSOCNcQaodFQNjp4CrMZuoDPJ43o48nuk.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/rNQekwUhmBHn4HsGlwihRGJLicQayjKoIBAyut0x.png",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 300,
    "originalPrice": 405,
    "regular_price": 405,
    "rating": 4.8,
    "reviews": 17,
    "sold": 102,
    "stock": 10,
    "product_variants": [],
    "details": "ছয় প্রং সেটিং পাথরটিকে খুব securely ধরে রেখেছে এবং এর সৌন্দর্যকে আরও ভালোভাবে প্রদর্শন করছে। 💎👆&nbsp;প্রতিটি প্রং পাথরটির চারপাশ থেকে আলো প্রবেশ করত...",
    "description": "ছয় প্রং সেটিং পাথরটিকে খুব securely ধরে রেখেছে এবং এর সৌন্দর্যকে আরও ভালোভাবে প্রদর্শন করছে। 💎👆&nbsp;প্রতিটি প্রং পাথরটির চারপাশ থেকে আলো প্রবেশ করত...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "269",
    "name": "প্রিমিয়াম টু-পিস এমব্রয়ডারি কটি সেট",
    "slug": "three-piece-for-women-3-pice-dress-3269",
    "product_code": "3269",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/stgJt2fU1VbO9t74XX8gWBe0ntCjPctQieUMnPGE.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/stgJt2fU1VbO9t74XX8gWBe0ntCjPctQieUMnPGE.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/stgJt2fU1VbO9t74XX8gWBe0ntCjPctQieUMnPGE.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 2490,
    "originalPrice": 3362,
    "regular_price": 3362,
    "rating": 4.8,
    "reviews": 34,
    "sold": 74,
    "stock": 50,
    "product_variants": [
      {
        "id": "32710",
        "attribute": "Size",
        "variant": "50",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32711",
        "attribute": "Size",
        "variant": "52",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32712",
        "attribute": "Size",
        "variant": "54",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32713",
        "attribute": "Size",
        "variant": "56",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "👗এটি একটি অসম্ভব সুন্দর এমব্রয়ডারি করা এটাস্ট ইনার সহ কটি বোরকা&nbsp;🎀 এই বোরকা সম্পর্কে অন্য যেকোনো কিছু জানতে চাইলে নির্দ্বিধায় জিজ্ঞেস করুন।&nbsp...",
    "description": "👗এটি একটি অসম্ভব সুন্দর এমব্রয়ডারি করা এটাস্ট ইনার সহ কটি বোরকা&nbsp;🎀 এই বোরকা সম্পর্কে অন্য যেকোনো কিছু জানতে চাইলে নির্দ্বিধায় জিজ্ঞেস করুন।&nbsp...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "336",
    "name": "Premium quality Fashionable Classic Design Imitation Gold Polish 5 Stone  Nose Pin For Women",
    "slug": "three-piece-for-women-3-pice-dress-3336",
    "product_code": "3336",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Jw7jToU0IsX6rI78ol0gbtgwQCWDNpfczQzLSmyj.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Jw7jToU0IsX6rI78ol0gbtgwQCWDNpfczQzLSmyj.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Z1nAPbt90Cz0OTCfxBRomhqcaJkeYpo1fJsZPOEe.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/LjNwryj2HW5Tye7dRWkdvEZEXoMlaA1FmY6RYHOx.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Jw7jToU0IsX6rI78ol0gbtgwQCWDNpfczQzLSmyj.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Z1nAPbt90Cz0OTCfxBRomhqcaJkeYpo1fJsZPOEe.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/LjNwryj2HW5Tye7dRWkdvEZEXoMlaA1FmY6RYHOx.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 600,
    "originalPrice": 810,
    "regular_price": 810,
    "rating": 4.8,
    "reviews": 26,
    "sold": 141,
    "stock": 23,
    "product_variants": [],
    "details": "Premium quality Fashionable Classic Design Imiration Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ৩মিমি, ৪মিমি (সব...",
    "description": "Premium quality Fashionable Classic Design Imiration Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ৩মিমি, ৪মিমি (সব...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "337",
    "name": "Premium quality Fashionable Classic Design Follower  Shape Imieation Gold Polish Nose Pin For Women",
    "slug": "three-piece-for-women-3-pice-dress-3337",
    "product_code": "3337",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/7WGJ7AC106gb6eFSihsKnBSzFcaoj8poHgerrH4H.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/7WGJ7AC106gb6eFSihsKnBSzFcaoj8poHgerrH4H.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/qddTLybpjnQv0hZDRiRDhlTcCJ42X0DW1gsHShXM.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/BM5CleGlN35142voWpw2uXxMHVKEbGonDUQ0YRRW.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/xUaIYabSWUKXvOzjsfVd943f5GOcdc3wGwZKHZpB.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/7WGJ7AC106gb6eFSihsKnBSzFcaoj8poHgerrH4H.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/qddTLybpjnQv0hZDRiRDhlTcCJ42X0DW1gsHShXM.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/BM5CleGlN35142voWpw2uXxMHVKEbGonDUQ0YRRW.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/xUaIYabSWUKXvOzjsfVd943f5GOcdc3wGwZKHZpB.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 650,
    "originalPrice": 878,
    "regular_price": 878,
    "rating": 4.8,
    "reviews": 27,
    "sold": 142,
    "stock": 5,
    "product_variants": [],
    "details": "Premium quality Fashionable Classic Design Imiration Follower shape &nbsp;Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;স...",
    "description": "Premium quality Fashionable Classic Design Imiration Follower shape &nbsp;Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;স...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "338",
    "name": "Traditional Gold Seven Stone Mossanite  Nose Pin -7 Mm (With gift box)",
    "slug": "traditional-gold-seven-stone-mossanite-nose-pin--7-mm-with-g-338",
    "product_code": "3338",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Z2GNU6wZPjQjKf2GGMBQo3yoHw7o4FJUjtpTqgry.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Z2GNU6wZPjQjKf2GGMBQo3yoHw7o4FJUjtpTqgry.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/FQA1AoDvQD3iAbv5EDzWx12AA8AvdX4TuPTXpWTi.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/hileskBK1RpvFJxNLu1sw12X2TgBD87MflqdQCoJ.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/BgwPVARN0xAYvRbBd4z1pXxjoccWbNM4WzKeK4Zq.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Z2GNU6wZPjQjKf2GGMBQo3yoHw7o4FJUjtpTqgry.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/FQA1AoDvQD3iAbv5EDzWx12AA8AvdX4TuPTXpWTi.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/hileskBK1RpvFJxNLu1sw12X2TgBD87MflqdQCoJ.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/BgwPVARN0xAYvRbBd4z1pXxjoccWbNM4WzKeK4Zq.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 650,
    "originalPrice": 878,
    "regular_price": 878,
    "rating": 4.8,
    "reviews": 28,
    "sold": 143,
    "stock": 5,
    "product_variants": [],
    "details": "Premium quality Fashionable Classic Design Imiration Follower shape &nbsp;Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;স...",
    "description": "Premium quality Fashionable Classic Design Imiration Follower shape &nbsp;Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;স...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "341",
    "name": "Traditional Gold SevenStone Mossanite  Nose Pin -7 Mm (With gift box)",
    "slug": "traditional-gold-sevenstone-mossanite-nose-pin--7-mm-with-gi-341",
    "product_code": "3341",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/kPhhy72iqIp7RCFRYl9saBKdNSPFZjZbuPjsQC4Z.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/kPhhy72iqIp7RCFRYl9saBKdNSPFZjZbuPjsQC4Z.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/BcvtHce3GV0xtSVPp8anwH22ltiyR5mTsLQZre8H.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/DrHCbUycgqeFgJMh85FAlPWQur5SDB1Z9MwWkrEz.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/kPhhy72iqIp7RCFRYl9saBKdNSPFZjZbuPjsQC4Z.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/BcvtHce3GV0xtSVPp8anwH22ltiyR5mTsLQZre8H.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/DrHCbUycgqeFgJMh85FAlPWQur5SDB1Z9MwWkrEz.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 31,
    "sold": 146,
    "stock": 4,
    "product_variants": [],
    "details": "Premium quality Fashionable Classic Design Imiration Follower shape &nbsp;Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;স...",
    "description": "Premium quality Fashionable Classic Design Imiration Follower shape &nbsp;Gold Polish Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;স...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "343",
    "name": "tiny crystal triangle earrings | black Nose pin",
    "slug": "tiny-crystal-triangle-earrings-black-nose-pin-343",
    "product_code": "3343",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/FXhIJXlMRzQUF8B0YUCFIvySLb9e36S2jbdDKRtm.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/FXhIJXlMRzQUF8B0YUCFIvySLb9e36S2jbdDKRtm.png",
      "https://mohasagor.com.bd/public/storage/images/products/cpdlgdK0TBBo4LPSvhuZDDZQiPBm3IwoQxhFNCvS.png",
      "https://mohasagor.com.bd/public/storage/images/products/4cS9XrQC8o8Y2kegLKc7IJL0BJDyGCeoui3pxGww.png",
      "https://mohasagor.com.bd/public/storage/images/products/uYZeBeH0O117HTOXLLYTm0d5QcKVhIfjEHE7gOqE.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/FXhIJXlMRzQUF8B0YUCFIvySLb9e36S2jbdDKRtm.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/cpdlgdK0TBBo4LPSvhuZDDZQiPBm3IwoQxhFNCvS.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/4cS9XrQC8o8Y2kegLKc7IJL0BJDyGCeoui3pxGww.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/uYZeBeH0O117HTOXLLYTm0d5QcKVhIfjEHE7gOqE.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 520,
    "originalPrice": 702,
    "regular_price": 702,
    "rating": 4.8,
    "reviews": 33,
    "sold": 148,
    "stock": 12,
    "product_variants": [],
    "details": "tiny crystal triangle earrings | black &nbsp;Nose Pin For Women&nbsp;&nbsp;&nbsp;Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ...",
    "description": "tiny crystal triangle earrings | black &nbsp;Nose Pin For Women&nbsp;&nbsp;&nbsp;Nose Pin For Womenরং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "346",
    "name": "tiny crystal triangle earrings |",
    "slug": "tiny-crystal-triangle-earrings-346",
    "product_code": "3346",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/ZgVdm3KauW9jYqO0z7d5gArnvh0xU5W1Ke89JKwv.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/ZgVdm3KauW9jYqO0z7d5gArnvh0xU5W1Ke89JKwv.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/9vFQPTN8LdUj15BkN0vWyspHBfRG5FSQnJhUmtAj.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/I0dPfBhvlxkd3qiIinxHDkPVetLz3xKzpKzwV7YI.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ZgVdm3KauW9jYqO0z7d5gArnvh0xU5W1Ke89JKwv.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/9vFQPTN8LdUj15BkN0vWyspHBfRG5FSQnJhUmtAj.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/I0dPfBhvlxkd3qiIinxHDkPVetLz3xKzpKzwV7YI.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 490,
    "originalPrice": 662,
    "regular_price": 662,
    "rating": 4.8,
    "reviews": 36,
    "sold": 151,
    "stock": 12,
    "product_variants": [],
    "details": "tiny crystal triangle earrings |&nbsp;রং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ৩মিমি, ৪মিমি (সবার জন্য সহজে মানানসই)।)&nbsp;স্থায়িত্ব: সাধার...",
    "description": "tiny crystal triangle earrings |&nbsp;রং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ৩মিমি, ৪মিমি (সবার জন্য সহজে মানানসই)।)&nbsp;স্থায়িত্ব: সাধার...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "373",
    "name": "tiny crystal Chowtuskoni Nose pin  For Women",
    "slug": "tiny-crystal-chowtuskoni-nose-pin-for-women-373",
    "product_code": "3373",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/VstUzSle1MEk0lhSBnYL26fadjRipRJKhTTrBOHR.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/VstUzSle1MEk0lhSBnYL26fadjRipRJKhTTrBOHR.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/nZHSD5MetiUPhE3w78e8FEdIuENAl9c6EjdqqHGg.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/fMD1V3pTQ4A86ze45imy1bmJkYPux9Wxuvw09ijV.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Bi03Aqyl4vw1iypJAPcdMliqnnhtvGMeHrmrSwDj.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/VstUzSle1MEk0lhSBnYL26fadjRipRJKhTTrBOHR.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/nZHSD5MetiUPhE3w78e8FEdIuENAl9c6EjdqqHGg.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/fMD1V3pTQ4A86ze45imy1bmJkYPux9Wxuvw09ijV.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Bi03Aqyl4vw1iypJAPcdMliqnnhtvGMeHrmrSwDj.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 38,
    "sold": 58,
    "stock": 9,
    "product_variants": [],
    "details": "tiny crystal Chowtuskoni Nose pin &nbsp;For Women&nbsp;রং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ৩মিমি, ৪মিমি (সবার জন্য সহজে মানানসই)।)&nbsp...",
    "description": "tiny crystal Chowtuskoni Nose pin &nbsp;For Women&nbsp;রং: গোল্ড কালার (সোনালী রঙ), সাদা পাথর।&nbsp;সাইজ: ৩মিমি, ৪মিমি (সবার জন্য সহজে মানানসই)।)&nbsp...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "375",
    "name": "tiny crystal Circel Nose pin For Women ( Sigle pcs)",
    "slug": "tiny-crystal-circel-nose-pin-for-women-sigle-pcs-375",
    "product_code": "3375",
    "category": "Women's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/yQTyMplrOidUMJ8DJpsTi33To1MojSlbKxrPu7sh.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/yQTyMplrOidUMJ8DJpsTi33To1MojSlbKxrPu7sh.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/OchIV0qPuy25WZX1I3KiYR0CPgacp0GIxr9WymEb.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/kZ2WxYrQo9xWrwDDzWbey4CL7t7HKVLc4GlP7kTX.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/WLX3HsxHeUNwzqzCP4264HZppoDwvnxMj21YwMkx.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/yQTyMplrOidUMJ8DJpsTi33To1MojSlbKxrPu7sh.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/OchIV0qPuy25WZX1I3KiYR0CPgacp0GIxr9WymEb.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/kZ2WxYrQo9xWrwDDzWbey4CL7t7HKVLc4GlP7kTX.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/WLX3HsxHeUNwzqzCP4264HZppoDwvnxMj21YwMkx.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 499,
    "originalPrice": 674,
    "regular_price": 674,
    "rating": 4.8,
    "reviews": 15,
    "sold": 60,
    "stock": 12,
    "product_variants": [],
    "details": "The quality of our products is intact as our products are made by reputable manufacturers and imported from reputable sources.Stone: Gemstone Homologo...",
    "description": "The quality of our products is intact as our products are made by reputable manufacturers and imported from reputable sources.Stone: Gemstone Homologo...",
    "category_slug": "womens-fashion",
    "categorySlug": "womens-fashion"
  },
  {
    "id": "35",
    "name": "Men's Gabardine Pant (Black Color)",
    "slug": "mens-gabardine-pant-black-color-3035",
    "product_code": "3035",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/K51TYNWv1zy4KmlKKwXSlZAWKWef6ELqEP1qer18.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/K51TYNWv1zy4KmlKKwXSlZAWKWef6ELqEP1qer18.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/hfyk2BPEWrlf2yjllrFYksItDFwdJRDlygCMxKUr.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/QEedmtng8jCL4DgdZdHjCo41Dz4NoedlWpuO8nJ4.png",
      "https://mohasagor.com.bd/public/storage/images/products/gkFF89obxfcDCkPSwMOHf7rlQhH6yT5ofGuPMlcp.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/y4WNTJqbah5c88FZR1OmlTGQYExUr4etEOSPfvjB.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/RRHMg7WIjM3jK715ZwnjKzxFZ0RWQGKGqQFz9Ril.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/AS0T2H1P2R1uqK14E16jwBFZAnevXaQXVeYpqtsw.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/K51TYNWv1zy4KmlKKwXSlZAWKWef6ELqEP1qer18.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/hfyk2BPEWrlf2yjllrFYksItDFwdJRDlygCMxKUr.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/QEedmtng8jCL4DgdZdHjCo41Dz4NoedlWpuO8nJ4.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/gkFF89obxfcDCkPSwMOHf7rlQhH6yT5ofGuPMlcp.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/y4WNTJqbah5c88FZR1OmlTGQYExUr4etEOSPfvjB.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/RRHMg7WIjM3jK715ZwnjKzxFZ0RWQGKGqQFz9Ril.jpg",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/AS0T2H1P2R1uqK14E16jwBFZAnevXaQXVeYpqtsw.jpg",
        "is_primary": false,
        "sort_order": 6
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 25,
    "sold": 80,
    "stock": 4,
    "product_variants": [
      {
        "id": "15868",
        "attribute": "Size",
        "variant": "28",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15869",
        "attribute": "Size",
        "variant": "30",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15870",
        "attribute": "Size",
        "variant": "32",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15871",
        "attribute": "Size",
        "variant": "34",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15872",
        "attribute": "Size",
        "variant": "36",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's Gabardine PantMain Material: TwillStretch: StretchableWash &amp; Care: Machine WashWaist: Mid-riseQuality: 98% Cotton 2% SpandexButtery smooth c...",
    "description": "Men's Gabardine PantMain Material: TwillStretch: StretchableWash &amp; Care: Machine WashWaist: Mid-riseQuality: 98% Cotton 2% SpandexButtery smooth c...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "36",
    "name": "Men's Gabardine Pant (Navy Color)",
    "slug": "mens-gabardine-pant-navy-color-3036",
    "product_code": "3036",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/pXeM9GSVqwlLtXGKS6ar52fINBgVZNwnDbJ26b0p.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/pXeM9GSVqwlLtXGKS6ar52fINBgVZNwnDbJ26b0p.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/W0gimGeQtvO3lsztt694TRPEzxBZR32W6Cuc1k02.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/G56zndg3SDIHYAAE1v6kTaHKbbVgKACC8LbSwhJA.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/RSGWVNfZ8CUP4cob1jnlBR4QkD7o7a8EsdfQtC3u.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/rNnteTsXMWG4pykds3ZAH9jznf3BnNW2USjV27zG.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/WSX3oxjIZYbifGyrr1ueIHGNZFpi68DiTLBQlqOB.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/ZULHFBrwifDUsC4bL9OyT0HjFq77mBfBagQDANTh.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pXeM9GSVqwlLtXGKS6ar52fINBgVZNwnDbJ26b0p.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/W0gimGeQtvO3lsztt694TRPEzxBZR32W6Cuc1k02.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/G56zndg3SDIHYAAE1v6kTaHKbbVgKACC8LbSwhJA.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/RSGWVNfZ8CUP4cob1jnlBR4QkD7o7a8EsdfQtC3u.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/rNnteTsXMWG4pykds3ZAH9jznf3BnNW2USjV27zG.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/WSX3oxjIZYbifGyrr1ueIHGNZFpi68DiTLBQlqOB.jpg",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ZULHFBrwifDUsC4bL9OyT0HjFq77mBfBagQDANTh.jpg",
        "is_primary": false,
        "sort_order": 6
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 26,
    "sold": 81,
    "stock": 10,
    "product_variants": [
      {
        "id": "15873",
        "attribute": "Size",
        "variant": "28",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15874",
        "attribute": "Size",
        "variant": "30",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15875",
        "attribute": "Size",
        "variant": "32",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15876",
        "attribute": "Size",
        "variant": "34",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15877",
        "attribute": "Size",
        "variant": "36",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's Gabardine PantMain Material: TwillStretch: StretchableWash &amp; Care: Machine WashWaist: Mid-riseQuality: 98% Cotton 2% SpandexButtery smooth c...",
    "description": "Men's Gabardine PantMain Material: TwillStretch: StretchableWash &amp; Care: Machine WashWaist: Mid-riseQuality: 98% Cotton 2% SpandexButtery smooth c...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "39",
    "name": "Casual Men's Sweatpant Trouser Black + Red",
    "slug": "casual-mens-sweatpant-trouser-black-red-3039",
    "product_code": "3039",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/SMso1qHQ5pgUItWQoIAj7JKGWAGlvw1oeemBuRyz.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/SMso1qHQ5pgUItWQoIAj7JKGWAGlvw1oeemBuRyz.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/SMso1qHQ5pgUItWQoIAj7JKGWAGlvw1oeemBuRyz.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 390,
    "originalPrice": 527,
    "regular_price": 527,
    "rating": 4.8,
    "reviews": 29,
    "sold": 84,
    "stock": 71,
    "product_variants": [
      {
        "id": "14291",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "14292",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "14293",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "14294",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "14295",
        "attribute": "Size",
        "variant": "S",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "\"নতুন স্টাইলে আরামদায়ক ক্যাজুয়াল মেনস্‌ সুইটপ্যান্ট - যা আপনাকে দিবে স্টাইল ও কমফোর্ট একসাথে!\"আপনার প্রতিদিনের স্টাইল এবং আরামের সঙ্গী হতে আসছে ক্যা...",
    "description": "\"নতুন স্টাইলে আরামদায়ক ক্যাজুয়াল মেনস্‌ সুইটপ্যান্ট - যা আপনাকে দিবে স্টাইল ও কমফোর্ট একসাথে!\"আপনার প্রতিদিনের স্টাইল এবং আরামের সঙ্গী হতে আসছে ক্যা...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "41",
    "name": "Men's Gabardine Pant (Ash Color)",
    "slug": "mens-gabardine-pant-ash-color-3041",
    "product_code": "3041",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/585Dsq7WYvxgItsVtdRTu4v5htZZnJtzZewMplVP.webp",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/585Dsq7WYvxgItsVtdRTu4v5htZZnJtzZewMplVP.webp",
      "https://mohasagor.com.bd/public/storage/images/products/X2Ikmy4268sEAaRK9zenWiXhBtpoHb9QDyPlLxzB.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/zcAHBST5XwfFEqhhDk5WF0DUkuqomRkxMqVdxJfW.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/585Dsq7WYvxgItsVtdRTu4v5htZZnJtzZewMplVP.webp",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/X2Ikmy4268sEAaRK9zenWiXhBtpoHb9QDyPlLxzB.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/zcAHBST5XwfFEqhhDk5WF0DUkuqomRkxMqVdxJfW.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 31,
    "sold": 86,
    "stock": 4,
    "product_variants": [
      {
        "id": "15878",
        "attribute": "Size",
        "variant": "28",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15879",
        "attribute": "Size",
        "variant": "30",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15880",
        "attribute": "Size",
        "variant": "32",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15881",
        "attribute": "Size",
        "variant": "34",
        "price": 0,
        "stock": 50
      },
      {
        "id": "15882",
        "attribute": "Size",
        "variant": "36",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's Gabardine PantMain Material: TwillStretch: StretchableWash &amp; Care: Machine WashWaist: Mid-riseQuality: 98% Cotton 2% SpandexButtery smooth c...",
    "description": "Men's Gabardine PantMain Material: TwillStretch: StretchableWash &amp; Care: Machine WashWaist: Mid-riseQuality: 98% Cotton 2% SpandexButtery smooth c...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "64",
    "name": "Men's Cotton Katua(Paste)",
    "slug": "mens-cotton-katuapaste-3064",
    "product_code": "3064",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/POHCnr8h5y2xcNxEk4q342OMXee6qMLvvFkpmJxa.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/POHCnr8h5y2xcNxEk4q342OMXee6qMLvvFkpmJxa.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/v63G9mUtzTSnGadpRIpBtHeKtxjp9gJjPx3tsypV.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/nHSWE0Fhci1BHqQio1MfD7aVDg6whCFpg2zDIx2b.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/POHCnr8h5y2xcNxEk4q342OMXee6qMLvvFkpmJxa.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/v63G9mUtzTSnGadpRIpBtHeKtxjp9gJjPx3tsypV.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/nHSWE0Fhci1BHqQio1MfD7aVDg6whCFpg2zDIx2b.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 490,
    "originalPrice": 662,
    "regular_price": 662,
    "rating": 4.8,
    "reviews": 29,
    "sold": 109,
    "stock": 35,
    "product_variants": [
      {
        "id": "31033",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "31034",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "31035",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's Cotton KatuaFabrics: CottonSoft &amp; ComfortablesSize: M, L, XL, XXLMeasurements:M=Chest-40, Length-27L=Chest-42, Length-28XL=Chest-44, Length-...",
    "description": "Men's Cotton KatuaFabrics: CottonSoft &amp; ComfortablesSize: M, L, XL, XXLMeasurements:M=Chest-40, Length-27L=Chest-42, Length-28XL=Chest-44, Length-...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "105",
    "name": "Men's Solid Colour Ban color Shirt  (Light Maroon)",
    "slug": "mens-solid-colour-ban-color-shirt-light-maroon-105",
    "product_code": "3105",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/AnpVv784cOShcz9K3cL4h5kQyryfqpzKK0tosi8Q.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/AnpVv784cOShcz9K3cL4h5kQyryfqpzKK0tosi8Q.png",
      "https://mohasagor.com.bd/public/storage/images/products/A9A3Y5jyamz1XxdcsQCo0awB2ytKRcp9pMAQesb3.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/AnpVv784cOShcz9K3cL4h5kQyryfqpzKK0tosi8Q.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/A9A3Y5jyamz1XxdcsQCo0awB2ytKRcp9pMAQesb3.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 20,
    "sold": 150,
    "stock": 4,
    "product_variants": [
      {
        "id": "3497",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3498",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3499",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3500",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "106",
    "name": "Men's Solid Colour Ban color Shirt  (green)",
    "slug": "mens-solid-colour-ban-color-shirt-green-3106",
    "product_code": "3106",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/h5wnjckkyw7lNIbRq4o43s5bHPAKVAxxe61jMMfb.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/h5wnjckkyw7lNIbRq4o43s5bHPAKVAxxe61jMMfb.png",
      "https://mohasagor.com.bd/public/storage/images/products/fqR4P74DDi0MsKVz69qF8pCVezKMmbtcFcs4jlir.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/h5wnjckkyw7lNIbRq4o43s5bHPAKVAxxe61jMMfb.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/fqR4P74DDi0MsKVz69qF8pCVezKMmbtcFcs4jlir.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 21,
    "sold": 151,
    "stock": 1,
    "product_variants": [
      {
        "id": "24748",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "24749",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "24750",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "107",
    "name": "Men's Solid Colour Ban color Shirt  (olive)",
    "slug": "mens-solid-colour-ban-color-shirt-olive-3107",
    "product_code": "3107",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/mbRvwRdPkIJt7dGAvt5quidCXG9XHnEfltNm594w.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/mbRvwRdPkIJt7dGAvt5quidCXG9XHnEfltNm594w.png",
      "https://mohasagor.com.bd/public/storage/images/products/h3LBFmT0L6zCSO5UgqhPLdlceXbRb5Fp23Le40Cp.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/mbRvwRdPkIJt7dGAvt5quidCXG9XHnEfltNm594w.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/h3LBFmT0L6zCSO5UgqhPLdlceXbRb5Fp23Le40Cp.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 22,
    "sold": 152,
    "stock": 4,
    "product_variants": [
      {
        "id": "3006",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3007",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3008",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3009",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "108",
    "name": "Men's Solid Colour Ban color Shirt  (paste)",
    "slug": "mens-solid-colour-ban-color-shirt-paste-3108",
    "product_code": "3108",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/mgiwhl1BwLXSNkjjGmle1UBdV68gFeTAM89wbC7j.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/mgiwhl1BwLXSNkjjGmle1UBdV68gFeTAM89wbC7j.png",
      "https://mohasagor.com.bd/public/storage/images/products/ELqG3O9XKy9S9ZmACfKRl08wODaZJXMe93LQ9D27.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/mgiwhl1BwLXSNkjjGmle1UBdV68gFeTAM89wbC7j.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ELqG3O9XKy9S9ZmACfKRl08wODaZJXMe93LQ9D27.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 23,
    "sold": 153,
    "stock": 3,
    "product_variants": [
      {
        "id": "2994",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "2995",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "2996",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "2997",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "109",
    "name": "Men's Solid Colour Ban color Shirt  (sky)",
    "slug": "mens-solid-colour-ban-color-shirt-sky-3109",
    "product_code": "3109",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/RLum9rZfx0CIo3Bik23kspBgpjHa6bXl2K01TKNr.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/RLum9rZfx0CIo3Bik23kspBgpjHa6bXl2K01TKNr.png",
      "https://mohasagor.com.bd/public/storage/images/products/7eICVSTKfkavDtdhjyuZJrTy4AKwsKGb32c8JBv1.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/RLum9rZfx0CIo3Bik23kspBgpjHa6bXl2K01TKNr.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/7eICVSTKfkavDtdhjyuZJrTy4AKwsKGb32c8JBv1.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 24,
    "sold": 154,
    "stock": 2,
    "product_variants": [
      {
        "id": "3485",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3486",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3487",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "3488",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "110",
    "name": "Men's Solid Colour Ban color Shirt  (white)",
    "slug": "mens-solid-colour-ban-color-shirt-white-3110",
    "product_code": "3110",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/spcnvhsacb2CRjXlOOWDFg62XZZupDPNVItD3TmK.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/spcnvhsacb2CRjXlOOWDFg62XZZupDPNVItD3TmK.png",
      "https://mohasagor.com.bd/public/storage/images/products/FUcKQTF8tLwZ5gAa0e2NceXLnCoW2mUGMt3Te0tr.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/spcnvhsacb2CRjXlOOWDFg62XZZupDPNVItD3TmK.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/FUcKQTF8tLwZ5gAa0e2NceXLnCoW2mUGMt3Te0tr.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 25,
    "sold": 155,
    "stock": 4,
    "product_variants": [
      {
        "id": "2978",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "2979",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "2980",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "2981",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "111",
    "name": "Men's Solid Colour Ban color Shirt  (Black)",
    "slug": "mens-solid-colour-ban-color-shirt-black-3111",
    "product_code": "3111",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/0X9Q6ikUNWvAxeCGh0EPQ8LrGHc1sn2S8VlTMtAu.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/0X9Q6ikUNWvAxeCGh0EPQ8LrGHc1sn2S8VlTMtAu.png",
      "https://mohasagor.com.bd/public/storage/images/products/hWk0lN3i4NNnA3QponScMMRVc8w0iMzbNXp5iDcZ.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/0X9Q6ikUNWvAxeCGh0EPQ8LrGHc1sn2S8VlTMtAu.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/hWk0lN3i4NNnA3QponScMMRVc8w0iMzbNXp5iDcZ.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 26,
    "sold": 156,
    "stock": 7,
    "product_variants": [
      {
        "id": "11663",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11664",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11665",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11666",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "112",
    "name": "Men's Solid Colour Ban color Shirt  (purple)",
    "slug": "mens-solid-colour-ban-color-shirt-purple-3112",
    "product_code": "3112",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/UnbeWO88PiX9HzHLMWpUMNX8VPB1siiYEoYvwbIJ.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/UnbeWO88PiX9HzHLMWpUMNX8VPB1siiYEoYvwbIJ.png",
      "https://mohasagor.com.bd/public/storage/images/products/iSLgEncPPBhT4SXtAUD8EE4V5MFbd3eM8K2sgA68.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/UnbeWO88PiX9HzHLMWpUMNX8VPB1siiYEoYvwbIJ.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/iSLgEncPPBhT4SXtAUD8EE4V5MFbd3eM8K2sgA68.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 27,
    "sold": 157,
    "stock": 50,
    "product_variants": [
      {
        "id": "5934",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "5935",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "5936",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "description": "*👕 Men’s Solid Colour Ban Collar Shirt: স্টাইল ও আরামের মিশ্রণ! 👕*&nbsp;আপনার পোশাকের শৈলীকে নতুন মাত্রায় তুলে ধরতে চাইলে, আমাদের *Men’s Solid Colou...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "113",
    "name": "Men's Solid Colour Cotton Shirt (Sky)",
    "slug": "mens-solid-colour-cotton-shirt-sky-3113",
    "product_code": "3113",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/RmEOsZkvm8OaS2zNauASfCySEQHTm41vjhonTpZg.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/RmEOsZkvm8OaS2zNauASfCySEQHTm41vjhonTpZg.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/RmEOsZkvm8OaS2zNauASfCySEQHTm41vjhonTpZg.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 28,
    "sold": 158,
    "stock": 50,
    "product_variants": [
      {
        "id": "490",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "491",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "492",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Fashionable casual shirt for menFabrics : Oxford cottonSize Measurement :M = length &nbsp; 28\", chest 39\"L= length &nbsp; 29\", chest 41\"XL= length &nb...",
    "description": "Fashionable casual shirt for menFabrics : Oxford cottonSize Measurement :M = length &nbsp; 28\", chest 39\"L= length &nbsp; 29\", chest 41\"XL= length &nb...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "114",
    "name": "Men's Solid Colour Color Shirt (Deep pink)",
    "slug": "mens-solid-colour-color-shirt-deep-pink-3114",
    "product_code": "3114",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/xosf8OrnMjxtoguwG9EwCbexYvoiMVNDgukVr6Ic.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/xosf8OrnMjxtoguwG9EwCbexYvoiMVNDgukVr6Ic.png",
      "https://mohasagor.com.bd/public/storage/images/products/6827Z8mjmIbqKiBn9AuuFaysYSeeEtH2dSYYvr7y.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/xosf8OrnMjxtoguwG9EwCbexYvoiMVNDgukVr6Ic.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/6827Z8mjmIbqKiBn9AuuFaysYSeeEtH2dSYYvr7y.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 550,
    "originalPrice": 743,
    "regular_price": 743,
    "rating": 4.8,
    "reviews": 29,
    "sold": 159,
    "stock": 3,
    "product_variants": [
      {
        "id": "18125",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "18126",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Fashionable casual shirt for menFabrics : Oxford cottonSize Measurement :M = length &nbsp; 28\", chest 39\"L= length &nbsp; 29\", chest 41\"XL= length &nb...",
    "description": "Fashionable casual shirt for menFabrics : Oxford cottonSize Measurement :M = length &nbsp; 28\", chest 39\"L= length &nbsp; 29\", chest 41\"XL= length &nb...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "115",
    "name": "Men's Solid Colour Cotton Shirt (purple)",
    "slug": "mens-solid-colour-cotton-shirt-purple-3115",
    "product_code": "3115",
    "category": "Men's Fashion",
    "image": "https://mohasagor.com.bd/public/storage/images/products/P44YWhKubDnCu9WSWmDPlhHKxPx1udfFGOaycKZn.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/P44YWhKubDnCu9WSWmDPlhHKxPx1udfFGOaycKZn.png",
      "https://mohasagor.com.bd/public/storage/images/products/UvKhSHiMRxIG41KP5UX0MKSKZLTIFlC1RfI90tH8.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/P44YWhKubDnCu9WSWmDPlhHKxPx1udfFGOaycKZn.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/UvKhSHiMRxIG41KP5UX0MKSKZLTIFlC1RfI90tH8.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 30,
    "sold": 160,
    "stock": 2,
    "product_variants": [
      {
        "id": "24746",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "24747",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Fashionable casual shirt for menFabrics : Oxford cottonSize Measurement :M = length &nbsp; 28\", chest 39\"L= length &nbsp; 29\", chest 41\"XL= length &nb...",
    "description": "Fashionable casual shirt for menFabrics : Oxford cottonSize Measurement :M = length &nbsp; 28\", chest 39\"L= length &nbsp; 29\", chest 41\"XL= length &nb...",
    "category_slug": "mens-fashion",
    "categorySlug": "mens-fashion"
  },
  {
    "id": "16",
    "name": "Apache Luminous (Batmen Edition)",
    "slug": "apache-luminous-batmen-edition-16",
    "product_code": "3016",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/PdEfSErWKhtCdOdd2Q2GcLmBzrlIGTlX3rKDoKof.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/PdEfSErWKhtCdOdd2Q2GcLmBzrlIGTlX3rKDoKof.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/PdEfSErWKhtCdOdd2Q2GcLmBzrlIGTlX3rKDoKof.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 31,
    "sold": 61,
    "stock": 1,
    "product_variants": [
      {
        "id": "32452",
        "attribute": "Color",
        "variant": "black",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "আপনার স্টাইল ও ব্যক্তিত্বকে আরও এক ধাপ এগিয়ে নিতে নিয়ে এলাম অত্যাধুনিক ডিজাইনের &nbsp;Apache &nbsp;ঘড়ি। স্কেলেটন ডায়াল, উন্নত মেকানিক্যাল মুভমেন্ট...",
    "description": "আপনার স্টাইল ও ব্যক্তিত্বকে আরও এক ধাপ এগিয়ে নিতে নিয়ে এলাম অত্যাধুনিক ডিজাইনের &nbsp;Apache &nbsp;ঘড়ি। স্কেলেটন ডায়াল, উন্নত মেকানিক্যাল মুভমেন্ট...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "68",
    "name": "SWS Hi-Tech Ceramic Cartidge Water Purifier",
    "slug": "sws-hi-tech-ceramic-cartidge-water-purifier-68",
    "product_code": "3068",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/WYUnHFJjlOnP9YYsWsOLMgeWewG9WaYDIUEJ6jzk.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/WYUnHFJjlOnP9YYsWsOLMgeWewG9WaYDIUEJ6jzk.png",
      "https://mohasagor.com.bd/public/storage/images/products/SPGJIngPUUx0hNgL9RHmir0n35iyTwAzvAe1leNz.webp",
      "https://mohasagor.com.bd/public/storage/images/products/wdgPBa4lX2VuCrbW09sKHGpsaJo7WptB03P1PUwJ.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/WYUnHFJjlOnP9YYsWsOLMgeWewG9WaYDIUEJ6jzk.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/SPGJIngPUUx0hNgL9RHmir0n35iyTwAzvAe1leNz.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/wdgPBa4lX2VuCrbW09sKHGpsaJo7WptB03P1PUwJ.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 33,
    "sold": 113,
    "stock": 1,
    "product_variants": [],
    "details": "💦 এইটা একটা ওয়াটার পিউরিফায়ার! 💧 আপনার রান্নাঘরের কলের সাথে সহজেই লাগিয়ে নিন আর পান করুন একদম পরিষ্কার জল। 😋 নোংরা জল আর নয়, এই পিউরিফায়ার দেবে আপন...",
    "description": "💦 এইটা একটা ওয়াটার পিউরিফায়ার! 💧 আপনার রান্নাঘরের কলের সাথে সহজেই লাগিয়ে নিন আর পান করুন একদম পরিষ্কার জল। 😋 নোংরা জল আর নয়, এই পিউরিফায়ার দেবে আপন...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "71",
    "name": "Creative Silicone Folding Water Cup – 600ml Portable & Scalable Leak-Proof Travel Bottle with Lid & Handle for Sports, Gym, Office & School (Multi-Color)",
    "slug": "creative-silicone-folding-water-cup-600ml-portable-71",
    "product_code": "3071",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/i6GE7SeEv96oOWvdezV4IoxWgT2SUd4Syzk6PhwY.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/i6GE7SeEv96oOWvdezV4IoxWgT2SUd4Syzk6PhwY.png",
      "https://mohasagor.com.bd/public/storage/images/products/QKZc381ipPvmCm00KNUbNXimvjPlHVykTY8pRlv3.webp",
      "https://mohasagor.com.bd/public/storage/images/products/RVCLvKs3n86Rjmp9jopcISGx2OPu43s6dWMeEdEc.webp",
      "https://mohasagor.com.bd/public/storage/images/products/ScKNBCQqmpbK3uyZm0vrQkasEQfQgjt9TmDo6uzo.webp",
      "https://mohasagor.com.bd/public/storage/images/products/6Vrxt0uQqxzYuuD7Z6HqBmfMxLAw8ukn8NNgwD1a.webp",
      "https://mohasagor.com.bd/public/storage/images/products/AmTHUHiNUgV5bRxH6iJwhc8pW62LZAqwxsqJxTWk.webp",
      "https://mohasagor.com.bd/public/storage/images/products/SmUOUEiY9t4geRMB9lYfD9ZiVv8ItMNf1DOG22h6.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/i6GE7SeEv96oOWvdezV4IoxWgT2SUd4Syzk6PhwY.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/QKZc381ipPvmCm00KNUbNXimvjPlHVykTY8pRlv3.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/RVCLvKs3n86Rjmp9jopcISGx2OPu43s6dWMeEdEc.webp",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ScKNBCQqmpbK3uyZm0vrQkasEQfQgjt9TmDo6uzo.webp",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/6Vrxt0uQqxzYuuD7Z6HqBmfMxLAw8ukn8NNgwD1a.webp",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/AmTHUHiNUgV5bRxH6iJwhc8pW62LZAqwxsqJxTWk.webp",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/SmUOUEiY9t4geRMB9lYfD9ZiVv8ItMNf1DOG22h6.webp",
        "is_primary": false,
        "sort_order": 6
      }
    ],
    "price": 800,
    "originalPrice": 1080,
    "regular_price": 1080,
    "rating": 4.8,
    "reviews": 36,
    "sold": 116,
    "stock": 50,
    "product_variants": [],
    "details": "যারা সবসময় বাইরে বা ট্রাভেলে থাকেন, তাদের হাইড্রেটেড থাকার অভ্যাসকে আরও সহজ ও ঝঞ্ঝাটমুক্ত করতে নিয়ে এলাম আধুনিক ও ক্রিয়েটিভ Silicone Folding Water Cu...",
    "description": "যারা সবসময় বাইরে বা ট্রাভেলে থাকেন, তাদের হাইড্রেটেড থাকার অভ্যাসকে আরও সহজ ও ঝঞ্ঝাটমুক্ত করতে নিয়ে এলাম আধুনিক ও ক্রিয়েটিভ Silicone Folding Water Cu...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "73",
    "name": "Adjustable Power Exercise Gripper Strengthener Hand Grip with Counter 5kg to 60kg Presser 1 pc",
    "slug": "adjustable-power-exercise-gripper-strengthener-hand-grip-wit-73",
    "product_code": "3073",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/iZN2WstREjkxhAU9PMEkJU1iVMk98wa6theV7vSd.webp",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/iZN2WstREjkxhAU9PMEkJU1iVMk98wa6theV7vSd.webp",
      "https://mohasagor.com.bd/public/storage/images/products/pxZepVgFAq0kaoccQ3JUMW1v4F3KZxigp3Ea76ez.webp",
      "https://mohasagor.com.bd/public/storage/images/products/UYTdQitqe5hFpGGyhDVVMtkVgiClIRcDNKmbWPXD.webp",
      "https://mohasagor.com.bd/public/storage/images/products/xf8gzAjGNkFvmDgcFMl1aAu99iuZ28JQAUBcmEQK.webp",
      "https://mohasagor.com.bd/public/storage/images/products/Zv0hgYA13vi96wTdaoZXLg0KWmKHeTwlpOuoAWHC.webp",
      "https://mohasagor.com.bd/public/storage/images/products/tEAoO30GQkFDY5kDwpUzBpcfmg6tteXVSDGNtVHW.webp",
      "https://mohasagor.com.bd/public/storage/images/products/7unLQNKurBbSgGWQVopzBty1H5Cxjub9ifOpvCMQ.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/iZN2WstREjkxhAU9PMEkJU1iVMk98wa6theV7vSd.webp",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pxZepVgFAq0kaoccQ3JUMW1v4F3KZxigp3Ea76ez.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/UYTdQitqe5hFpGGyhDVVMtkVgiClIRcDNKmbWPXD.webp",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/xf8gzAjGNkFvmDgcFMl1aAu99iuZ28JQAUBcmEQK.webp",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Zv0hgYA13vi96wTdaoZXLg0KWmKHeTwlpOuoAWHC.webp",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/tEAoO30GQkFDY5kDwpUzBpcfmg6tteXVSDGNtVHW.webp",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/7unLQNKurBbSgGWQVopzBty1H5Cxjub9ifOpvCMQ.webp",
        "is_primary": false,
        "sort_order": 6
      }
    ],
    "price": 250,
    "originalPrice": 338,
    "regular_price": 338,
    "rating": 4.8,
    "reviews": 38,
    "sold": 118,
    "stock": 18,
    "product_variants": [],
    "details": "Adjustable Power Exercise Gripper Strengthener – ৫ কেজি থেকে ৬০ কেজি, কাউন্টারসহপণ্যের সারসংক্ষেপএই উন্নত মানের হ্যান্ড গ্রিপ এক্সারসাইজারটি ডিজাইন কর...",
    "description": "Adjustable Power Exercise Gripper Strengthener – ৫ কেজি থেকে ৬০ কেজি, কাউন্টারসহপণ্যের সারসংক্ষেপএই উন্নত মানের হ্যান্ড গ্রিপ এক্সারসাইজারটি ডিজাইন কর...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "86",
    "name": "Cartoon Fashion Hair Dryer for Children/Students/Dormitories/Travel Portable Foldable 2-speed Home Hair Dryer",
    "slug": "cartoon-fashion-hair-dryer-for-childrenstudentsdormitoriestr-86",
    "product_code": "3086",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/LjlsiMvdR4RIO3xFKr0CutWlEsIdltgGY3Fjz3wO.webp",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/LjlsiMvdR4RIO3xFKr0CutWlEsIdltgGY3Fjz3wO.webp",
      "https://mohasagor.com.bd/public/storage/images/products/Co4x7V8glAgzN7V4ombnugZCs2fUOeNiqZ1To2m2.webp",
      "https://mohasagor.com.bd/public/storage/images/products/ffdADO7uXY4Jryv4gnziHUFMAxnMwf1xSChRBgIx.webp",
      "https://mohasagor.com.bd/public/storage/images/products/y8uNl1BOzWtO0BqUYaGn6IxhCKxVefJ3BrXPbNHu.webp",
      "https://mohasagor.com.bd/public/storage/images/products/Wk0IgnPpM08AnvWTPUbs2ZFuxRlYxLvSAT1t4hq8.webp",
      "https://mohasagor.com.bd/public/storage/images/products/JVYqiBkIdZL8LpU18H8AjNa43BIDAj7g4kpRYe4Z.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/LjlsiMvdR4RIO3xFKr0CutWlEsIdltgGY3Fjz3wO.webp",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Co4x7V8glAgzN7V4ombnugZCs2fUOeNiqZ1To2m2.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ffdADO7uXY4Jryv4gnziHUFMAxnMwf1xSChRBgIx.webp",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/y8uNl1BOzWtO0BqUYaGn6IxhCKxVefJ3BrXPbNHu.webp",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Wk0IgnPpM08AnvWTPUbs2ZFuxRlYxLvSAT1t4hq8.webp",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/JVYqiBkIdZL8LpU18H8AjNa43BIDAj7g4kpRYe4Z.webp",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 650,
    "originalPrice": 878,
    "regular_price": 878,
    "rating": 4.8,
    "reviews": 26,
    "sold": 131,
    "stock": 2,
    "product_variants": [],
    "details": "Product details of 2024 Cartoon Fashion Hair Dryer for Children/Students/Dormitories/Travel Portable Foldable 2-speed Home Hair Dryer2024 Cartoon Fash...",
    "description": "Product details of 2024 Cartoon Fashion Hair Dryer for Children/Students/Dormitories/Travel Portable Foldable 2-speed Home Hair Dryer2024 Cartoon Fash...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "90",
    "name": "540 Micro Needle Derma Roller Therapy Skin ( 0.50mm)",
    "slug": "540-micro-needle-derma-roller-therapy-skin-050mm-90",
    "product_code": "3090",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/AUQntfaddww9VUK6IdCF3zWMt0y9bI8iG3OlPISY.webp",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/AUQntfaddww9VUK6IdCF3zWMt0y9bI8iG3OlPISY.webp",
      "https://mohasagor.com.bd/public/storage/images/products/tuaItFYH8bzBo10TG4CxxApCwC814MYJ0w6wPKZS.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/AUQntfaddww9VUK6IdCF3zWMt0y9bI8iG3OlPISY.webp",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/tuaItFYH8bzBo10TG4CxxApCwC814MYJ0w6wPKZS.webp",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 250,
    "originalPrice": 338,
    "regular_price": 338,
    "rating": 4.8,
    "reviews": 30,
    "sold": 135,
    "stock": 2,
    "product_variants": [],
    "details": "Product details of 540 Micro Needle Derma Roller Therapy Skin ( 0.05mm)Lightweight and easy to handleHigh sealing sterilization packagingSkin maintena...",
    "description": "Product details of 540 Micro Needle Derma Roller Therapy Skin ( 0.05mm)Lightweight and easy to handleHigh sealing sterilization packagingSkin maintena...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "93",
    "name": "Best Win Premium Luxury Watch For Men's",
    "slug": "best-win-premium-luxury-watch-for-mens-93",
    "product_code": "3093",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/llFH5Ld9ttuRwSCETMNz5wezUowNPRePrNglGoLM.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/llFH5Ld9ttuRwSCETMNz5wezUowNPRePrNglGoLM.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/llFH5Ld9ttuRwSCETMNz5wezUowNPRePrNglGoLM.png",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 1090,
    "originalPrice": 1472,
    "regular_price": 1472,
    "rating": 4.8,
    "reviews": 33,
    "sold": 138,
    "stock": 1,
    "product_variants": [],
    "details": "Best Win Premium Luxury Watch For Men's&nbsp;মুল বৈশিষ্ট্যঃডায়ালের ভেতরে তিনটি ছোট ছোট সচল সাব-ডায়াল রয়েছে, যা মূলত ঘড়িটিকে একটি স্পোর্টি ও প্রিমিয়াম ...",
    "description": "Best Win Premium Luxury Watch For Men's&nbsp;মুল বৈশিষ্ট্যঃডায়ালের ভেতরে তিনটি ছোট ছোট সচল সাব-ডায়াল রয়েছে, যা মূলত ঘড়িটিকে একটি স্পোর্টি ও প্রিমিয়াম ...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "94",
    "name": "Premium Black Hammered Finish Kitchen Cleaver (Knife)",
    "slug": "premium-black-hammered-finish-kitchen-cleaver-knife-94",
    "product_code": "3094",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/ml2SaRJCHZAywbYhzlIDPTkoYY39W7Q0h4gKM4Jw.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/ml2SaRJCHZAywbYhzlIDPTkoYY39W7Q0h4gKM4Jw.png",
      "https://mohasagor.com.bd/public/storage/images/products/ee6DqKVjHhYju4kszy3lyYOyXOfn7fINfUuFi982.png",
      "https://mohasagor.com.bd/public/storage/images/products/svhTdMLexSUoGYu9WhdWh7Dm0zuNCj9PSgaZ4peW.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ml2SaRJCHZAywbYhzlIDPTkoYY39W7Q0h4gKM4Jw.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ee6DqKVjHhYju4kszy3lyYOyXOfn7fINfUuFi982.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/svhTdMLexSUoGYu9WhdWh7Dm0zuNCj9PSgaZ4peW.png",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 34,
    "sold": 139,
    "stock": 9,
    "product_variants": [],
    "details": "Premium Black Hammered Finish Kitchen Cleaver (Knife)&nbsp;প্রধান বৈশিষ্ট্যসমূহ:ব্লেড ম্যাটেরিয়াল: উচ্চমানের স্টেইনলেস স্টিল দিয়ে তৈরি, যা দীর্ঘস্থায়ী...",
    "description": "Premium Black Hammered Finish Kitchen Cleaver (Knife)&nbsp;প্রধান বৈশিষ্ট্যসমূহ:ব্লেড ম্যাটেরিয়াল: উচ্চমানের স্টেইনলেস স্টিল দিয়ে তৈরি, যা দীর্ঘস্থায়ী...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "166",
    "name": "Intelligent Electric Rechargeable Vegetable Cutter & Mini Chopper – 250ml Wireless One-Touch Food Processor for Garlic, Ginger, Onion & Meat",
    "slug": "intelligent-electric-rechargeable-vegetable-cutter-mini-chop-166",
    "product_code": "3166",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/MnCCLTyxT66DmC8IjSG98f3drPRbytjrDjQ7t87C.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/MnCCLTyxT66DmC8IjSG98f3drPRbytjrDjQ7t87C.png",
      "https://mohasagor.com.bd/public/storage/images/products/0aGdiWqhPpLL6Nr4ohblu9kEVCpvUqNdk6pb4mF2.png",
      "https://mohasagor.com.bd/public/storage/images/products/VImWq2NHUtWgHAcRbVoI5KVpxw2oyWk4Cy16nPnk.png",
      "https://mohasagor.com.bd/public/storage/images/products/hE2SALw4Lie2jTLRgEGivV1rsnxVQ6TZGQnv1LSs.png",
      "https://mohasagor.com.bd/public/storage/images/products/Ms7FtfO4mxsrQkoQFI0OqB0qaDRo01s5QPEk6kO7.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/MnCCLTyxT66DmC8IjSG98f3drPRbytjrDjQ7t87C.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/0aGdiWqhPpLL6Nr4ohblu9kEVCpvUqNdk6pb4mF2.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/VImWq2NHUtWgHAcRbVoI5KVpxw2oyWk4Cy16nPnk.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/hE2SALw4Lie2jTLRgEGivV1rsnxVQ6TZGQnv1LSs.png",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Ms7FtfO4mxsrQkoQFI0OqB0qaDRo01s5QPEk6kO7.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 31,
    "sold": 91,
    "stock": 50,
    "product_variants": [],
    "details": "রান্নাঘরের ছোটখাটো কুচিকাটার কাজগুলোকে আরও সহজ, ঝঞ্ঝাটহীন ও আধুনিক করতে নিয়ে এলাম Intelligent Electric Rechargeable Vegetable Cutter। পুরোনো ম্যানুয়াল...",
    "description": "রান্নাঘরের ছোটখাটো কুচিকাটার কাজগুলোকে আরও সহজ, ঝঞ্ঝাটহীন ও আধুনিক করতে নিয়ে এলাম Intelligent Electric Rechargeable Vegetable Cutter। পুরোনো ম্যানুয়াল...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "173",
    "name": "Wild Tornado Powerful Drain Cleaner Powder – Fast-Acting Pipe Dredging Agent for Clogged Kitchen Sinks, Bathrooms, Grease & Hair Removal",
    "slug": "wild-tornado-powerful-drain-cleaner-powder-fast-acting-pipe-173",
    "product_code": "3173",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/HlpDbtV3YGnEfdq32VBuydDeWx3oszwwdjREoXHQ.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/HlpDbtV3YGnEfdq32VBuydDeWx3oszwwdjREoXHQ.png",
      "https://mohasagor.com.bd/public/storage/images/products/K0iWiCe0TMBmvin1yqlU8mFtLKT3uo7HqOZW0VAD.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/jrYx7uS6O8IZx6siMSYciRPerr2wuV2S39qnrOB3.png",
      "https://mohasagor.com.bd/public/storage/images/products/lMCDvrMvl4Ge9EaaSI9bWM3yWbcEwKbSnWQi7FVS.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/8hXF5ona2ZK8kqVManzycMZJu6Kb9IejVAR9eYfF.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/HlpDbtV3YGnEfdq32VBuydDeWx3oszwwdjREoXHQ.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/K0iWiCe0TMBmvin1yqlU8mFtLKT3uo7HqOZW0VAD.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/jrYx7uS6O8IZx6siMSYciRPerr2wuV2S39qnrOB3.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/lMCDvrMvl4Ge9EaaSI9bWM3yWbcEwKbSnWQi7FVS.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/8hXF5ona2ZK8kqVManzycMZJu6Kb9IejVAR9eYfF.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 190,
    "originalPrice": 257,
    "regular_price": 257,
    "rating": 4.8,
    "reviews": 38,
    "sold": 98,
    "stock": 50,
    "product_variants": [],
    "details": "রান্নাঘরের সিঙ্ক, বেসিন বা বাথরুমের ড্রেন জ্যাম হয়ে পানি জমে থাকার বিড়ম্বনা থেকে মুক্তি পেতে নিয়ে এলাম অত্যন্ত কার্যকর Wild Tornado Drain Cleaner পাউড...",
    "description": "রান্নাঘরের সিঙ্ক, বেসিন বা বাথরুমের ড্রেন জ্যাম হয়ে পানি জমে থাকার বিড়ম্বনা থেকে মুক্তি পেতে নিয়ে এলাম অত্যন্ত কার্যকর Wild Tornado Drain Cleaner পাউড...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "182",
    "name": "2 IN 1 Anti Snoring & Air Purifier",
    "slug": "2-in-1-anti-snoring-air-purifier-182",
    "product_code": "3182",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Xd2zjFaH5e9JGVmBfLFQREe7vsa6W3QK23Xt2yXN.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Xd2zjFaH5e9JGVmBfLFQREe7vsa6W3QK23Xt2yXN.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/vPIWS0sNcRkpb8qVcLpwuHFlPlZM00w9kZOCpkFB.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/C4ehTvxPGGQ41125MOAakvSZrwEXsMF0Dw5UNsT4.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Xd2zjFaH5e9JGVmBfLFQREe7vsa6W3QK23Xt2yXN.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/vPIWS0sNcRkpb8qVcLpwuHFlPlZM00w9kZOCpkFB.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/C4ehTvxPGGQ41125MOAakvSZrwEXsMF0Dw5UNsT4.png",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 190,
    "originalPrice": 257,
    "regular_price": 257,
    "rating": 4.8,
    "reviews": 22,
    "sold": 107,
    "stock": 50,
    "product_variants": [],
    "details": "2 IN 1 Anti Snoring &amp; Air Purifierনাক ডাকা কমানো (Anti-Snoring): এটি নাকের ফুটো বা নালীগুলোকে (nasal passages) সামান্য প্রসারিত করে ধরে রাখে। এর ফ...",
    "description": "2 IN 1 Anti Snoring &amp; Air Purifierনাক ডাকা কমানো (Anti-Snoring): এটি নাকের ফুটো বা নালীগুলোকে (nasal passages) সামান্য প্রসারিত করে ধরে রাখে। এর ফ...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "243",
    "name": "Stainless Steel Garlic Press & Mincer – Ergonomic Rocking Garlic Crusher & Squeezer with Rust-Proof Mesh for Fast Kitchen Prep",
    "slug": "stainless-steel-garlic-press-mincer-ergonomic-rocking-garlic-243",
    "product_code": "3243",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Rsl2BsE2HS1Xj7et8KY1YR05aSm5G6gaGS9NrDvs.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Rsl2BsE2HS1Xj7et8KY1YR05aSm5G6gaGS9NrDvs.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/nE3UzU51x9PAiQ2AGxXyf22aulwWXeYMrzYF90qw.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/EuYGBAAyhRi9294iltaVl5mLAuB6Yp2J5zCsTuJ0.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Rsl2BsE2HS1Xj7et8KY1YR05aSm5G6gaGS9NrDvs.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/nE3UzU51x9PAiQ2AGxXyf22aulwWXeYMrzYF90qw.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/EuYGBAAyhRi9294iltaVl5mLAuB6Yp2J5zCsTuJ0.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 250,
    "originalPrice": 338,
    "regular_price": 338,
    "rating": 4.8,
    "reviews": 33,
    "sold": 48,
    "stock": 50,
    "product_variants": [],
    "details": "রান্নাঘরে রসুন কুঁচি বা পেস্ট করার কাজটি অনেক সময় বেশ সময়সাপেক্ষ ও ক্লান্তিকর হয়ে ওঠে। হাতের কব্জিতে অতিরিক্ত চাপ না দিয়ে খুব সহজেই এবং ঝটপট রসুন কুঁচ...",
    "description": "রান্নাঘরে রসুন কুঁচি বা পেস্ট করার কাজটি অনেক সময় বেশ সময়সাপেক্ষ ও ক্লান্তিকর হয়ে ওঠে। হাতের কব্জিতে অতিরিক্ত চাপ না দিয়ে খুব সহজেই এবং ঝটপট রসুন কুঁচ...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "260",
    "name": "Dexe Black Hair Color Pump Dye Shampoo 200 ml. U K",
    "slug": "dexe-black-hair-color-pump-dye-shampoo-200-ml-u-k-3260",
    "product_code": "3260",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/4k7ltkm3ngH3ojvgGgwSFYwjiUcndH3WO5t8GsG0.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/4k7ltkm3ngH3ojvgGgwSFYwjiUcndH3WO5t8GsG0.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/4k7ltkm3ngH3ojvgGgwSFYwjiUcndH3WO5t8GsG0.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 890,
    "originalPrice": 1202,
    "regular_price": 1202,
    "rating": 4.8,
    "reviews": 25,
    "sold": 65,
    "stock": 50,
    "product_variants": [],
    "details": "Dexe Black Hair Color Pump Dye Shampoo 200 ml. U KProduct details of Dexe Black Hair Color Pump Dye Shampoo 200ml..Put on gloves (otherwise, the nails...",
    "description": "Dexe Black Hair Color Pump Dye Shampoo 200 ml. U KProduct details of Dexe Black Hair Color Pump Dye Shampoo 200ml..Put on gloves (otherwise, the nails...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "282",
    "name": "Magnetic Oil Dispensing Massage Comb (with Red Light Therapy)",
    "slug": "magnetic-oil-dispensing-massage-comb-with-red-light-therapy-282",
    "product_code": "3282",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/tkr280XeqM4I2rHmOje5bOof97sY3Xp3l2KCf1T4.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/tkr280XeqM4I2rHmOje5bOof97sY3Xp3l2KCf1T4.png",
      "https://mohasagor.com.bd/public/storage/images/products/y3XTy4v2BHyf6v4lk8WCn3thR0HpJKiinGqHUkAs.png",
      "https://mohasagor.com.bd/public/storage/images/products/M8WumOSvWIWUew8HaSDV2mWNT15JmHgevvypn0OX.png",
      "https://mohasagor.com.bd/public/storage/images/products/ZXlnpPxaiXi650aDzMAZruyAuddg2lOk0z7PBd4n.png",
      "https://mohasagor.com.bd/public/storage/images/products/NjrMe1YLaTQJPtRYF5I7wBkWvaNRbeYV3WFyQp3v.png",
      "https://mohasagor.com.bd/public/storage/images/products/M6kFdTlG0L8PyvLf4rBbBF39IEgv4vkBpIMVmiRo.png",
      "https://mohasagor.com.bd/public/storage/images/products/E9xb0KV1F9lQdDcN9StqanCZNyHRxyubp4SFfHVn.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/tkr280XeqM4I2rHmOje5bOof97sY3Xp3l2KCf1T4.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/y3XTy4v2BHyf6v4lk8WCn3thR0HpJKiinGqHUkAs.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/M8WumOSvWIWUew8HaSDV2mWNT15JmHgevvypn0OX.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ZXlnpPxaiXi650aDzMAZruyAuddg2lOk0z7PBd4n.png",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/NjrMe1YLaTQJPtRYF5I7wBkWvaNRbeYV3WFyQp3v.png",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/M6kFdTlG0L8PyvLf4rBbBF39IEgv4vkBpIMVmiRo.png",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/E9xb0KV1F9lQdDcN9StqanCZNyHRxyubp4SFfHVn.png",
        "is_primary": false,
        "sort_order": 6
      }
    ],
    "price": 1990,
    "originalPrice": 2687,
    "regular_price": 2687,
    "rating": 4.8,
    "reviews": 22,
    "sold": 87,
    "stock": 50,
    "product_variants": [],
    "details": "Magnetic Oil Dispensing Massage Comb (with Red Light Therapy)&nbsp;প্রধান বৈশিষ্ট্যসমূহম্যাগনেটিক অয়েল ডিসপেন্সিং (Magnetic Oil Dispensing): মাথায় তেল...",
    "description": "Magnetic Oil Dispensing Massage Comb (with Red Light Therapy)&nbsp;প্রধান বৈশিষ্ট্যসমূহম্যাগনেটিক অয়েল ডিসপেন্সিং (Magnetic Oil Dispensing): মাথায় তেল...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "288",
    "name": "Olevs Luxury Men’s Quartz Watch (Golden )",
    "slug": "olevs-luxury-mens-quartz-watch-golden-3288",
    "product_code": "3288",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/TUYMnBr3cfYZjzrIJni6t6JSp8uIUmyaByQEXwcy.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/TUYMnBr3cfYZjzrIJni6t6JSp8uIUmyaByQEXwcy.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/ZSBOsDoqXj4POKJVQeptkGgYC9hNcR9gajzWe1ZT.avif",
      "https://mohasagor.com.bd/public/storage/images/products/LxmOJxMUWePK4j6EUL5Am44V6TfgSoE0Tlz8eAmV.avif"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/TUYMnBr3cfYZjzrIJni6t6JSp8uIUmyaByQEXwcy.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ZSBOsDoqXj4POKJVQeptkGgYC9hNcR9gajzWe1ZT.avif",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/LxmOJxMUWePK4j6EUL5Am44V6TfgSoE0Tlz8eAmV.avif",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 790,
    "originalPrice": 1067,
    "regular_price": 1067,
    "rating": 4.8,
    "reviews": 28,
    "sold": 93,
    "stock": 1,
    "product_variants": [],
    "details": "Specification :Brand Name: OLEVSMovement: QuartzCertification: NoneClasp Type: Push Button Hidden ClaspOrigin: CN(Origin)Case Material: AlloyWater Res...",
    "description": "Specification :Brand Name: OLEVSMovement: QuartzCertification: NoneClasp Type: Push Button Hidden ClaspOrigin: CN(Origin)Case Material: AlloyWater Res...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "309",
    "name": "Fashionable Glass Quartz Analog Men's Watch",
    "slug": "fashionable-glass-quartz-analog-mens-watch-3309",
    "product_code": "3309",
    "category": "Home & Lifestyle",
    "image": "https://mohasagor.com.bd/public/storage/images/products/0KmJbnhjFAcpIOF4Qnn6jzDuGnF19y0WURZGibfq.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/0KmJbnhjFAcpIOF4Qnn6jzDuGnF19y0WURZGibfq.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/cw9jJ2NnL7PUK9uRA4el46PusSUfOuNn4k5v9N0c.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/ia0nfCyugAgW5bcbLtUBvhKH6mu7Qjb53Vfyr4uc.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/k8oE0MvwQDNl0dQGYHfEg8c3McfF11MxOKTyI1Bg.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/2yK7fgw49NBScvKi3LPURNRwAU3xkC82FrRIJoLF.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/0KmJbnhjFAcpIOF4Qnn6jzDuGnF19y0WURZGibfq.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/cw9jJ2NnL7PUK9uRA4el46PusSUfOuNn4k5v9N0c.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ia0nfCyugAgW5bcbLtUBvhKH6mu7Qjb53Vfyr4uc.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/k8oE0MvwQDNl0dQGYHfEg8c3McfF11MxOKTyI1Bg.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/2yK7fgw49NBScvKi3LPURNRwAU3xkC82FrRIJoLF.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 24,
    "sold": 114,
    "stock": 50,
    "product_variants": [],
    "details": "আধুনিক স্টাইলের সংজ্ঞা –\"\" *OLEVS 5610 বিলাসবহুল ফ্যাশন কোয়ার্টজ ঘড়ি *\"\"&nbsp;👉আপনি কি এমন একটি ঘড়ি খুঁজছেন যা আপনার ব্যক্তিত্বের সাথে মেলে এবং এক...",
    "description": "আধুনিক স্টাইলের সংজ্ঞা –\"\" *OLEVS 5610 বিলাসবহুল ফ্যাশন কোয়ার্টজ ঘড়ি *\"\"&nbsp;👉আপনি কি এমন একটি ঘড়ি খুঁজছেন যা আপনার ব্যক্তিত্বের সাথে মেলে এবং এক...",
    "category_slug": "home-lifestyle",
    "categorySlug": "home-lifestyle"
  },
  {
    "id": "51",
    "name": "Premium Jersey Set (Brazil)",
    "slug": "premium-jersey-set-brazil-51",
    "product_code": "3051",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/UpG8zJxrUofDm6wzCVE1WUVWvoxz7nNdIiFk8xoK.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/UpG8zJxrUofDm6wzCVE1WUVWvoxz7nNdIiFk8xoK.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/lCvSiF49GPhYrnZyP7X8aAcgIv8XMwP3TNOgsokm.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/pSklLpHfZQnD7HN30QtbCHPbrbB6hbCFYELLz5BR.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/zSzFLlNEewi07Oz299Ix9HrisN9LAGrAfAEl6Cxw.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/UpG8zJxrUofDm6wzCVE1WUVWvoxz7nNdIiFk8xoK.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/lCvSiF49GPhYrnZyP7X8aAcgIv8XMwP3TNOgsokm.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pSklLpHfZQnD7HN30QtbCHPbrbB6hbCFYELLz5BR.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/zSzFLlNEewi07Oz299Ix9HrisN9LAGrAfAEl6Cxw.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 16,
    "sold": 96,
    "stock": 50,
    "product_variants": [
      {
        "id": "32681",
        "attribute": "Size",
        "variant": "2 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32682",
        "attribute": "Size",
        "variant": "4 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32683",
        "attribute": "Size",
        "variant": "6 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32684",
        "attribute": "Size",
        "variant": "8 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32685",
        "attribute": "Size",
        "variant": "10 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32686",
        "attribute": "Size",
        "variant": "12 years",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "প্রিমিয়াম মেস (Mesh) ফেব্রিক: উন্নত মানের মেস কাপড় দিয়ে তৈরি, যা অত্যন্ত আরামদায়ক এবং বাতাস চলাচলে সাহায্য করে। ফলে খেলার সময় ঘাম হলেও শরীর থাকবে ঠান্...",
    "description": "প্রিমিয়াম মেস (Mesh) ফেব্রিক: উন্নত মানের মেস কাপড় দিয়ে তৈরি, যা অত্যন্ত আরামদায়ক এবং বাতাস চলাচলে সাহায্য করে। ফলে খেলার সময় ঘাম হলেও শরীর থাকবে ঠান্...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "82",
    "name": "Premium Jersey Set (Argentina) l",
    "slug": "premium-quality-panjabi-golden-3082",
    "product_code": "3082",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/rYAPdPdjHYyeUWnhdScu3xYflEp1FR9qk0NbXvEH.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/rYAPdPdjHYyeUWnhdScu3xYflEp1FR9qk0NbXvEH.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/cqRzO3yUtwQXx2Is4D643k3PqOa6dUN6RNcmai0Q.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/rYAPdPdjHYyeUWnhdScu3xYflEp1FR9qk0NbXvEH.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/cqRzO3yUtwQXx2Is4D643k3PqOa6dUN6RNcmai0Q.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 22,
    "sold": 127,
    "stock": 9,
    "product_variants": [
      {
        "id": "32675",
        "attribute": "Size",
        "variant": "2 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32676",
        "attribute": "Size",
        "variant": "4 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32677",
        "attribute": "Size",
        "variant": "6 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32678",
        "attribute": "Size",
        "variant": "8 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32679",
        "attribute": "Size",
        "variant": "10 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32680",
        "attribute": "Size",
        "variant": "12 years",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "প্রিমিয়াম মেস (Mesh) ফেব্রিক: উন্নত মানের মেস কাপড় দিয়ে তৈরি, যা অত্যন্ত আরামদায়ক এবং বাতাস চলাচলে সাহায্য করে। ফলে খেলার সময় ঘাম হলেও শরীর থাকবে ঠান্...",
    "description": "প্রিমিয়াম মেস (Mesh) ফেব্রিক: উন্নত মানের মেস কাপড় দিয়ে তৈরি, যা অত্যন্ত আরামদায়ক এবং বাতাস চলাচলে সাহায্য করে। ফলে খেলার সময় ঘাম হলেও শরীর থাকবে ঠান্...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "187",
    "name": "Premium China Children's Raincoat: Keep Your Little Ones Dry & Stylish",
    "slug": "premium-china-childrens-raincoat-keep-your-little-ones-dry-s-187",
    "product_code": "3187",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Jm8SZkfJP8nA2FcaNn4f4HzMtabc00J6sCFGoSTw.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Jm8SZkfJP8nA2FcaNn4f4HzMtabc00J6sCFGoSTw.png",
      "https://mohasagor.com.bd/public/storage/images/products/pQxKPepZVry4akTwhqS5LwGt3Raem7cNRf0IzUMM.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Jm8SZkfJP8nA2FcaNn4f4HzMtabc00J6sCFGoSTw.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pQxKPepZVry4akTwhqS5LwGt3Raem7cNRf0IzUMM.png",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 27,
    "sold": 112,
    "stock": 2,
    "product_variants": [
      {
        "id": "32482",
        "attribute": "Size",
        "variant": "4 - 5 years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32483",
        "attribute": "Size",
        "variant": "6-7 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32484",
        "attribute": "Size",
        "variant": "8 - 9 years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32485",
        "attribute": "Size",
        "variant": "9-11 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32486",
        "attribute": "Size",
        "variant": "11-13 Years",
        "price": 0,
        "stock": 50
      },
      {
        "id": "32487",
        "attribute": "Size",
        "variant": "14-16 Years",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "&nbsp;সোনামণিদের বৃষ্টির দিন হোক আনন্দময় ও সুরক্ষিত! 🌧️👧👦স্কুলে যাওয়ার পথে বা বাইরে বের হলে হঠাৎ বৃষ্টি? এখন আর চিন্তার কিছু নেই! আমরা নিয়ে এলাম \"প...",
    "description": "&nbsp;সোনামণিদের বৃষ্টির দিন হোক আনন্দময় ও সুরক্ষিত! 🌧️👧👦স্কুলে যাওয়ার পথে বা বাইরে বের হলে হঠাৎ বৃষ্টি? এখন আর চিন্তার কিছু নেই! আমরা নিয়ে এলাম \"প...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "379",
    "name": "Flying Robot Astronaut Spacecraft Helicopter Remote Controlled || (Astronauta Voador / Flying Astronaut)",
    "slug": "3d-transparent-helicopter-electronic-music-gear-helicopter-with-led-flash-light-sound-3379",
    "product_code": "3379",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/ETGlTsUD54RcvD4xEbwdOz6DOTEcvnS7OVSUHLgy.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/ETGlTsUD54RcvD4xEbwdOz6DOTEcvnS7OVSUHLgy.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/1pUSFVpo8ak74wc6JPdshitmxgiVIcJ0r2Rl2whi.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/CfFWPQAOhXesqQaz9V5w9Mdx0cvQLrHsmh2M4e8z.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ETGlTsUD54RcvD4xEbwdOz6DOTEcvnS7OVSUHLgy.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/1pUSFVpo8ak74wc6JPdshitmxgiVIcJ0r2Rl2whi.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/CfFWPQAOhXesqQaz9V5w9Mdx0cvQLrHsmh2M4e8z.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 890,
    "originalPrice": 1202,
    "regular_price": 1202,
    "rating": 4.8,
    "reviews": 19,
    "sold": 64,
    "stock": 3,
    "product_variants": [
      {
        "id": "822",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "823",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Flying Robot Astronaut Spacecraft Helicopter Remote Controlled || (Astronauta Voador / Flying Astronaut)এতে হাত বা নিচে কোনো পৃষ্ঠ/অবস্ট্যাকল শনাক্ত ক...",
    "description": "Flying Robot Astronaut Spacecraft Helicopter Remote Controlled || (Astronauta Voador / Flying Astronaut)এতে হাত বা নিচে কোনো পৃষ্ঠ/অবস্ট্যাকল শনাক্ত ক...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "380",
    "name": "Talking Tom Intelligent Touching Cat with Wonderful Voice, Stories and Songs with Touch Functions",
    "slug": "moon-rabbit-toy-for-toddlers-electric-ship-mechanical-battery-operated-car-toy-with-visible-colored-brilliant-led-light-3380",
    "product_code": "3380",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/m81BZJbrk1d13zBt5MyGUxHU4QjLN9gzFjp5nQo5.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/m81BZJbrk1d13zBt5MyGUxHU4QjLN9gzFjp5nQo5.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/AtSR62ANIwTKTOGw9LeCmtKFRxY4kjSVzuMy3YnU.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/SbK2Pw276ECkMkhfh0BxZ3EH2hytyD0QnAntofz4.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/m81BZJbrk1d13zBt5MyGUxHU4QjLN9gzFjp5nQo5.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/AtSR62ANIwTKTOGw9LeCmtKFRxY4kjSVzuMy3YnU.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/SbK2Pw276ECkMkhfh0BxZ3EH2hytyD0QnAntofz4.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 20,
    "sold": 65,
    "stock": 50,
    "product_variants": [],
    "details": "Talking Tom Intelligent Touching Cat with Wonderful Voice, Stories and Songs with Touch Functionsভয়েস কপি ও রিপিট: আপনার বাচ্চা যা-ই বলবে, টম ঠিক সেই ...",
    "description": "Talking Tom Intelligent Touching Cat with Wonderful Voice, Stories and Songs with Touch Functionsভয়েস কপি ও রিপিট: আপনার বাচ্চা যা-ই বলবে, টম ঠিক সেই ...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "381",
    "name": "Wooden Tabletop Color Memory Chess Game || CHILDREN'S Early Educational Toys",
    "slug": "wooden-tabletop-color-memory-chess-game-childrens-early-educ-381",
    "product_code": "3381",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/9xrDW3ssY4s05STwx3SPX5UJeKje1SEyTkcV1sBM.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/9xrDW3ssY4s05STwx3SPX5UJeKje1SEyTkcV1sBM.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/N90tZbhfbbnmnW5ifkFSONqx0HzrhayhBnbnBb2b.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/9xrDW3ssY4s05STwx3SPX5UJeKje1SEyTkcV1sBM.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/N90tZbhfbbnmnW5ifkFSONqx0HzrhayhBnbnBb2b.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 590,
    "originalPrice": 797,
    "regular_price": 797,
    "rating": 4.8,
    "reviews": 21,
    "sold": 66,
    "stock": 50,
    "product_variants": [],
    "details": "Wooden Tabletop Color Memory Chess Game || CHILDREN'S Early Educational Toysবোর্ডের সবকটি গর্তে (Holes) সব গুটিগুলো এলোমেলোভাবে বসানো থাকে, যাতে গুটির...",
    "description": "Wooden Tabletop Color Memory Chess Game || CHILDREN'S Early Educational Toysবোর্ডের সবকটি গর্তে (Holes) সব গুটিগুলো এলোমেলোভাবে বসানো থাকে, যাতে গুটির...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "434",
    "name": "Electronic Dancing Robot Toy For Kids",
    "slug": "electronic-dancing-robot-toy-for-kids-3434",
    "product_code": "3434",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/h6evPxtOorfFXhAPyj50hpZDEhCoJhkMgMRRS8Wd.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/h6evPxtOorfFXhAPyj50hpZDEhCoJhkMgMRRS8Wd.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Uu8Ma1JFyDRwyWBCFctFUpjC4T26QDXKbSxEFvqx.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/ksAG9BQfTkfG9XpxvxBjkiL7NnWun6lrKxhqBnTj.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/0MYyKcjpaLB9RbC4w2GCIe9q23olYbpZ4klo3JYj.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/h6evPxtOorfFXhAPyj50hpZDEhCoJhkMgMRRS8Wd.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Uu8Ma1JFyDRwyWBCFctFUpjC4T26QDXKbSxEFvqx.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ksAG9BQfTkfG9XpxvxBjkiL7NnWun6lrKxhqBnTj.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/0MYyKcjpaLB9RbC4w2GCIe9q23olYbpZ4klo3JYj.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 950,
    "originalPrice": 1283,
    "regular_price": 1283,
    "rating": 4.8,
    "reviews": 24,
    "sold": 119,
    "stock": 50,
    "product_variants": [],
    "details": "*🤖মিনি ডান্সিং রোবট: আপনার শিশুর জন্য আনন্দ ও শিক্ষা একসাথে !🤖*&nbsp;আপনি কি আপনার শিশুর জন্য এমন একটি খেলনা খুঁজছেন, যা তাদের আনন্দ দিবে এবং শেখাবে...",
    "description": "*🤖মিনি ডান্সিং রোবট: আপনার শিশুর জন্য আনন্দ ও শিক্ষা একসাথে !🤖*&nbsp;আপনি কি আপনার শিশুর জন্য এমন একটি খেলনা খুঁজছেন, যা তাদের আনন্দ দিবে এবং শেখাবে...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "521",
    "name": "Drawing Art Set Painting For Kids Box Artist -150 Pcs",
    "slug": "drawing-art-set-painting-for-kids-box-artist-208-pcs-3521",
    "product_code": "3521",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Zi3HTt0kwiubigr595lE6RYd5O9aFudxoPCcPItO.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Zi3HTt0kwiubigr595lE6RYd5O9aFudxoPCcPItO.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/OtEJUymNt4Vp4KGbMe4kRvc5pgU1H0Ep0Mj83OMn.png",
      "https://mohasagor.com.bd/public/storage/images/products/5KUlXXuTR2rr42k4taRbKtfBRj4m1KrkjyLDYsd7.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Zi3HTt0kwiubigr595lE6RYd5O9aFudxoPCcPItO.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/OtEJUymNt4Vp4KGbMe4kRvc5pgU1H0Ep0Mj83OMn.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/5KUlXXuTR2rr42k4taRbKtfBRj4m1KrkjyLDYsd7.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 36,
    "sold": 86,
    "stock": 50,
    "product_variants": [],
    "details": "❤🧡💛💚💙💜🤍🤎🖤শিশুদের জন্য 150-পিসের colour box &nbsp;– সৃজনশীলতার সেরা উপহার!🧡💛💚💙💜🤍🤎🖤❤&nbsp;আপনার শিশুর সৃজনশীলতাকে বিকশিত করার জন্য এই 15...",
    "description": "❤🧡💛💚💙💜🤍🤎🖤শিশুদের জন্য 150-পিসের colour box &nbsp;– সৃজনশীলতার সেরা উপহার!🧡💛💚💙💜🤍🤎🖤❤&nbsp;আপনার শিশুর সৃজনশীলতাকে বিকশিত করার জন্য এই 15...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "534",
    "name": "Children Digital Camera 2 Inch Color Display",
    "slug": "fiddlerz-battery-operated-defrom-flying-car-with-sound-light-bump-n-go-function-rotating-four-wheel-toys-color-may-vary-3534",
    "product_code": "3534",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/xKQHr55ms8ogvWPUFFXWmV955LrdKix6WnRkHaW7.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/xKQHr55ms8ogvWPUFFXWmV955LrdKix6WnRkHaW7.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/bzUcwJXoNaA3PSeJHNNHLmGaEZ8UNQP90hRFk7OA.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/ywb50M02DPjiSf0SULA53lDm7on9OgQgJj86lTPs.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/xKQHr55ms8ogvWPUFFXWmV955LrdKix6WnRkHaW7.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bzUcwJXoNaA3PSeJHNNHLmGaEZ8UNQP90hRFk7OA.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ywb50M02DPjiSf0SULA53lDm7on9OgQgJj86lTPs.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 1650,
    "originalPrice": 2228,
    "regular_price": 2228,
    "rating": 4.8,
    "reviews": 24,
    "sold": 99,
    "stock": 50,
    "product_variants": [],
    "details": "Children Digital Camera 2 Inch Color Display৭২০পি এইচডি ভিডিও ও ছবি: হাই-ডেফিনিশন ক্লিয়ার রেজোলিউশনে শিশুর সুন্দর মুহূর্তগুলো দারুণভাবে রেকর্ড করা যা...",
    "description": "Children Digital Camera 2 Inch Color Display৭২০পি এইচডি ভিডিও ও ছবি: হাই-ডেফিনিশন ক্লিয়ার রেজোলিউশনে শিশুর সুন্দর মুহূর্তগুলো দারুণভাবে রেকর্ড করা যা...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "540",
    "name": "Sliding Plate -Electronic Stunt Skateboard Boy with Music & Light Effect (Multicolor)",
    "slug": "sliding-plate-electronic-stunt-skateboard-boy-with-music-light-effect-multicolor-3540",
    "product_code": "3540",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/yBeoGr8zqE1iAsOFJGMNGf2q33LjLo6yd302Yvkm.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/yBeoGr8zqE1iAsOFJGMNGf2q33LjLo6yd302Yvkm.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/nV3ATQL3QkP7nBCsAJNAN1e33Lm62RIFhmPbd0GK.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/HTX20KoFxCnAKU2XAoagBocWFuNMwLo16YXeQPSZ.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/c6nNobtPI4BXS9sbxKY4nZN1VCLMb8OKYA9FIpua.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/YE3Lp3KXPy9KMlADZVOc5OL0sjtUoJgqKSoGGoty.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/JCJi5ejke1t57MfVuOgLSKfLWiKeltzL6MaWq75f.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/yBeoGr8zqE1iAsOFJGMNGf2q33LjLo6yd302Yvkm.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/nV3ATQL3QkP7nBCsAJNAN1e33Lm62RIFhmPbd0GK.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/HTX20KoFxCnAKU2XAoagBocWFuNMwLo16YXeQPSZ.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/c6nNobtPI4BXS9sbxKY4nZN1VCLMb8OKYA9FIpua.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/YE3Lp3KXPy9KMlADZVOc5OL0sjtUoJgqKSoGGoty.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/JCJi5ejke1t57MfVuOgLSKfLWiKeltzL6MaWq75f.jpg",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 30,
    "sold": 105,
    "stock": 1,
    "product_variants": [],
    "details": "Product informationTechnical DetailsBatteries Required‎YesBatteries Included‎NoMaterial Type(s)‎PlasticColour‎MultiProduct Dimensions‎26 x 12 x 20 cm;...",
    "description": "Product informationTechnical DetailsBatteries Required‎YesBatteries Included‎NoMaterial Type(s)‎PlasticColour‎MultiProduct Dimensions‎26 x 12 x 20 cm;...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "548",
    "name": "Car Toy",
    "slug": "car-toy-3548",
    "product_code": "3548",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/vYxUJer86nLUQP7TmOBwEh8dP70HXzPsQl3oLemd.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/vYxUJer86nLUQP7TmOBwEh8dP70HXzPsQl3oLemd.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/mYLUr7WnGO1kOMrzpIMK25T6IsJ3ZHZdotwfUrhz.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/vYxUJer86nLUQP7TmOBwEh8dP70HXzPsQl3oLemd.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/mYLUr7WnGO1kOMrzpIMK25T6IsJ3ZHZdotwfUrhz.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 38,
    "sold": 113,
    "stock": 1,
    "product_variants": [],
    "details": "Product details of METAL CAR set for kids &nbsp;pack for giftProduct Type: Toy Car&nbsp;",
    "description": "Product details of METAL CAR set for kids &nbsp;pack for giftProduct Type: Toy Car&nbsp;",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "622",
    "name": " Electric Small Duck Climbing Stairs Toy",
    "slug": "electric-small-duck-climbing-stairs-toy-3622",
    "product_code": "3622",
    "category": "Kids Zone",
    "image": "https://mohasagor.com.bd/public/storage/images/products/qcP87csCHCB9PWsXXv4QSgqNKBxLYPJ9OYJ5bfVm.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/qcP87csCHCB9PWsXXv4QSgqNKBxLYPJ9OYJ5bfVm.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/g41XvPDxBzOXzkh2oLU6AhdZ9PXAIxR5lemUm828.webp",
      "https://mohasagor.com.bd/public/storage/images/products/lOk4vnK9b7UMWGCmSC3iE4oPxKGblg7KB5DlHLX5.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/f6fHvrAgyaSHZ2FmmJCQvRH40fdxcHTJDwHga42z.webp",
      "https://mohasagor.com.bd/public/storage/images/products/OVvCjhVZocKIKTLaFmOBPa1ZVRLgfCUybvSC7k2k.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/bO1iitSPbsKOOzB3OQVhaWUvZrgejhteJPMwTcYe.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/qcP87csCHCB9PWsXXv4QSgqNKBxLYPJ9OYJ5bfVm.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/g41XvPDxBzOXzkh2oLU6AhdZ9PXAIxR5lemUm828.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/lOk4vnK9b7UMWGCmSC3iE4oPxKGblg7KB5DlHLX5.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/f6fHvrAgyaSHZ2FmmJCQvRH40fdxcHTJDwHga42z.webp",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/OVvCjhVZocKIKTLaFmOBPa1ZVRLgfCUybvSC7k2k.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bO1iitSPbsKOOzB3OQVhaWUvZrgejhteJPMwTcYe.jpg",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 850,
    "originalPrice": 1148,
    "regular_price": 1148,
    "rating": 4.8,
    "reviews": 37,
    "sold": 67,
    "stock": 50,
    "product_variants": [],
    "details": "* 🦆ছোট্ট হাঁসেদের মজার জগৎ: ইলেকট্রিক ডাক ক্লাইম্বিং স্টেয়ার টয় – খেলা, শেখা, এবং আনন্দ!* 🦆 &nbsp;&nbsp;👉 আপনার ছোট্ট সোনামনির জন্য এমন একটি খেলনা ...",
    "description": "* 🦆ছোট্ট হাঁসেদের মজার জগৎ: ইলেকট্রিক ডাক ক্লাইম্বিং স্টেয়ার টয় – খেলা, শেখা, এবং আনন্দ!* 🦆 &nbsp;&nbsp;👉 আপনার ছোট্ট সোনামনির জন্য এমন একটি খেলনা ...",
    "category_slug": "kids-zone",
    "categorySlug": "kids-zone"
  },
  {
    "id": "20",
    "name": "Men's Winter Only Hoodie-Camo cargo",
    "slug": "mens-winter-only-hoodie-camo-cargo-3020",
    "product_code": "3020",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/l4mQu1nruNUikkD6cEMKKPF8jHw6xX48qmufJOqu.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/l4mQu1nruNUikkD6cEMKKPF8jHw6xX48qmufJOqu.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/l4mQu1nruNUikkD6cEMKKPF8jHw6xX48qmufJOqu.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 340,
    "originalPrice": 459,
    "regular_price": 459,
    "rating": 4.8,
    "reviews": 35,
    "sold": 65,
    "stock": 50,
    "product_variants": [
      {
        "id": "21403",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "21404",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "21405",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "21406",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's Winter Hoodie Solid Colorfabric: Cotton+fleece (inside brush)Size: M, L, XL,M=Chest-38, Length-27L=Chest-40, Length-28XL=Chest-42, Length-29",
    "description": "Men's Winter Hoodie Solid Colorfabric: Cotton+fleece (inside brush)Size: M, L, XL,M=Chest-38, Length-27L=Chest-40, Length-28XL=Chest-42, Length-29",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "27",
    "name": "Men's winter hoodie  Black (Ibadah)",
    "slug": "mens-winter-hoodie-ibadah-3027",
    "product_code": "3027",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/O2ApzXor0ES6xzlS7JQl96GEJrX7pXsbEgfGMIHm.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/O2ApzXor0ES6xzlS7JQl96GEJrX7pXsbEgfGMIHm.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/PSUtdGl1lfpzdN0QHVKnWBk2kQ7vFG7S9D2ITvA2.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/pdLEw0lK6R63M7hpW4TFCwltRysxxorpogx8cERh.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/bvmBq8JeLvAaECDtJ2b2VkW6xcfhu5HuLIsLOU5J.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/O2ApzXor0ES6xzlS7JQl96GEJrX7pXsbEgfGMIHm.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/PSUtdGl1lfpzdN0QHVKnWBk2kQ7vFG7S9D2ITvA2.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/pdLEw0lK6R63M7hpW4TFCwltRysxxorpogx8cERh.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bvmBq8JeLvAaECDtJ2b2VkW6xcfhu5HuLIsLOU5J.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 17,
    "sold": 72,
    "stock": 2,
    "product_variants": [
      {
        "id": "11860",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11861",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11862",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's winter hoodiefabric: Cotton+fleece (inside brush)Fabric &amp; Print Color GuaranteedSize: M, L, XL, XXLM=Chest-38, Length-27L=Chest-40, Length-2...",
    "description": "Men's winter hoodiefabric: Cotton+fleece (inside brush)Fabric &amp; Print Color GuaranteedSize: M, L, XL, XXLM=Chest-38, Length-27L=Chest-40, Length-2...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "28",
    "name": "Men's winter hoodie Alex",
    "slug": "mens-winter-hoodie-alex-3028",
    "product_code": "3028",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/bLNIKDQTeHuX0GpoEzcryJKFdlgM3zO7te9qUKIH.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/bLNIKDQTeHuX0GpoEzcryJKFdlgM3zO7te9qUKIH.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/aKEJR8eh8oRHeNyZcw3wROewyELnhMQtUsRHwuok.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/lvwxEd6N8WuZ0YYJNUTg2vTXE5ciHjbJkReFrjnF.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Dd7OpMy9zVGIGZZUuYiNXvqUeEbMmYs3IwmSazLq.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Fc5sbwzWvVnooBhm0saG6H6isVVAfYEGOveV63c8.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/MAiTac3923yQRfyHZx1uyJZsdsbVSIYMfRYf3y41.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/uU9LyMmmjvC3jO7Sxe8HRuP0OzXA09vV7l3hEYFe.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/b5GeOPtzq1LdZN1p5gzc3ViA2afnwH6wlqc18tX8.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/bLNIKDQTeHuX0GpoEzcryJKFdlgM3zO7te9qUKIH.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/aKEJR8eh8oRHeNyZcw3wROewyELnhMQtUsRHwuok.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/lvwxEd6N8WuZ0YYJNUTg2vTXE5ciHjbJkReFrjnF.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Dd7OpMy9zVGIGZZUuYiNXvqUeEbMmYs3IwmSazLq.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Fc5sbwzWvVnooBhm0saG6H6isVVAfYEGOveV63c8.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/MAiTac3923yQRfyHZx1uyJZsdsbVSIYMfRYf3y41.jpg",
        "is_primary": false,
        "sort_order": 5
      },
      {
        "id": "img-6",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/uU9LyMmmjvC3jO7Sxe8HRuP0OzXA09vV7l3hEYFe.jpg",
        "is_primary": false,
        "sort_order": 6
      },
      {
        "id": "img-7",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/b5GeOPtzq1LdZN1p5gzc3ViA2afnwH6wlqc18tX8.jpg",
        "is_primary": false,
        "sort_order": 7
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 18,
    "sold": 73,
    "stock": 6,
    "product_variants": [
      {
        "id": "13074",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "13075",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "13076",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Men's winter hoodiefabric: Cotton+fleece (inside brush)Fabric &amp; Print Color GuaranteedSize: M, L, XL, XXLM=Chest-38, Length-27L=Chest-40, Length-2...",
    "description": "Men's winter hoodiefabric: Cotton+fleece (inside brush)Fabric &amp; Print Color GuaranteedSize: M, L, XL, XXLM=Chest-38, Length-27L=Chest-40, Length-2...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "75",
    "name": "Men's winter Hoodie & Trouser Full Set",
    "slug": "mens-winter-hoodie-trouserblack-meroon-full-set-3075",
    "product_code": "3075",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Xl8qDDlWPpBlzYKEnh3EVag1ym56XZp2EnChG3J4.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Xl8qDDlWPpBlzYKEnh3EVag1ym56XZp2EnChG3J4.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/h3c3gzZ3tPBZDHd2hyNOp0eehKskKf3pX8qtkTpY.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/xPtJmDeZtN5W8PGcYhny5sX9TlvPkpgjomjvvzOl.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Xl8qDDlWPpBlzYKEnh3EVag1ym56XZp2EnChG3J4.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/h3c3gzZ3tPBZDHd2hyNOp0eehKskKf3pX8qtkTpY.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/xPtJmDeZtN5W8PGcYhny5sX9TlvPkpgjomjvvzOl.jpg",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "price": 790,
    "originalPrice": 1067,
    "regular_price": 1067,
    "rating": 4.8,
    "reviews": 15,
    "sold": 120,
    "stock": 66,
    "product_variants": [
      {
        "id": "11655",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11656",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "11657",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "শীতের দিনে স্টাইল ও আরামের সেরা সমন্বয় – হুডি এবং ট্রাউজারের প্রিমিয়াম কম্বো সেট!শীতকালের জন্য বিশেষভাবে তৈরি এই হুডি ও ট্রাউজার সেটে রয়েছে গুণগত মানে...",
    "description": "শীতের দিনে স্টাইল ও আরামের সেরা সমন্বয় – হুডি এবং ট্রাউজারের প্রিমিয়াম কম্বো সেট!শীতকালের জন্য বিশেষভাবে তৈরি এই হুডি ও ট্রাউজার সেটে রয়েছে গুণগত মানে...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3299",
    "name": "solid colour premium hoodie Black",
    "slug": "solid-premium-hoodie-navy-blue-6299",
    "product_code": "6299",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/OWEPReYXU4pYNfenwJ1EdbZnp4sABFgztHvoIjIn.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/OWEPReYXU4pYNfenwJ1EdbZnp4sABFgztHvoIjIn.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/OWEPReYXU4pYNfenwJ1EdbZnp4sABFgztHvoIjIn.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 650,
    "originalPrice": 878,
    "regular_price": 878,
    "rating": 4.8,
    "reviews": 39,
    "sold": 104,
    "stock": 327,
    "product_variants": [
      {
        "id": "8527",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8528",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8529",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8530",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "description": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3301",
    "name": "Islam is light Islamic Hoodie (Black)",
    "slug": "islam-is-light-islamic-hoodie-black-3301",
    "product_code": "6301",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/iU7shHcfPt5SGsZQJOlMDSDb4FI5Oxlw1DFR0cCS.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/iU7shHcfPt5SGsZQJOlMDSDb4FI5Oxlw1DFR0cCS.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/iU7shHcfPt5SGsZQJOlMDSDb4FI5Oxlw1DFR0cCS.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 16,
    "sold": 106,
    "stock": 1,
    "product_variants": [
      {
        "id": "9134",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "9135",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "9136",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "9137",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "description": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3302",
    "name": "313 Bodri Sahaba Islamic Hoodie (Royal Blue)",
    "slug": "313-bodri-sahaba-islamic-hoodie-royal-blue-3302",
    "product_code": "6302",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/WKd8canPgtoH6FWkFTUxv7QgStJq5cif298RhN6d.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/WKd8canPgtoH6FWkFTUxv7QgStJq5cif298RhN6d.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/WKd8canPgtoH6FWkFTUxv7QgStJq5cif298RhN6d.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 17,
    "sold": 107,
    "stock": 9,
    "product_variants": [
      {
        "id": "29417",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "29418",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "29419",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "\" শীতের ঠান্ডায় উষ্ণতা ও ইসলামীক স্টাইলের ছোঁয়া: premium and comfortable winter hoodies\"এই শীতে নিজের স্টাইল ও কমফোর্ট নিয়ে কোন আপোস নয়! আমাদের প্...",
    "description": "\" শীতের ঠান্ডায় উষ্ণতা ও ইসলামীক স্টাইলের ছোঁয়া: premium and comfortable winter hoodies\"এই শীতে নিজের স্টাইল ও কমফোর্ট নিয়ে কোন আপোস নয়! আমাদের প্...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3303",
    "name": "হে প্রিয় রাসুল Islamic Hoodie (Royal Blue)",
    "slug": "islamic-hoodie-royal-blue-3303",
    "product_code": "6303",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/fk9XkyhJZWwlJb0SRDUSkCanG4FKkkrBF7WciJbH.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/fk9XkyhJZWwlJb0SRDUSkCanG4FKkkrBF7WciJbH.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/fk9XkyhJZWwlJb0SRDUSkCanG4FKkkrBF7WciJbH.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 18,
    "sold": 108,
    "stock": 2,
    "product_variants": [
      {
        "id": "29411",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "29412",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "29413",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "\" শীতের ঠান্ডায় উষ্ণতা ও ইসলামীক স্টাইলের ছোঁয়া: premium and comfortable winter hoodies\"এই শীতে নিজের স্টাইল ও কমফোর্ট নিয়ে কোন আপোস নয়! আমাদের প্...",
    "description": "\" শীতের ঠান্ডায় উষ্ণতা ও ইসলামীক স্টাইলের ছোঁয়া: premium and comfortable winter hoodies\"এই শীতে নিজের স্টাইল ও কমফোর্ট নিয়ে কোন আপোস নয়! আমাদের প্...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3306",
    "name": "Power Of Faith  Islamic Hoodie (Royal Blue)",
    "slug": "musafir-islamic-hoodie-navy-blue-6306",
    "product_code": "6306",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/QZcAaCPsxto9UffhmxEBnjOsynU8VGxtjkXVa7ZL.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/QZcAaCPsxto9UffhmxEBnjOsynU8VGxtjkXVa7ZL.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/QZcAaCPsxto9UffhmxEBnjOsynU8VGxtjkXVa7ZL.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 21,
    "sold": 111,
    "stock": 50,
    "product_variants": [
      {
        "id": "8555",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8556",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8557",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8558",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "description": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3307",
    "name": "Assalamu Alaikum Islamic Hoodie (Navy Blue)",
    "slug": "iqra-akra-islamic-hoodie-maroon-6307",
    "product_code": "6307",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/b433bd9Tmd6zwCOvR55Y4UHB5vJQG5rC4c0gg7zS.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/b433bd9Tmd6zwCOvR55Y4UHB5vJQG5rC4c0gg7zS.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/b433bd9Tmd6zwCOvR55Y4UHB5vJQG5rC4c0gg7zS.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 650,
    "originalPrice": 878,
    "regular_price": 878,
    "rating": 4.8,
    "reviews": 22,
    "sold": 112,
    "stock": 50,
    "product_variants": [
      {
        "id": "8559",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8560",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8561",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8562",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "description": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3308",
    "name": "Power Of Faith  Islamic Hoodie (Black)",
    "slug": "power-of-faith-islamic-hoodie-royal-blue-6308",
    "product_code": "6308",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/h2PRVWklcpeuxV0CabrPhygddOruJAF6J7g0tdre.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/h2PRVWklcpeuxV0CabrPhygddOruJAF6J7g0tdre.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/h2PRVWklcpeuxV0CabrPhygddOruJAF6J7g0tdre.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 690,
    "originalPrice": 932,
    "regular_price": 932,
    "rating": 4.8,
    "reviews": 23,
    "sold": 113,
    "stock": 3,
    "product_variants": [
      {
        "id": "8563",
        "attribute": "Size",
        "variant": "M",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8564",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8565",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      },
      {
        "id": "8566",
        "attribute": "Size",
        "variant": "XXL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "description": "300+GSM, 100%Cotton, Premium fabric, Export quality swing, Rubber or DTF printMaterial: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "3310",
    "name": "Men's Winter Hoodie (Black)",
    "slug": "mens-winter-hoodie-black-6310",
    "product_code": "6310",
    "category": "Winter",
    "image": "https://mohasagor.com.bd/public/storage/images/products/VEm5HlXD5ce4qWxWmEa0YNeSSo4xDLcRene2mBIj.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/VEm5HlXD5ce4qWxWmEa0YNeSSo4xDLcRene2mBIj.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Q7iH1s0UP9lRbMSpV6KWTXML8rxSTb97Z5ZYo1Xb.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/VEm5HlXD5ce4qWxWmEa0YNeSSo4xDLcRene2mBIj.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Q7iH1s0UP9lRbMSpV6KWTXML8rxSTb97Z5ZYo1Xb.jpg",
        "is_primary": false,
        "sort_order": 1
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 25,
    "sold": 115,
    "stock": 50,
    "product_variants": [
      {
        "id": "12335",
        "attribute": "Size",
        "variant": "L",
        "price": 0,
        "stock": 50
      },
      {
        "id": "12336",
        "attribute": "Size",
        "variant": "XL",
        "price": 0,
        "stock": 50
      }
    ],
    "details": "Material: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp; Print Colour GuaranteeWashable &amp; Durable ClothSize chart - In Inches (Ex...",
    "description": "Material: Cotton Felecce ( Inside Brush)Fabrication: 300+ GSMFabric &amp; Print Colour GuaranteeWashable &amp; Durable ClothSize chart - In Inches (Ex...",
    "category_slug": "winter",
    "categorySlug": "winter"
  },
  {
    "id": "266",
    "name": "X7 Bluetooth Call Smart Watch",
    "slug": "x7-bluetooth-call-smart-watch-3266",
    "product_code": "3266",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/qMnnKC7IZDIuDNKRGIk78ScBiowni9mnErGJCZ4U.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/qMnnKC7IZDIuDNKRGIk78ScBiowni9mnErGJCZ4U.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/4FjM677UiP4YTBP2juvKSvBFJ2gG1sYfjKXWVlvK.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/Sr1MkwZK2WcsOuW22Q901pziCJnui6jLdl6g4YSp.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/KEf7KFukob9Sdb5mzsSFZCAE54zq4kZXO9rNp14f.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/qMnnKC7IZDIuDNKRGIk78ScBiowni9mnErGJCZ4U.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/4FjM677UiP4YTBP2juvKSvBFJ2gG1sYfjKXWVlvK.jpg",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Sr1MkwZK2WcsOuW22Q901pziCJnui6jLdl6g4YSp.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/KEf7KFukob9Sdb5mzsSFZCAE54zq4kZXO9rNp14f.jpg",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 750,
    "originalPrice": 1013,
    "regular_price": 1013,
    "rating": 4.8,
    "reviews": 31,
    "sold": 71,
    "stock": 1,
    "product_variants": [],
    "details": "Specification:Product Name: X7 Smart WatchMaster Chip: HS6620+FRScreen Display: 1.44 InchProduct Size: 44*38*10.8mmBody Material: Alloy body + IML bot...",
    "description": "Specification:Product Name: X7 Smart WatchMaster Chip: HS6620+FRScreen Display: 1.44 InchProduct Size: 44*38*10.8mmBody Material: Alloy body + IML bot...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "284",
    "name": "K10 SIM Suported Android Smart Watch",
    "slug": "k10-sim-suported-android-smart-watch-3284",
    "product_code": "3284",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/ICBvaBb3yPX29gzyIsJ7OGToV2aU7n5tuEfrhJ1A.webp",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/ICBvaBb3yPX29gzyIsJ7OGToV2aU7n5tuEfrhJ1A.webp",
      "https://mohasagor.com.bd/public/storage/images/products/zfhafmlzomw3yjBI2VquNylTqJ00V5eHU3F6QVtA.webp",
      "https://mohasagor.com.bd/public/storage/images/products/Xxn6MqxOYNYD8XBW8yi1V6slVDpHaCCyJ5o7BC01.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/dQ6BZo6P7aK1ogRARxJBix94jDmWgwREyjR6IzQW.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/OVUBSjCjjescmK89vxecs1fwrGp3c1Y8e03q3Ahl.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ICBvaBb3yPX29gzyIsJ7OGToV2aU7n5tuEfrhJ1A.webp",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/zfhafmlzomw3yjBI2VquNylTqJ00V5eHU3F6QVtA.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Xxn6MqxOYNYD8XBW8yi1V6slVDpHaCCyJ5o7BC01.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/dQ6BZo6P7aK1ogRARxJBix94jDmWgwREyjR6IzQW.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/OVUBSjCjjescmK89vxecs1fwrGp3c1Y8e03q3Ahl.webp",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 1650,
    "originalPrice": 2228,
    "regular_price": 2228,
    "rating": 4.8,
    "reviews": 24,
    "sold": 89,
    "stock": 50,
    "product_variants": [],
    "details": "Model : K10 Smart WatchSIM Card SupportSize : 1.54″ LCDBand Wide : 21mmWeight : 47gFull TouchStrap : Silica GelCPU : MTK2502Resolution : 240*240Screen...",
    "description": "Model : K10 Smart WatchSIM Card SupportSize : 1.54″ LCDBand Wide : 21mmWeight : 47gFull TouchStrap : Silica GelCPU : MTK2502Resolution : 240*240Screen...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "287",
    "name": "Olevs Luxury Men’s Quartz Watch(Black -White)",
    "slug": "olevs-waterproof-luxury-mens-quartz-watchblack-white-3287",
    "product_code": "3287",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/Mv7Ge2WAYs5opGUIYBV9SOnmGmNx6orTulF894b4.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/Mv7Ge2WAYs5opGUIYBV9SOnmGmNx6orTulF894b4.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/Mv7Ge2WAYs5opGUIYBV9SOnmGmNx6orTulF894b4.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 1250,
    "originalPrice": 1688,
    "regular_price": 1688,
    "rating": 4.8,
    "reviews": 27,
    "sold": 92,
    "stock": 1,
    "product_variants": [],
    "details": "Specification :Brand Name: OLEVSMovement: QuartzCertification: NoneClasp Type: Push Button Hidden ClaspOrigin: CN(Origin)Case Material: AlloyWater Res...",
    "description": "Specification :Brand Name: OLEVSMovement: QuartzCertification: NoneClasp Type: Push Button Hidden ClaspOrigin: CN(Origin)Case Material: AlloyWater Res...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "289",
    "name": "Butter Fly Lock OLEVS 9931G New Exclusive Design Quartz Watch for Men (Golden Black )",
    "slug": "olevs-waterproof-luxury-mens-quartz-watchgolden-black-3289",
    "product_code": "3289",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/6M8OKFQbx9N2dumgsIXD76Pwtnv6ick2Ehb9onIb.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/6M8OKFQbx9N2dumgsIXD76Pwtnv6ick2Ehb9onIb.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/6M8OKFQbx9N2dumgsIXD76Pwtnv6ick2Ehb9onIb.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 790,
    "originalPrice": 1067,
    "regular_price": 1067,
    "rating": 4.8,
    "reviews": 29,
    "sold": 94,
    "stock": 1,
    "product_variants": [],
    "details": "Specification :Brand Name: OLEVSMovement: QuartzCertification: NoneClasp Type: Push Button Hidden ClaspOrigin: CN(Origin)Case Material: AlloyWater Res...",
    "description": "Specification :Brand Name: OLEVSMovement: QuartzCertification: NoneClasp Type: Push Button Hidden ClaspOrigin: CN(Origin)Case Material: AlloyWater Res...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "292",
    "name": "OLEVS 5563 Fashion Watch for Women",
    "slug": "olevs-5563-fashion-watch-for-women-3292",
    "product_code": "3292",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/KPaMk7rwGIlxQyMC2Lj8A3PnWc2PcdRBstKj7gE9.webp",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/KPaMk7rwGIlxQyMC2Lj8A3PnWc2PcdRBstKj7gE9.webp",
      "https://mohasagor.com.bd/public/storage/images/products/GHBfHDJV5lYgHFrTFdcK3uNpNM9lrU7TvfKyVbfo.webp",
      "https://mohasagor.com.bd/public/storage/images/products/jURbxQne3wedAAKzWbgV9JsXHKfjpkWnSJpzp6pN.webp",
      "https://mohasagor.com.bd/public/storage/images/products/ByJnPdJHUz5TLxAtl50AFdUe6TItSzz73yI3ENHd.webp"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/KPaMk7rwGIlxQyMC2Lj8A3PnWc2PcdRBstKj7gE9.webp",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/GHBfHDJV5lYgHFrTFdcK3uNpNM9lrU7TvfKyVbfo.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/jURbxQne3wedAAKzWbgV9JsXHKfjpkWnSJpzp6pN.webp",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/ByJnPdJHUz5TLxAtl50AFdUe6TItSzz73yI3ENHd.webp",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 1250,
    "originalPrice": 1688,
    "regular_price": 1688,
    "rating": 4.8,
    "reviews": 32,
    "sold": 97,
    "stock": 50,
    "product_variants": [],
    "details": "Brand Name:&nbsp;OLEVSMovement:&nbsp;QUARTZClasp Type:&nbsp;Push Button Hidden ClaspCase Material:&nbsp;Stainless SteelWater Resistance Depth:&nbsp;3B...",
    "description": "Brand Name:&nbsp;OLEVSMovement:&nbsp;QUARTZClasp Type:&nbsp;Push Button Hidden ClaspCase Material:&nbsp;Stainless SteelWater Resistance Depth:&nbsp;3B...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "828",
    "name": "Foldable Travel Alarm Clock (BE Model) – Compact Portable Quartz Analog Clock with Night Light, Battery Included",
    "slug": "foldable-travel-alarm-clock-be-3828",
    "product_code": "3828",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/FWM0bKK2VOSYrnHAxfCy6AoN2cQsHpUQgjMRFfho.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/FWM0bKK2VOSYrnHAxfCy6AoN2cQsHpUQgjMRFfho.png",
      "https://mohasagor.com.bd/public/storage/images/products/rEnzEzK9i45NjUootsDr8kVzPD3Fmb1SLMtCQmCc.png",
      "https://mohasagor.com.bd/public/storage/images/products/QIVEMR1Zb9Kr00eVlyew2WuPKYZRuW3uYLUHWjLb.png",
      "https://mohasagor.com.bd/public/storage/images/products/s4Wbw7Hh4vYJraPz6ArNbuDWD9fhjVaFTBspiwHU.png"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/FWM0bKK2VOSYrnHAxfCy6AoN2cQsHpUQgjMRFfho.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/rEnzEzK9i45NjUootsDr8kVzPD3Fmb1SLMtCQmCc.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/QIVEMR1Zb9Kr00eVlyew2WuPKYZRuW3uYLUHWjLb.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/s4Wbw7Hh4vYJraPz6ArNbuDWD9fhjVaFTBspiwHU.png",
        "is_primary": false,
        "sort_order": 3
      }
    ],
    "price": 380,
    "originalPrice": 513,
    "regular_price": 513,
    "rating": 4.8,
    "reviews": 18,
    "sold": 153,
    "stock": 50,
    "product_variants": [],
    "details": "আপনার ব্যস্ত জীবনযাত্রা এবং ভ্রমণের সময়কে আরও সহজ ও শৃঙ্খলিত করতে নিয়ে এলাম আকর্ষণীয় ডিজাইনের ফোল্ডেবল ট্রাভেল অ্যালার্ম ক্লক (BE মডেল)। এটি কেবল একটি...",
    "description": "আপনার ব্যস্ত জীবনযাত্রা এবং ভ্রমণের সময়কে আরও সহজ ও শৃঙ্খলিত করতে নিয়ে এলাম আকর্ষণীয় ডিজাইনের ফোল্ডেবল ট্রাভেল অ্যালার্ম ক্লক (BE মডেল)। এটি কেবল একটি...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "836",
    "name": "Digital LCD Clock with Calendar, Temperature Sensor, Alarm for Table and Study Desk",
    "slug": "digital-lcd-clock-with-calendar-temperature-sensor-alarm-for-table-and-study-desk-3836",
    "product_code": "3836",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/EFmTTJIrAzyMcmQEuGFF6shoUzurcW8e3aGlOGxF.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/EFmTTJIrAzyMcmQEuGFF6shoUzurcW8e3aGlOGxF.png",
      "https://mohasagor.com.bd/public/storage/images/products/CC1nMjNDUCwdUy5FNfYnIncgs93m8BHF7yjsjQR1.png",
      "https://mohasagor.com.bd/public/storage/images/products/K9NygnIiz1B8TybX9ol4aUVdkRd3L3bhGGvV97VJ.png",
      "https://mohasagor.com.bd/public/storage/images/products/SL8pJJXNqKyXw8RiJVwlrqpdVU6mjzxwpEIf6zTj.png",
      "https://mohasagor.com.bd/public/storage/images/products/16DWYHqGp7qe0PFsW4Trac4Urwr91T19kizsxaEK.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/EFmTTJIrAzyMcmQEuGFF6shoUzurcW8e3aGlOGxF.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/CC1nMjNDUCwdUy5FNfYnIncgs93m8BHF7yjsjQR1.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/K9NygnIiz1B8TybX9ol4aUVdkRd3L3bhGGvV97VJ.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/SL8pJJXNqKyXw8RiJVwlrqpdVU6mjzxwpEIf6zTj.png",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/16DWYHqGp7qe0PFsW4Trac4Urwr91T19kizsxaEK.jpg",
        "is_primary": false,
        "sort_order": 4
      }
    ],
    "price": 650,
    "originalPrice": 878,
    "regular_price": 878,
    "rating": 4.8,
    "reviews": 26,
    "sold": 161,
    "stock": 50,
    "product_variants": [],
    "details": "আপনার স্টাডি ডেস্ক, অফিস টেবিল বা বেডরুমের সৌন্দর্য বাড়াতে এবং সময়কে নিখুঁতভাবে ম্যানেজ করতে নিয়ে এলাম মাল্টি-ফাংশনাল ডিজিটাল এলসিডি টেবিল ক্লক (Digit...",
    "description": "আপনার স্টাডি ডেস্ক, অফিস টেবিল বা বেডরুমের সৌন্দর্য বাড়াতে এবং সময়কে নিখুঁতভাবে ম্যানেজ করতে নিয়ে এলাম মাল্টি-ফাংশনাল ডিজিটাল এলসিডি টেবিল ক্লক (Digit...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "2728",
    "name": "Rolex Quartz Movement Stainless Steel Analog Watch for Men",
    "slug": "rolex-quartz-movement-stainless-steel-analog-watch-for-men-5728",
    "product_code": "5728",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/hbMJ91neBmnl6IQpYKhD5W0ic5ISBnxwoEsvIW8R.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/hbMJ91neBmnl6IQpYKhD5W0ic5ISBnxwoEsvIW8R.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/OtgVeRSmsPnnGZDba5Li4pkNuBJsTtVdcPL0kDJR.webp",
      "https://mohasagor.com.bd/public/storage/images/products/w4wMmXcGXXyogVVAqaZDt2KLUqOl7JiI58YSjrr3.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/qZiOZsEtlDrc04HChDhCMo2nURpSs6VLXQ9wlTjB.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/l8MZw456QV2tp4CNE81hLul1LAyIKEd4GZ1VyqR6.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/5cBLkVma0DQM72kbUokV7kLfeq5YWsIPW5g9MO8D.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/hbMJ91neBmnl6IQpYKhD5W0ic5ISBnxwoEsvIW8R.jpg",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/OtgVeRSmsPnnGZDba5Li4pkNuBJsTtVdcPL0kDJR.webp",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/w4wMmXcGXXyogVVAqaZDt2KLUqOl7JiI58YSjrr3.jpg",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/qZiOZsEtlDrc04HChDhCMo2nURpSs6VLXQ9wlTjB.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/l8MZw456QV2tp4CNE81hLul1LAyIKEd4GZ1VyqR6.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/5cBLkVma0DQM72kbUokV7kLfeq5YWsIPW5g9MO8D.jpg",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 1250,
    "originalPrice": 1688,
    "regular_price": 1688,
    "rating": 4.8,
    "reviews": 18,
    "sold": 133,
    "stock": 50,
    "product_variants": [],
    "details": "Rolex Quartz Movement Stainless Steel Analog Watch for MenProduct type: WatchBrand: RolexMovement: QuartzCase Shape: RoundClasp Type: BuckleCase Mater...",
    "description": "Rolex Quartz Movement Stainless Steel Analog Watch for MenProduct type: WatchBrand: RolexMovement: QuartzCase Shape: RoundClasp Type: BuckleCase Mater...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "4985",
    "name": "Butter  Fly Lock Olievs  Stainless Steel fashionable  Couple watches +1pcs chain cutter+ 2 pcs battery ( Silver)",
    "slug": "olevs-stainless-steel-fashionable-couple-watches-silver-7985",
    "product_code": "7985",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/8Ufff5gpkzBY9vs87h1guKCiVQWMH47HTQByfAnR.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/8Ufff5gpkzBY9vs87h1guKCiVQWMH47HTQByfAnR.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/8Ufff5gpkzBY9vs87h1guKCiVQWMH47HTQByfAnR.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 1650,
    "originalPrice": 2228,
    "regular_price": 2228,
    "rating": 4.8,
    "reviews": 25,
    "sold": 110,
    "stock": 50,
    "product_variants": [],
    "details": "OLEVS 5563: ভালোবাসার বাঁধনে জড়ানো প্রতিটি মুহূর্তের নীরব সাক্ষী!👉প্রিয়জনের সাথে কাটানো প্রতিটি মুহূর্তই যেন একটি নতুন গল্প। OLEVS 5563 সেই গল্পগুল...",
    "description": "OLEVS 5563: ভালোবাসার বাঁধনে জড়ানো প্রতিটি মুহূর্তের নীরব সাক্ষী!👉প্রিয়জনের সাথে কাটানো প্রতিটি মুহূর্তই যেন একটি নতুন গল্প। OLEVS 5563 সেই গল্পগুল...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "4988",
    "name": "Butter  Fly Lock Olievs  Stainless Steel fashionable  Couple watches +1pcs chain cutter+ 2 pcs battery  Golden",
    "slug": "olevs-stainless-steel-fashionable-couple-watches-full-golden-7988",
    "product_code": "7988",
    "category": "Watch",
    "image": "https://mohasagor.com.bd/public/storage/images/products/GwI101Bak1j8Kdx6HY6DlRcXN9spT4isebTZpLH6.jpg",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/GwI101Bak1j8Kdx6HY6DlRcXN9spT4isebTZpLH6.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/GwI101Bak1j8Kdx6HY6DlRcXN9spT4isebTZpLH6.jpg",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "price": 1650,
    "originalPrice": 2228,
    "regular_price": 2228,
    "rating": 4.8,
    "reviews": 28,
    "sold": 113,
    "stock": 50,
    "product_variants": [],
    "details": "OLEVS 5563: দম্পতিদের জন্য স্টাইলিশ ও প্রিমিয়াম স্টেইনলেস স্টিল ঘড়ি&nbsp;👉এই ঘড়িগুলোর মূল বৈশিষ্ট্যসমূহ:1. স্টাইলিশ ডিজাইন: স্টেইনলেস স্টিল নির্মা...",
    "description": "OLEVS 5563: দম্পতিদের জন্য স্টাইলিশ ও প্রিমিয়াম স্টেইনলেস স্টিল ঘড়ি&nbsp;👉এই ঘড়িগুলোর মূল বৈশিষ্ট্যসমূহ:1. স্টাইলিশ ডিজাইন: স্টেইনলেস স্টিল নির্মা...",
    "category_slug": "watch",
    "categorySlug": "watch"
  },
  {
    "id": "40d571e7-0f9b-4a38-a139-7969dc7e45a8",
    "name": "S100 Ultra 9 Smart Watch with 7 Straps & Case",
    "slug": "s100-ultra-9-smart-watch-with-7-straps-case",
    "product_code": "ECOM-40d571e7",
    "sku": "ECOM-40d571e7",
    "category": "Watch",
    "category_name": "Watch",
    "category_slug": "watch",
    "categorySlug": "watch",
    "categoryName": "Watch",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/ee907bb9-58c0-490b-bc0d-14f6d0978eb2.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/ee907bb9-58c0-490b-bc0d-14f6d0978eb2.webp"
    ],
    "product_images": [
      {
        "id": "img-40d571e7-0f9b-4a38-a139-7969dc7e45a8-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/ee907bb9-58c0-490b-bc0d-14f6d0978eb2.webp",
        "is_primary": true
      }
    ],
    "price": 2150,
    "originalPrice": 2150,
    "regular_price": 2150,
    "rating": 4.7,
    "reviews": 26,
    "sold": 42,
    "stock": 50,
    "product_variants": [],
    "details": "S100 Ultra 9 Smart Watch with 7 Straps & Case",
    "description": "S100 Ultra 9 Smart Watch with 7 Straps & Case"
  },
  {
    "id": "29155d6e-9c3c-4ef0-8945-36db016ac6e1",
    "name": "Waterproof Creative LED Paper Wristband Watch",
    "slug": "waterproof-creative-led-paper-wristband-watch",
    "product_code": "ECOM-29155d6e",
    "sku": "ECOM-29155d6e",
    "category": "Watch",
    "category_name": "Watch",
    "category_slug": "watch",
    "categorySlug": "watch",
    "categoryName": "Watch",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/dc2d5b3c-fbb4-46eb-a9ce-e50a11346716.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/dc2d5b3c-fbb4-46eb-a9ce-e50a11346716.webp"
    ],
    "product_images": [
      {
        "id": "img-29155d6e-9c3c-4ef0-8945-36db016ac6e1-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/dc2d5b3c-fbb4-46eb-a9ce-e50a11346716.webp",
        "is_primary": true
      }
    ],
    "price": 890,
    "originalPrice": 890,
    "regular_price": 890,
    "rating": 4.7,
    "reviews": 16,
    "sold": 42,
    "stock": 50,
    "product_variants": [],
    "details": "Waterproof Creative LED Paper Wristband Watch",
    "description": "Waterproof Creative LED Paper Wristband Watch"
  },
  {
    "id": "89",
    "name": "Big Offer 3 pcs Combo Baby Oats & Free 250ML Honey",
    "slug": "big-offer-3-pcs-combo-baby-oats-free-250ml-honey-89",
    "product_code": "3089",
    "category": "Foods",
    "image": "https://mohasagor.com.bd/public/storage/images/products/LBvTowb66oifwnxne0MqymQdC044rddh6E5QRtrn.png",
    "images": [
      "https://mohasagor.com.bd/public/storage/images/products/LBvTowb66oifwnxne0MqymQdC044rddh6E5QRtrn.png",
      "https://mohasagor.com.bd/public/storage/images/products/J2yZxjOTSqeDOce2mAplIbPB64h2NJJ8xhIGzpyi.png",
      "https://mohasagor.com.bd/public/storage/images/products/3AL3z2k59bEXLvadftRtBy3OmFCB5gv8nRUBQzEM.png",
      "https://mohasagor.com.bd/public/storage/images/products/mJcttUYOdVUC3Q6GxjZz14LaW6bAuzyesSAgnqTs.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/gZIrg88pm29jklXBD6HZCmNNNbTQ75QordEkKBAI.jpg",
      "https://mohasagor.com.bd/public/storage/images/products/H7hxKGDBu7wnc85JXg9wUk0GDLsdeWoSwbir6WIJ.jpg"
    ],
    "product_images": [
      {
        "id": "img-0",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/LBvTowb66oifwnxne0MqymQdC044rddh6E5QRtrn.png",
        "is_primary": true,
        "sort_order": 0
      },
      {
        "id": "img-1",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/J2yZxjOTSqeDOce2mAplIbPB64h2NJJ8xhIGzpyi.png",
        "is_primary": false,
        "sort_order": 1
      },
      {
        "id": "img-2",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/3AL3z2k59bEXLvadftRtBy3OmFCB5gv8nRUBQzEM.png",
        "is_primary": false,
        "sort_order": 2
      },
      {
        "id": "img-3",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/mJcttUYOdVUC3Q6GxjZz14LaW6bAuzyesSAgnqTs.jpg",
        "is_primary": false,
        "sort_order": 3
      },
      {
        "id": "img-4",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/gZIrg88pm29jklXBD6HZCmNNNbTQ75QordEkKBAI.jpg",
        "is_primary": false,
        "sort_order": 4
      },
      {
        "id": "img-5",
        "image_url": "https://mohasagor.com.bd/public/storage/images/products/H7hxKGDBu7wnc85JXg9wUk0GDLsdeWoSwbir6WIJ.jpg",
        "is_primary": false,
        "sort_order": 5
      }
    ],
    "price": 990,
    "originalPrice": 1337,
    "regular_price": 1337,
    "rating": 4.8,
    "reviews": 29,
    "sold": 134,
    "stock": 1,
    "product_variants": [],
    "details": "🥣 সোনামণির প্রথম পুষ্টি আর পরিবারের সুস্বাস্থ্য—সবই মিলবে এক বাটিতে! ৩ পিস অর্গানিক ওটস কম্বোর সাথে মধু একদম ফ্রি! 🍯&nbsp;সোনামণির জন্য মায়ের দুধের ...",
    "description": "🥣 সোনামণির প্রথম পুষ্টি আর পরিবারের সুস্বাস্থ্য—সবই মিলবে এক বাটিতে! ৩ পিস অর্গানিক ওটস কম্বোর সাথে মধু একদম ফ্রি! 🍯&nbsp;সোনামণির জন্য মায়ের দুধের ...",
    "category_slug": "foods",
    "categorySlug": "foods"
  },
  {
    "id": "ce156298-592b-432d-89d9-49733d8a225b",
    "name": "USB Portable Mini Capsule Cutter & Food Processor",
    "slug": "usb-portable-mini-capsule-cutter-food-processor",
    "product_code": "ECOM-ce156298",
    "sku": "ECOM-ce156298",
    "category": "Foods",
    "category_name": "Foods",
    "category_slug": "foods",
    "categorySlug": "foods",
    "categoryName": "Foods",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/03bcd903-366b-4c56-b1bf-6cc5977c465f.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/03bcd903-366b-4c56-b1bf-6cc5977c465f.webp"
    ],
    "product_images": [
      {
        "id": "img-ce156298-592b-432d-89d9-49733d8a225b-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/03bcd903-366b-4c56-b1bf-6cc5977c465f.webp",
        "is_primary": true
      }
    ],
    "price": 750,
    "originalPrice": 750,
    "regular_price": 750,
    "rating": 4.7,
    "reviews": 21,
    "sold": 81,
    "stock": 50,
    "product_variants": [],
    "details": "USB Portable Mini Capsule Cutter & Food Processor",
    "description": "USB Portable Mini Capsule Cutter & Food Processor"
  },
  {
    "id": "7f7025ad-a122-4aa2-8189-9d944f9ae418",
    "name": "Silver Crest Premium Electric Food Grinder",
    "slug": "silver-crest-premium-electric-food-grinder",
    "product_code": "ECOM-7f7025ad",
    "sku": "ECOM-7f7025ad",
    "category": "Foods",
    "category_name": "Foods",
    "category_slug": "foods",
    "categorySlug": "foods",
    "categoryName": "Foods",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/6f5e5846-f1f6-4682-95e6-76f147cce7ff.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/6f5e5846-f1f6-4682-95e6-76f147cce7ff.webp"
    ],
    "product_images": [
      {
        "id": "img-7f7025ad-a122-4aa2-8189-9d944f9ae418-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/6f5e5846-f1f6-4682-95e6-76f147cce7ff.webp",
        "is_primary": true
      }
    ],
    "price": 1050,
    "originalPrice": 1050,
    "regular_price": 1050,
    "rating": 4.7,
    "reviews": 19,
    "sold": 31,
    "stock": 50,
    "product_variants": [],
    "details": "Silver Crest Premium Electric Food Grinder",
    "description": "Silver Crest Premium Electric Food Grinder"
  },
  {
    "id": "be6370c4-1816-4a5b-9d7f-e3596fc2f016",
    "name": "Milk Shake Original - Healthy Weight Management Drink",
    "slug": "milk-shake-original-healthy-weight-management-drink",
    "product_code": "ECOM-be6370c4",
    "sku": "ECOM-be6370c4",
    "category": "Foods",
    "category_name": "Foods",
    "category_slug": "foods",
    "categorySlug": "foods",
    "categoryName": "Foods",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/ea41f5c1-f818-44ff-9409-d15aad335d84.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/ea41f5c1-f818-44ff-9409-d15aad335d84.webp"
    ],
    "product_images": [
      {
        "id": "img-be6370c4-1816-4a5b-9d7f-e3596fc2f016-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/ea41f5c1-f818-44ff-9409-d15aad335d84.webp",
        "is_primary": true
      }
    ],
    "price": 490,
    "originalPrice": 490,
    "regular_price": 490,
    "rating": 4.7,
    "reviews": 18,
    "sold": 94,
    "stock": 50,
    "product_variants": [],
    "details": "Milk Shake Original - Healthy Weight Management Drink",
    "description": "Milk Shake Original - Healthy Weight Management Drink"
  },
  {
    "id": "523909a4-bd54-41d9-b25b-74fda406e880",
    "name": "Fairwave 32-Grid Silicone Honeycomb Ice Cube Tray",
    "slug": "fairwave-32-grid-silicone-honeycomb-ice-cube-tray",
    "product_code": "ECOM-523909a4",
    "sku": "ECOM-523909a4",
    "category": "Foods",
    "category_name": "Foods",
    "category_slug": "foods",
    "categorySlug": "foods",
    "categoryName": "Foods",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/f0a08bd4-16ea-4ea3-aba7-b3adcb906b1c.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/f0a08bd4-16ea-4ea3-aba7-b3adcb906b1c.webp"
    ],
    "product_images": [
      {
        "id": "img-523909a4-bd54-41d9-b25b-74fda406e880-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/f0a08bd4-16ea-4ea3-aba7-b3adcb906b1c.webp",
        "is_primary": true
      }
    ],
    "price": 450,
    "originalPrice": 450,
    "regular_price": 450,
    "rating": 4.7,
    "reviews": 22,
    "sold": 77,
    "stock": 50,
    "product_variants": [],
    "details": "Fairwave 32-Grid Silicone Honeycomb Ice Cube Tray",
    "description": "Fairwave 32-Grid Silicone Honeycomb Ice Cube Tray"
  },
  {
    "id": "90f1d7da-eb79-48f0-982c-2b137b3bef0a",
    "name": "Milk Shake Weight Gain Supplement",
    "slug": "milk-shake-weight-gain-supplement",
    "product_code": "ECOM-90f1d7da",
    "sku": "ECOM-90f1d7da",
    "category": "Foods",
    "category_name": "Foods",
    "category_slug": "foods",
    "categorySlug": "foods",
    "categoryName": "Foods",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/e0613094-f45f-4dc9-a738-e670d9815d7c.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/e0613094-f45f-4dc9-a738-e670d9815d7c.webp"
    ],
    "product_images": [
      {
        "id": "img-90f1d7da-eb79-48f0-982c-2b137b3bef0a-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/e0613094-f45f-4dc9-a738-e670d9815d7c.webp",
        "is_primary": true
      }
    ],
    "price": 490,
    "originalPrice": 490,
    "regular_price": 490,
    "rating": 4.7,
    "reviews": 22,
    "sold": 49,
    "stock": 50,
    "product_variants": [],
    "details": "Milk Shake Weight Gain Supplement",
    "description": "Milk Shake Weight Gain Supplement"
  },
  {
    "id": "7046f750-ad3e-4ac0-be42-879aeb1e2655",
    "name": "Nutrition Milk Natural Weight Gain Formula",
    "slug": "nutrition-milk-natural-weight-gain-formula",
    "product_code": "ECOM-7046f750",
    "sku": "ECOM-7046f750",
    "category": "Foods",
    "category_name": "Foods",
    "category_slug": "foods",
    "categorySlug": "foods",
    "categoryName": "Foods",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/6a224a11-aa1d-4899-9449-ae0a5b1d916b.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/6a224a11-aa1d-4899-9449-ae0a5b1d916b.webp"
    ],
    "product_images": [
      {
        "id": "img-7046f750-ad3e-4ac0-be42-879aeb1e2655-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/6a224a11-aa1d-4899-9449-ae0a5b1d916b.webp",
        "is_primary": true
      }
    ],
    "price": 150,
    "originalPrice": 150,
    "regular_price": 150,
    "rating": 4.7,
    "reviews": 20,
    "sold": 99,
    "stock": 50,
    "product_variants": [],
    "details": "Nutrition Milk Natural Weight Gain Formula",
    "description": "Nutrition Milk Natural Weight Gain Formula"
  },
  {
    "id": "d480aef8-150f-40e2-a72d-227170050215",
    "name": "Ice Roller for Face & Eye Puffiness Relief",
    "slug": "ice-roller-for-face-eye-puffiness-relief",
    "product_code": "ECOM-d480aef8",
    "sku": "ECOM-d480aef8",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/d59fe2b9-15ee-4499-8c64-d60669b37bb9.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/d59fe2b9-15ee-4499-8c64-d60669b37bb9.webp"
    ],
    "product_images": [
      {
        "id": "img-d480aef8-150f-40e2-a72d-227170050215-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/d59fe2b9-15ee-4499-8c64-d60669b37bb9.webp",
        "is_primary": true
      }
    ],
    "price": 390,
    "originalPrice": 390,
    "regular_price": 390,
    "rating": 4.7,
    "reviews": 14,
    "sold": 27,
    "stock": 50,
    "product_variants": [],
    "details": "Ice Roller for Face & Eye Puffiness Relief",
    "description": "Ice Roller for Face & Eye Puffiness Relief"
  },
  {
    "id": "058fd921-44c0-4421-9699-6d7809560427",
    "name": "3 in 1 EMS Face, Neck & Eye Massager",
    "slug": "3-in-1-ems-face-neck-eye-massager",
    "product_code": "ECOM-058fd921",
    "sku": "ECOM-058fd921",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/992d80c7-02fa-499c-9670-a168c3f4c68e.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/992d80c7-02fa-499c-9670-a168c3f4c68e.webp"
    ],
    "product_images": [
      {
        "id": "img-058fd921-44c0-4421-9699-6d7809560427-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/992d80c7-02fa-499c-9670-a168c3f4c68e.webp",
        "is_primary": true
      }
    ],
    "price": 750,
    "originalPrice": 750,
    "regular_price": 750,
    "rating": 4.7,
    "reviews": 20,
    "sold": 48,
    "stock": 50,
    "product_variants": [],
    "details": "3 in 1 EMS Face, Neck & Eye Massager",
    "description": "3 in 1 EMS Face, Neck & Eye Massager"
  },
  {
    "id": "8b21f60d-05d8-4232-b40c-c7cf588cf49f",
    "name": "Acupressure Foot Massager Slippers for Pain Relief",
    "slug": "acupressure-foot-massager-slippers-for-pain-relief",
    "product_code": "ECOM-8b21f60d",
    "sku": "ECOM-8b21f60d",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/9ee57657-a922-433b-877f-b7eb91192a17.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/9ee57657-a922-433b-877f-b7eb91192a17.webp"
    ],
    "product_images": [
      {
        "id": "img-8b21f60d-05d8-4232-b40c-c7cf588cf49f-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/9ee57657-a922-433b-877f-b7eb91192a17.webp",
        "is_primary": true
      }
    ],
    "price": 990,
    "originalPrice": 990,
    "regular_price": 990,
    "rating": 4.7,
    "reviews": 14,
    "sold": 38,
    "stock": 50,
    "product_variants": [],
    "details": "Acupressure Foot Massager Slippers for Pain Relief",
    "description": "Acupressure Foot Massager Slippers for Pain Relief"
  },
  {
    "id": "0242f387-a88d-4d37-a8e4-bb1def705f34",
    "name": "Electric Scalp Massager & Head Massage Set",
    "slug": "electric-scalp-massager-head-massage-set",
    "product_code": "ECOM-0242f387",
    "sku": "ECOM-0242f387",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/88e8eb0c-551c-42a5-8b2f-303c3641c6a9.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/88e8eb0c-551c-42a5-8b2f-303c3641c6a9.webp"
    ],
    "product_images": [
      {
        "id": "img-0242f387-a88d-4d37-a8e4-bb1def705f34-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/88e8eb0c-551c-42a5-8b2f-303c3641c6a9.webp",
        "is_primary": true
      }
    ],
    "price": 790,
    "originalPrice": 790,
    "regular_price": 790,
    "rating": 4.7,
    "reviews": 28,
    "sold": 47,
    "stock": 50,
    "product_variants": [],
    "details": "Electric Scalp Massager & Head Massage Set",
    "description": "Electric Scalp Massager & Head Massage Set"
  },
  {
    "id": "3b8ae982-01c9-4b45-b0be-5fff76cce2ef",
    "name": "Period Cramp Relief Belt – Portable Electric Menstrual Heating Pad with Massager",
    "slug": "period-cramp-relief-belt-portable-electric-menstrual-heating-pad-with-massager",
    "product_code": "ECOM-3b8ae982",
    "sku": "ECOM-3b8ae982",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/235b7ebd-a94f-4bdf-8697-e8ca3fd9350c.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/235b7ebd-a94f-4bdf-8697-e8ca3fd9350c.webp"
    ],
    "product_images": [
      {
        "id": "img-3b8ae982-01c9-4b45-b0be-5fff76cce2ef-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/235b7ebd-a94f-4bdf-8697-e8ca3fd9350c.webp",
        "is_primary": true
      }
    ],
    "price": 790,
    "originalPrice": 790,
    "regular_price": 790,
    "rating": 4.7,
    "reviews": 11,
    "sold": 97,
    "stock": 50,
    "product_variants": [],
    "details": "Period Cramp Relief Belt – Portable Electric Menstrual Heating Pad with Massager",
    "description": "Period Cramp Relief Belt – Portable Electric Menstrual Heating Pad with Massager"
  },
  {
    "id": "1f4b71ab-2fb6-4701-a2ef-46fce916c78c",
    "name": "Ahusoli Akusoil Magnetic Acupressure Insoles for Men and Women",
    "slug": "ahusoli-akusoil-magnetic-acupressure-insoles-for-men-and-women",
    "product_code": "ECOM-1f4b71ab",
    "sku": "ECOM-1f4b71ab",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/8d540750-f65b-4c97-9e46-afb3d73a0827.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/8d540750-f65b-4c97-9e46-afb3d73a0827.webp"
    ],
    "product_images": [
      {
        "id": "img-1f4b71ab-2fb6-4701-a2ef-46fce916c78c-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/8d540750-f65b-4c97-9e46-afb3d73a0827.webp",
        "is_primary": true
      }
    ],
    "price": 1290,
    "originalPrice": 1290,
    "regular_price": 1290,
    "rating": 4.7,
    "reviews": 25,
    "sold": 25,
    "stock": 50,
    "product_variants": [],
    "details": "Ahusoli Akusoil Magnetic Acupressure Insoles for Men and Women",
    "description": "Ahusoli Akusoil Magnetic Acupressure Insoles for Men and Women"
  },
  {
    "id": "e313627b-f3ee-4a3f-9f7a-5c3a42b572bb",
    "name": "TENS/EMS Mini Massager",
    "slug": "tens-ems-mini-massager",
    "product_code": "ECOM-e313627b",
    "sku": "ECOM-e313627b",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/206d25de-5496-4383-96d2-775b2c6caf7e.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/206d25de-5496-4383-96d2-775b2c6caf7e.webp"
    ],
    "product_images": [
      {
        "id": "img-e313627b-f3ee-4a3f-9f7a-5c3a42b572bb-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/206d25de-5496-4383-96d2-775b2c6caf7e.webp",
        "is_primary": true
      }
    ],
    "price": 790,
    "originalPrice": 790,
    "regular_price": 790,
    "rating": 4.7,
    "reviews": 14,
    "sold": 43,
    "stock": 50,
    "product_variants": [],
    "details": "TENS/EMS Mini Massager",
    "description": "TENS/EMS Mini Massager"
  },
  {
    "id": "6a3ca557-23fa-483d-b3c1-9a6a24b48b0f",
    "name": "EMS Electric Foot Massager Mat & Muscle Stimulator",
    "slug": "ems-electric-foot-massager-mat-muscle-stimulator",
    "product_code": "ECOM-6a3ca557",
    "sku": "ECOM-6a3ca557",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/cf9efacf-6543-4bee-94be-761901e73400.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/cf9efacf-6543-4bee-94be-761901e73400.webp"
    ],
    "product_images": [
      {
        "id": "img-6a3ca557-23fa-483d-b3c1-9a6a24b48b0f-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/cf9efacf-6543-4bee-94be-761901e73400.webp",
        "is_primary": true
      }
    ],
    "price": 590,
    "originalPrice": 590,
    "regular_price": 590,
    "rating": 4.7,
    "reviews": 15,
    "sold": 76,
    "stock": 50,
    "product_variants": [],
    "details": "EMS Electric Foot Massager Mat & Muscle Stimulator",
    "description": "EMS Electric Foot Massager Mat & Muscle Stimulator"
  },
  {
    "id": "64f0f757-acda-4ac0-ba45-f14dd3e9a555",
    "name": "Tens Units EMS Mini Massager for Pain Relief",
    "slug": "tens-units-ems-mini-massager-for-pain-relief",
    "product_code": "ECOM-64f0f757",
    "sku": "ECOM-64f0f757",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/22ee3ac7-b571-4252-9999-f55ff3493f87.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/22ee3ac7-b571-4252-9999-f55ff3493f87.webp"
    ],
    "product_images": [
      {
        "id": "img-64f0f757-acda-4ac0-ba45-f14dd3e9a555-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/22ee3ac7-b571-4252-9999-f55ff3493f87.webp",
        "is_primary": true
      }
    ],
    "price": 390,
    "originalPrice": 390,
    "regular_price": 390,
    "rating": 4.7,
    "reviews": 20,
    "sold": 21,
    "stock": 50,
    "product_variants": [],
    "details": "Tens Units EMS Mini Massager for Pain Relief",
    "description": "Tens Units EMS Mini Massager for Pain Relief"
  },
  {
    "id": "a0d20717-2739-43dc-ae4a-49fb86c7a6b2",
    "name": "Japanese Back Pain Relief Patches  7 pis ",
    "slug": "japanese-back-pain-relief-patches-7-pis",
    "product_code": "ECOM-a0d20717",
    "sku": "ECOM-a0d20717",
    "category": "Health & Beauty",
    "category_name": "Health & Beauty",
    "category_slug": "health-beauty",
    "categorySlug": "health-beauty",
    "categoryName": "Health & Beauty",
    "image": "https://ecomsellerbd.com/uploads/product-images/master/92deb09f-3474-4017-8bcf-9a2625c2e05f.webp",
    "images": [
      "https://ecomsellerbd.com/uploads/product-images/master/92deb09f-3474-4017-8bcf-9a2625c2e05f.webp"
    ],
    "product_images": [
      {
        "id": "img-a0d20717-2739-43dc-ae4a-49fb86c7a6b2-0",
        "image_url": "https://ecomsellerbd.com/uploads/product-images/master/92deb09f-3474-4017-8bcf-9a2625c2e05f.webp",
        "is_primary": true
      }
    ],
    "price": 487,
    "originalPrice": 487,
    "regular_price": 487,
    "rating": 4.7,
    "reviews": 27,
    "sold": 54,
    "stock": 50,
    "product_variants": [],
    "details": "Japanese Back Pain Relief Patches  7 pis ",
    "description": "Japanese Back Pain Relief Patches  7 pis "
  }
];
