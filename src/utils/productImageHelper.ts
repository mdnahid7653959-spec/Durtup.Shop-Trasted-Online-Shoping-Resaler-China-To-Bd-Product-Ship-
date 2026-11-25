// Smart Product Image Matcher & Resolver Utility
// Ensures every product displays a real, relevant image matching its name & category with ultra-fast Edge WebP CDN caching.

export const CATEGORY_IMAGES = {
  globe_showpiece: [
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&h=600&fit=crop", // 3D Rotating World Map Globe
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=600&fit=crop", // Eiffel Tower Metal Showpiece
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&h=600&fit=crop", // Metal Art Showpiece
  ],
  water_bottle: [
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop", // Fitness Gym Dumbbell Bottle
    "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop", // Large Capacity Sports Jug
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop", // Water Bottle
  ],
  shoe_rack: [
    "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=600&h=600&fit=crop", // Multi-tier Shoe Rack
    "https://images.unsplash.com/photo-1558997519-83ea9252def8?w=600&h=600&fit=crop", // Shoe Cabinet
  ],
  desk_lamp: [
    "https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=600&h=600&fit=crop", // Desk Reading Lamp with Organizer
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop", // Modern Table Lamp
  ],
  laptop_stand: [
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop", // Aluminum Adjustable Laptop Stand
    "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=600&h=600&fit=crop", // Foldable Notebook Riser
  ],
  electric_cooker: [
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop", // Mini Multi-Cooker Hot Pot
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=600&fit=crop", // Non-stick Electric Cooker
  ],
  mobile_phone: [
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&h=600&fit=crop", // Feature Phone
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop", // Classic Mobile Keypad Phone
  ],
  necklace_pendant: [
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop", // Gold Plated Pearl Necklace & Shita Haar
    "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=600&h=600&fit=crop", // Diamond Pendant Necklace
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop", // Royal Bridal Gold Necklace
  ],
  earrings: [
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop", // Butterfly / Drop Earrings
    "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&h=600&fit=crop", // Crystal Stud Earrings
  ],
  ring: [
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop", // Crystal / Diamond Ring
    "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop", // Gemstone Ring
  ],
  hair_straightener: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop", // Hair Straightener Comb & Brush
  ],
  screen_magnifier: [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=600&fit=crop", // 3D Screen Magnifier
  ],
  jewelry: [
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop", // Necklace & Pendant
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop", // Earrings
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop", // Crystal / Diamond Ring
    "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop", // Emerald / Gemstone Ring
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop", // Luxury Jewelry
  ],
  powerbank: [
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", // Power Bank
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop", // Fast Charger
    "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&h=600&fit=crop", // Type-C Cable
  ],
  speaker: [
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop", // Bluetooth Speaker
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop", // Portable Speaker
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=600&fit=crop", // Sound System
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop", // Multifunction Chopper / Kitchen
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=600&fit=crop", // Blender / Grinder
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&h=600&fit=crop", // Cooker / Kitchen Tool
  ],
  fan: [
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618941707248-1296541f5341?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&h=600&fit=crop",
  ],
  bags: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", // Backpack
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop", // Women's Handbag
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop", // Fashion Handbag
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop", // Leather Bag
  ],
  watch: [
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop", // Stainless Steel Watch
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop", // Men's Luxury Watch
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", // Classic Watch
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&h=600&fit=crop", // Black Chronograph Watch
  ],
  smartwatch: [
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop",
  ],
  panjabi: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
  ],
  pajama: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop",
  ],
  shirt: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&h=600&fit=crop", // Men's T-Shirt Ash/Grey
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=600&fit=crop", // Polo T-Shirt
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=600&fit=crop", // Casual Shirt
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop", // Casual Black Crewneck Tee
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=600&fit=crop", // Cotton Everyday T-Shirt
  ],
  women_fashion: [
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
  ],
  saree: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
  ],
  kurti: [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
  ],
  borka: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&h=600&fit=crop",
  ],
  trimmer: [
    "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop",
  ],
  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop", // Classic Over-Ear Studio Headphones
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop", // Wireless Over-Ear Headphone Silver
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=600&fit=crop", // Premium Bluetooth Headphone
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop", // Audio Headphone
  ],
  earbuds: [
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop", // TWS Wireless Earbuds Black
    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop", // White Bluetooth Earbuds
    "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&h=600&fit=crop", // Sports Wireless Earbuds
    "https://images.unsplash.com/photo-1590658006821-04f4008d5717?w=600&h=600&fit=crop", // LED Touch Screen Earbuds
    "https://images.unsplash.com/photo-1629367494173-c78a56567877?w=600&h=600&fit=crop", // Gaming ANC Earbuds
  ],
  keyboard: [
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&h=600&fit=crop",
  ],
  mouse: [
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop", // Sleek wireless optical mouse
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop", // Wireless ergonomic mouse
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=600&fit=crop", // Wireless optical mouse minimalist
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=600&fit=crop", // Modern ergonomic mouse
  ],
  home: [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop", // Salon styling & hair straightener
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop", // Hair & beauty care
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=600&fit=crop", // Hair styling
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop", // Hair brush & comb
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop", // Cosmetics
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop", // Hair care
  ],
  cleaning_tools: [
    "https://ecomsellerbd.com/uploads/product-images/master/7f1bd7da-39a3-49b3-b6c8-e19bb2398518.webp", // Spring Claw Grabber & Drain Cleaner
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/1af8aa2e-7f87-4456-9409-39801758b5e6.webp", // Drain Cleaner Spring Claw
    "https://ecomsellerbd.com/uploads/product-images/master/bc64cb23-4f6a-41dc-af13-0fd3acd128ed.webp", // Basin Unclogger Tool
    "https://ecomsellerbd.com/uploads/product-images/master/2f5971f9-6bf0-491b-a69c-d9bfa96648c1.webp", // Flexible Pipe Dredger
  ],
  hair_care: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1608248597359-009d1dfcb2d4?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/fd5eb9f3-907e-4e27-9fbe-36e657daa20c.webp", // EELHOE Germinal Hair Growth Oil
    "https://ecomsellerbd.com/uploads/product-images/master/a7e0dde9-2cfa-4a33-b597-7008523cd527.webp", // Herbchic Hair Essence
  ],
  pure_foods: [
    "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&h=600&fit=crop", // Pure Natural Honey Jar
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=600&fit=crop", // Organic Food Spices & Nuts
    "https://images.unsplash.com/photo-1471943311424-646960669fbc?w=600&h=600&fit=crop", // Raw Honeycomb & Organic Honey
  ],
  kids: [
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=600&fit=crop", // Kids Toys
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=600&fit=crop", // Baby Toys
  ],
  tools: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&h=600&fit=crop",
  ],
  jersey: [
    "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1580087433295-ab2600c1030e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop",
  ],
  cctv: [
    "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=600&fit=crop", // Smart Security Camera
    "https://images.unsplash.com/photo-1549109926-58f039549485?w=600&h=600&fit=crop", // Wireless CCTV
    "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
    "https://img.drz.lazcdn.com/g/kf/Sec2b1daa39534496942b05d978d99040g.jpg_720x720q80.jpg",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop",
  ],
  sunglasses: [
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop",
  ],
  siphon_pump: [
    "https://ecomsellerbd.com/uploads/product-images/master/3d682161-b529-4e11-8bcc-482a8a780e02.webp",
    "https://ecomsellerbd.com/uploads/product-images/master/29b8c55c-2cf2-48aa-8082-be778be87584.webp",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop",
  ],
  massager: [
    "https://ecomsellerbd.com/uploads/product-images/master/22ee3ac7-b571-4252-9999-f55ff3493f87.webp",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&h=600&fit=crop",
  ],
  laser_pointer: [
    "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/531d0175-d3fe-4bfa-99ef-0d7cb3b36cc5.webp",
  ],
  iron_steamer: [
    "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/18386270-f405-4a15-9e06-5706d56c30c9.webp",
  ],
  knife_sharpener: [
    "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=600&h=600&fit=crop",
  ],
  bag_sealer: [
    "/products/mini_bag_sealer_1.webp",
    "/products/mini_bag_sealer_2.webp",
    "/products/mini_bag_sealer_3.webp",
    "/products/mini_bag_sealer_4.webp",
  ],
  neckband: [
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/9ee3d720-1058-4339-a311-3bc39d62bae9.webp",
  ],
  phone_holder: [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=600&fit=crop", // Modern gadget desk phone stand
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&h=600&fit=crop", // Clean mobile dock stand
  ],
  tripod: [
    "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&h=600&fit=crop", // Camera & Phone Tripod Stand
    "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=600&h=600&fit=crop", // Professional Vlogging Tripod
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop", // Extendable Selfie Stick Tripod
  ],
  hoodie: [
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=600&fit=crop", // Cozy Winter Hoodie
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop", // Winter Pullover Hoodie
  ],
  kids_fashion: [
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=600&fit=crop", // Kids Colorful T-Shirt
    "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&h=600&fit=crop", // Kids Fun Graphic Tee
    "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&h=600&fit=crop", // Children's Casual Wear
    "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&h=600&fit=crop", // Kids Summer Wear
  ],
  stove_cooking: [
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/15c6612f-54b6-493f-86f3-f4cc07264465.webp",
  ],
  juicer_blender: [
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/ed722608-e540-49cd-8071-910cbb038655.webp",
  ],
  lantern_torch: [
    "https://images.unsplash.com/photo-1508873696983-2df57046475a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/03e4c2c0-f1b8-4b73-b898-00052116e016.webp",
  ],
  skincare_health: [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1608248597359-009d1dfcb2d4?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/92deb09f-3474-4017-8bcf-9a2625c2e05f.webp",
  ],
  shake_nutrition: [
    "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&h=600&fit=crop",
    "https://ecomsellerbd.com/uploads/product-images/master/ea41f5c1-f818-44ff-9409-d15aad335d84.webp",
  ],
  stationery: [
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&h=600&fit=crop",
  ],
  toy_car: [
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&h=600&fit=crop",
  ],
  toys: [
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop",
  ],
  raincoat: [
    "https://images.unsplash.com/photo-1515664069368-8097d76cbfa7?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=600&fit=crop",
  ],
  auto_accessories: [
    "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop",
  ],
};

// Known Unsplash generic fallback patterns that were previously assigned in random places
const GENERIC_GADGET_FALLBACKS = [
  "photo-1509967419530", // Woman portrait mistakenly in hoodie
  "photo-1512436991641", // Peach / generic placeholder
  "photo-1590658268037",
  "photo-1546868871",
  "photo-1609091839311",
  "photo-1618384887929",
  "photo-1585386959984",
  "photo-1560472355",
  "photo-1523275335684",
  "photo-1507582020474",
  "photo-1596755094514",
];

export function isDeadSupplierOrigin(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {}
  return (
    KNOWN_DEAD_ORIGIN_URLS.has(url) ||
    KNOWN_DEAD_ORIGIN_URLS.has(decoded) ||
    globalFailedImageUrls.has(url) ||
    globalFailedImageUrls.has(decoded)
  );
}

/**
 * Converts heavy raw supplier images to ultra-fast, edge-cached WebP CDN images via Cloudflare/wsrv.nl
 * Supabase storage images and Unsplash images are already on fast CDNs and are delivered directly.
 */
export function optimizeImageUrl(
  url?: string,
  width: number = 400,
  quality: number = 78,
  format: "webp" | "avif" = "webp"
): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!trimmed || isDeadSupplierOrigin(trimmed)) return "";

  // Normalize mohasagor domain
  if (trimmed.includes("mohasagor.com/") && !trimmed.includes("mohasagor.com.bd/")) {
    trimmed = trimmed.replace("mohasagor.com/", "mohasagor.com.bd/");
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.includes(".svg")) {
    return trimmed;
  }

  // Cloudinary images already have CDN acceleration
  if (trimmed.includes("res.cloudinary.com")) {
    return trimmed;
  }

  // If already a wsrv.nl proxy URL, extract raw origin to re-apply target width/format cleanly
  if (trimmed.includes("wsrv.nl/?url=") || trimmed.includes("wsrv.nl?url=")) {
    const rawDirect = getDirectImageUrl(trimmed);
    if (rawDirect && rawDirect !== trimmed) {
      trimmed = rawDirect;
      if (trimmed.includes("res.cloudinary.com")) {
        return trimmed;
      }
      if (trimmed.includes("mohasagor.com.bd") || trimmed.includes("ecomsellerbd.com") || trimmed.includes("supabase.co/storage")) {
        return optimizeImageUrl(trimmed, width, quality, format);
      }
    }
  }

  // Unsplash images - use native high-speed dynamic CDN parameters
  if (trimmed.includes("images.unsplash.com")) {
    const clean = trimmed.split("?")[0];
    return `${clean}?w=${width}&q=${quality}&auto=format&fit=crop`;
  }

  let full = trimmed;
  if (full.startsWith("//")) {
    full = `https:${full}`;
  } else if (full.startsWith("http://")) {
    full = full.replace(/^http:\/\//i, "https://");
  } else if (full.startsWith("/uploads/") || full.startsWith("uploads/")) {
    const p = full.startsWith("/") ? full : `/${full}`;
    full = `https://ecomsellerbd.com${p}`;
  } else if (full.startsWith("/public/storage/") || full.startsWith("public/storage/") || full.startsWith("/storage/") || full.startsWith("storage/")) {
    const p = full.startsWith("/") ? full : `/${full}`;
    full = `https://mohasagor.com.bd${p}`;
  }

  // Mohasagor images - serve direct origin (wsrv.nl encounters ORB block on mohasagor origins)
  if (full.includes("mohasagor.com.bd")) {
    return full;
  }

  // Ecomseller images are already optimized WebP - serve direct with zero proxy latency
  if (full.includes("ecomsellerbd.com")) {
    return full;
  }

  // Convert other raw supplier images to ultra-lightweight WebP via Cloudflare Edge Cache (wsrv.nl)
  if (full.startsWith("http://") || full.startsWith("https://")) {
    const cleanSource = full.split("#")[0];
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanSource)}&w=${width}&output=${format}&q=${quality}&we=0&fit=cover`;
  }

  return trimmed;
}

/**
 * Returns raw unproxied URL (direct supplier origin link)
 */
export function getDirectImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (isDeadSupplierOrigin(trimmed)) return "";
  if (trimmed.includes("wsrv.nl/?url=") || trimmed.includes("wsrv.nl?url=")) {
    try {
      const parsed = new URL(trimmed);
      const raw = parsed.searchParams.get("url");
      if (raw) trimmed = raw;
    } catch { }

    try {
      const match = trimmed.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        trimmed = decodeURIComponent(match[1]);
      }
    } catch { }
  }

  if (isDeadSupplierOrigin(trimmed)) return "";

  // Automatically heal legacy or dead Supabase storage URLs to live high-speed master WebP
  if (trimmed.includes("supabase.co") && trimmed.includes("product-images/master/")) {
    const match = trimmed.match(/product-images\/master\/([a-zA-Z0-9\-\_]+(?:\.webp|\.jpg|\.png|\.jpeg|\.gif)?)/);
    if (match && match[1]) {
      const fn = match[1].endsWith(".webp") ? match[1] : `${match[1]}.webp`;
      trimmed = `https://ecomsellerbd.com/uploads/product-images/master/${fn}`;
    }
  }

  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  } else if (trimmed.startsWith("http://")) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  } else if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    trimmed = `https://ecomsellerbd.com${p}`;
  } else if (trimmed.startsWith("/public/storage/") || trimmed.startsWith("public/storage/") || trimmed.startsWith("/storage/") || trimmed.startsWith("storage/")) {
    const p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    trimmed = `https://mohasagor.com.bd${p}`;
  }

  if (trimmed.includes("mohasagor.com/") && !trimmed.includes("mohasagor.com.bd/")) {
    trimmed = trimmed.replace("mohasagor.com/", "mohasagor.com.bd/");
  }

  return trimmed;
}

/**
 * Generates responsive srcset string for any image URL
 */
export function getResponsiveImageSrcSet(
  url?: string,
  widths: number[] = [240, 360, 480, 640],
  quality: number = 75,
  format: "webp" | "avif" = "webp"
): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.includes(".svg") ||
    (trimmed.includes("supabase.co") && !trimmed.includes("wsrv.nl"))
  ) {
    return "";
  }
  if (trimmed.includes("images.unsplash.com")) {
    const clean = trimmed.split("?")[0];
    return widths
      .map((w) => `${clean}?w=${w}&q=${quality}&auto=format&fit=crop ${w}w`)
      .join(", ");
  }
  return widths
    .map((w) => `${optimizeImageUrl(trimmed, w, quality, format)} ${w}w`)
    .join(", ");
}

export const PRODUCT_CARD_SIZES = "(max-width: 640px) 48vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 240px";
export const MINI_CARD_SIZES = "(max-width: 640px) 140px, (max-width: 1024px) 160px, 185px";
export const PRODUCT_DETAIL_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px";

export function detectCategoryKey(name: any = "", category: any = ""): keyof typeof CATEGORY_IMAGES | null {
  // Normalize mathematical alphanumeric symbols, accented glyphs & unicode fonts to plain ASCII
  const strName = typeof name === "string" ? name : String(name || "");
  const strCat = typeof category === "string" ? category : String(category || "");
  const normName = (strName || "").normalize ? strName.normalize("NFKD") : strName;
  const normCat = (strCat || "").normalize ? strCat.normalize("NFKD") : strCat;
  const nameText = normName.toLowerCase();
  const catText = normCat.toLowerCase();
  // Strip noisy multi-word categories like "mouse & cameras" so they don't corrupt product matching
  const safeCat = catText.replace(/mouse\s*(&|and)?\s*cameras?/gi, "gadgets");
  const combined = `${nameText} ${safeCat}`;

  // 0.1 Feature Phone / Mobile Phone with Loudspeaker or Multi-SIM (MUST check before generic speaker!)
  if (combined.match(/four.*sim|mobile.*four|dual.*antina|feature.*phone|button.*phone|mb3031|মোবাইল.*ফোন|বাটন.*ফোন/i)) {
    return "mobile_phone";
  }

  // 0.2 3D Screen Magnifier / Mobile Video Amplifier
  if (combined.match(/screen.*amplifier|video.*amplifier|magnifier|amplif.*3d|স্ক্রিন.*ম্যাগনিফায়ার/i)) {
    return "screen_magnifier";
  }

  // 0.3 World Map 3D Globe & Eiffel Tower Metal Showpiece
  if (combined.match(/globe|world.*map|eiffel.*tower|showpiece|show.*piece|metal.*showpiece|decoration.*gift|rotating.*glove/i)) {
    return "globe_showpiece";
  }

  // 0.4 Dumbbell & Gym Sports Water Bottles
  if (combined.match(/water.*bottle|dumbbell.*bottle|bottle.*2\.8l|dumbbell.*shape|sport.*bottle|water.*jug|পানির.*বোতল|বোতল/i)) {
    return "water_bottle";
  }

  // 0.5 Detachable Shoe Racks & Shoe Cabinets
  if (combined.match(/shoe.*rack|shoe.*cabinet|shoe.*shelf|জুতার.*রেক|সু.*রেক/i)) {
    return "shoe_rack";
  }

  // 0.6 Desk Lamps & Pen Holder Study Lights
  if (combined.match(/pen.*holder|desk.*lamp|table.*lamp|reading.*lamp|study.*lamp|yg-8044f|টেবিল.*ল্যাম্প/i)) {
    return "desk_lamp";
  }

  // 0.7 Laptop Stands & Foldable Notebook Risers
  if (combined.match(/laptop.*stand|notebook.*stand|folding.*notebook|aluminum.*alloy.*adjustable/i)) {
    return "laptop_stand";
  }

  // 0.8 Electric Cooking Pots, Non-Stick Hot Pot & Mini Multi-Cooker Panci
  if (combined.match(/electric.*pot|cooking.*pot|panci|mini.*pot|non-stick.*pot|hot.*pot|ইলেকট্রিক.*পট/i)) {
    return "electric_cooker";
  }

  // 0.9 Hair Straighteners & Styling Combs
  if (combined.match(/straightener|styling.*comb|hair.*straight|হেয়ার.*স্ট্রেইট/i)) {
    return "hair_straightener";
  }

  // 0.10 Necklaces, Pendants, Chains, Shita Haar (must check before generic jewelry/ring!)
  if (combined.match(/necklace|pendant|shita.*haar| haar|chain|লকেট|নেকলেস|সীতাহার|হার/i)) {
    return "necklace_pendant";
  }

  // 0.11 Earrings & Jhumka (must check before ring!)
  if (combined.match(/earring|ear.*ring|jhumka|nose.*pin|দুল|ঝুমকা|নাকফুল/i)) {
    return "earrings";
  }

  // 0.12 Rings (must exclude earrings/nose pins/key rings)
  if (combined.match(/ring|আংটি/i) && !combined.match(/ear.*ring|key.*ring|nose.*pin|earring/i)) {
    return "ring";
  }

  // 1. Siphon fuel & liquid transfer pumps (Must check before fan!)
  if (combined.match(/siphon|fuel.*pump|oil.*pump|liquid.*pump|transfer.*pump|pipe.*set|লিকুইড.*পাম্প|ফুয়েল.*পাম্প/i)) {
    return "siphon_pump";
  }

  // 2. Massagers & EMS pain relief (Tens Units, body massagers, neck stretchers)
  if (combined.match(/massag|ems.*mini|tens\s*units?|pulse.*massag|body.*massag|neck.*massag|stretcher|বডি.*ম্যাসাজ|ম্যাসাজার/i)) {
    return "massager";
  }

  // 3. Laser Pointers & Laser Lights (Rechargeable pointer, laser beam)
  if (combined.match(/laser.*pointer|laser.*light|laser.*pen|green.*laser|red.*laser|লেজার/i)) {
    return "laser_pointer";
  }

  // 4. Steamer Iron & Garment Steamers (Must check before generic kitchen!)
  if (combined.match(/steamer\s*iron|iron.*machine|handheld.*steamer|garment.*steamer|steam.*brush|electric.*iron|ইস্ত্রি/i)) {
    return "iron_steamer";
  }

  // 5. Knife Sharpeners (Must check before generic kitchen!)
  if (combined.match(/knife.*sharpener|blade.*sharpener|sharpener.*stone|ধারালো|ছুরি.*ধার/i)) {
    return "knife_sharpener";
  }

  // 5.5 Tripods, Selfie Sticks & Monopods (Must check before generic phone holder!)
  if (combined.match(/tripod|selfie.*stick|handheld.*stick|monopod|vlogging.*stick|ট্রাইপড|সেলফি/i)) {
    return "tripod";
  }

  // 5.8 Drain Cleaners, Spring Claw Grabbers, Basin Uncloggers (Check before generic home/tools)
  if (combined.match(/drain.*clean|basin.*clean|spring.*claw|grabber|pipe.*dredg|clog.*clean|sink.*clean|ড্রেন.*ক্লিনার|বেসিন.*ক্লিনার/i)) {
    return "cleaning_tools";
  }

  // 6. Phone Holders, Stands, Lazy Neck & Tripods (Must check before earbuds/electronics!)
  if (combined.match(/phone.*holder|mobile.*holder|lazy.*neck|neck.*holder|table.*stand|phone.*stand|desk.*stand|mobile.*mount|car.*mount|স্ট্যান্ড/i)) {
    return "phone_holder";
  }

  // 7. Gas Stoves, Camping Stoves, Sandwich Makers
  if (combined.match(/gas.*stove|camping.*stove|foldable.*stove|sandwich.*maker|waffle.*maker|stove|চুলা/i)) {
    return "stove_cooking";
  }

  // 8. Portable Crusher Juicers & Mini Blenders
  if (combined.match(/crusher.*juicer|portable.*juicer|usb.*blender|crusher|জুসার/i)) {
    return "juicer_blender";
  }

  // 9. Camping Lanterns, Emergency LED Lights & Torches
  if (combined.match(/camping.*lantern|led.*lantern|torch.*light|flashlight|emergency.*light|টর্চ|হারিকেন|zoom.*light/i)) {
    return "lantern_torch";
  }

  // 10. Pain Relief Patches, Wart, Mole & Skin Tag Removers
  if (combined.match(/pain.*relief|relief.*patch|back.*pain|wart.*remover|mole.*remover|skin.*tag|হাঁটু.*ব্যথা|মলম|প্যাচ/i)) {
    return "skincare_health";
  }

  // 11. Milk Shake & Weight Gain Supplements
  if (combined.match(/milk\s*shake|weight\s*gain|supplement|protein\s*powder|nutrition/i)) {
    return "shake_nutrition";
  }

  // 12. Wireless Neckbands (Check before TWS earbuds!)
  if (!nameText.match(/cctv|camera/i) && combined.match(/neckband|wireless.*neck|bluetooth.*neck|he05|frb/i)) {
    return "neckband";
  }

  // 13. Sunglasses, Eyeglasses, Spectacles, Clear glass frames (Must check product name first!)
  if (nameText.match(/sunglass|eyeglass|spectacle|clear.*glass|frame.*glass|reading.*glass|glasses|sunglasses|eyewear|goggles|goggle|shades|chasma|চশমা|সানগ্লাস/i)) {
    return "sunglasses";
  }

  // 14. Jewelry, rings, necklace, crystal ring, gemstones, zircon, ornaments
  // Exclude ring light, key ring, phone ring, etc.
  if (!nameText.match(/ring.*light|key.*ring|phone.*ring|holder.*ring|curtain.*ring|rubber.*ring/i) &&
    combined.match(/ring|jewelry|jewel|necklace|chain|pendant|bracelet|bangle|earring|zircon|crystal.*ring|gemstone|diamond|emerald|eternity.*ring|stone.*ring|gold|silver|ornament|আংটি|জুয়েলারি|নেকলেস|চেইন|দুল|গহনা|চুড়ি|ব্রেসলেট/i)) {
    return "jewelry";
  }

  // 15. CCTV, Security Cameras, IP Cameras, Bulb Cameras, Spy Cameras (Must check before earbuds/keyboard!)
  if (combined.match(/cctv|ip\s*camera|security\s*camera|bulb\s*camera|night\s*vision.*camera|v380|a9\s*wi-?fi|ptz|surveillance|nanny\s*cam|spy\s*cam|spy.*camera|ডোম\s*ক্যামেরা|সিসিটিভি|সিকিউরিটি\s*ক্যামেরা/i) ||
    (nameText.match(/camera|cam\b|ক্যামেরা/i) && !nameText.match(/stand|holder|tripod|mount|strap|bag|case/i))) {
    return "cctv";
  }

  // 15.5 Over-ear and on-ear headphones
  if (!nameText.match(/cctv|camera|cam\b|speaker|mic/i) &&
    combined.match(/over-ear|on-ear|studio.*headphone|headset|at8|at7|h200|gaming.*headset|rapoo.*headphone/i)) {
    return "headphones";
  }

  // 16. Earbuds, headphones, airpods, headsets, wireless audio (must exclude cameras, speakers & mic)
  if (!nameText.match(/cctv|camera|cam\b|ক্যামেরা|speaker|স্পিকার|mic\b|microphone|মাইক্রোফোন|bulb/i) &&
    combined.match(/earbud|airpod|headphone|earphone|headset|wireless.*ear|bluetooth.*ear|tws|pro.*4|m10|f9|anc.*ear|হেডফোন|ইয়ারবাড|ইয়ারফোন/i)) {
    return "earbuds";
  }

  // 17. Power bank, fast charging, chargers, cables
  if (combined.match(/power.*bank|powerbank|charger|fast.*charg|cable|type-c|adapter|pd\s*\d+|10000mah|20000mah|পাওয়ার.*ব্যাংক|চার্জার|ক্যাবল/i) && !combined.match(/earbud|airpod|tws|headphone|earphone/i)) {
    return "powerbank";
  }

  // 18. Speakers, Bluetooth audio, FM radio, sound system, soundbar
  if (combined.match(/speaker|sound.*system|soundbar|fm.*radio|bluetooth.*speaker|audio.*bass|extra.*bass|hi-fi|স্পিকার|সাউন্ড/i)) {
    return "speaker";
  }

  // 19. Kitchen, cooking, chopper, vegetable cutter, blender, grinder, mixer, hot pot, air fryer, cleaver knife, spice box, dish rack
  if (combined.match(/cook|kitchen|chopper|cutter|slicer|blender|grinder|hot.*pot|fryer|kettle|knife|cleaver|steamer|spice.*box|dish.*rack|food.*storage|fridge.*box|seasoning|oil.*bottle|oil.*dispenser|রান্না|ব্লেন্ডার|কুকার|চপার|ছুরি/i)) {
    return "kitchen";
  }

  // 20. Fan, cooling, humidifier, spray fan, mist fan (pumps removed!)
  if (combined.match(/fan|humidifier|diffuser|spray.*fan|mist.*fan|cooling|wind|cooler|ফ্যান|হিউমিডিফায়ার/i)) {
    return "fan";
  }

  // 21. Bags, backpack, handbag, travel bag, wallet, purse
  if (combined.match(/bag|backpack|wallet|purse|handbag|travel.*bag|crossbody|ব্যাগ|মানিব্যাগ|পার্স|ব্যাকপ্যাক/i)) {
    return "bags";
  }

  // 22. Shoes, sneakers, loafers, boots, footwear, sandals
  if (combined.match(/shoe|sneaker|footwear|sandal|boot|loafer|slipper|জুতা|স্যান্ডেল|স্নিকার্স/i)) {
    return "shoes";
  }

  // 23. Smartwatch, fitness tracker, smart band
  if (combined.match(/smart.*watch|fitness.*watch|apple.*watch|ultra.*watch|t800|t900|d20|hw8|hw9|fitness.*band|smart.*band|স্মার্ট.*ওয়াচ|স্মার্ট.*ঘড়ি/i)) {
    return "smartwatch";
  }

  // 24. Watches (analog, quartz, luxury, stainless steel wrist watch)
  if (combined.match(/watch|clock|wrist|oliya|olevs|skmei|binbond|curren|naviforce|casio|quartz|chronograph|dial|stainless.*steel.*watch|analog|ঘড়ি|হাতঘড়ি/i)) {
    return "watch";
  }

  // 25. Trimmers, shavers, clippers, grooming
  if (combined.match(/trimmer|clipper|shaver|grooming|hair.*beard|beard|at-1210|htc|vintage.*t9|kemei|vgr|nova|shaving|hair.*cut|ট্রিমার|শেভার|দাড়ি/i)) {
    return "trimmer";
  }

  // 26. Jersey, sports, fitness wear
  if (combined.match(/jersey|football|soccer|cricket|sports|athlete|gym|workout|brazil|argentina|messi|neymar|ronaldo|জার্সি|ফুটবল|ক্রিকেট/i)) {
    return "jersey";
  }

  // 27. Panjabi, kabli, kurta
  if (combined.match(/panjabi|punjabi|katua|kabli|kurta|পাঞ্জাবি|পাঞ্জাবী|কাবলি/i)) {
    return "panjabi";
  }

  // 28. Pajama, trousers, pants
  if (combined.match(/pajama|pyjama|trouser|pant|salwar|পায়জামা|পাজামা|প্যান্ট/i)) {
    return "pajama";
  }

  // 29. Saree, lehenga
  if (combined.match(/saree|sharee|lehenga|georgette|শাড়ি|লেহেঙ্গা|জর্জেট/i)) {
    return "saree";
  }

  // 30. Abaya, Borka, Burqa, Hijab, Khimar (Modest Islamic Wear)
  if (combined.match(/abaya|borkha|borka|burqa|khimar|hijab|বোরকা|বোরখা|আবায়া|হিজাব|খিমার/i)) {
    return "borka";
  }

  // 31. Kurti, kameez, three piece
  if (combined.match(/kurti|kameez|three.*piece|ladies|কামিজ|কটি|কুর্তি|থ্রি.*পিস/i)) {
    return "kurti";
  }

  // 31.4 Hair Care, Hair Oil, Hair Fall Control, Hair Serum, Scalp Treatment (Must check before clothing & food!)
  if (
    combined.match(/hair.*oil|hair.*serum|hair.*tonic|hair.*growth|hair.*fall|hair.*care|hair.*treatment|scalp|হেয়ার.*অয়েল|চুলের.*তেল|আমলা|কালোকেশী|nanotech/i) ||
    (nameText.match(/\bhair\b/i) && !nameText.match(/trimmer|clipper|shaver|dryer|comb|straightener|remover|curler|drain|iron|towel|flower|gajra/i))
  ) {
    return "hair_care";
  }

  // 31.5 Kids Clothing & Kids T-Shirts (Must check before adult shirts!)
  if (combined.match(/kid|baby|child|বাচ্চা|bambi|hulk|spiderman/i) && combined.match(/shirt|t-shirt|tshirt|tee|cloth|dress|wear|frock|টি-শার্ট|পোশাক/i)) {
    return "kids_fashion";
  }

  // 31.6 Hoodies & Winter Pullovers
  if (combined.match(/hoodie|sweatshirt|sweater|হুডি/i)) {
    return "hoodie";
  }

  // 32. Shirts, t-shirts, polo, jackets (strictly non-kids, strictly non-cosmetic, exclude women's!)
  if (
    !combined.match(/kid|baby|child|বাচ্চা|bambi|hair|oil|perfume|serum|cream|shampoo/i) &&
    (combined.match(/\bshirt\b|\bt-shirt\b|\btshirt\b|\bpolo\b|\bjacket\b|\bsuit\b|\bcombo.*shirt\b|\bdenim\b|\bjeans\b|টি-শার্ট|টি\s*শার্ট|শার্ট|পোলো|পোশাক/i) ||
     (combined.match(/\bmen's\b|\bmens\b|\bmenswear\b|\bmen's\s*wear\b/i) && !combined.match(/\bwomen/i) && combined.match(/cloth|wear|sleeve|fashion/i)))
  ) {
    return "shirt";
  }

  // 33. Beauty, hair straightener, hair comb, hair dryer, curler, hair brush, perfume, cosmetics, skincare
  if (nameText.match(/comb\b|straightener|straight.*hair|hair.*straight|hair.*comb|hair.*brush|curler|hair.*dryer|hair.*iron|hair.*styler|চিরুনি|স্ট্রেইটনার/i) ||
    combined.match(/perfume|attar|body.*spray|fragrance|lotion|cream|serum|shampoo|face.*wash|skin.*care|lipstick|makeup|shaper|belt.*body|corset|আতর|পারফিউম|লোশন|ক্রিম|লিপস্টিক|মেকআপ/i)) {
    return "beauty";
  }

  // 34. Pure foods, organic, honey, ghee, edible cooking oil, tea
  if (
    (combined.match(/honey|ghee|mustard\s*oil|cooking\s*oil|olive\s*oil|edible\s*oil|chia|organic\s*food|\btea\b|khejur|dates|বাদাম|মধু|ঘি|সরিষার\s*তেল|খাবার\b|কালোজিরা/i) ||
     (combined.match(/\bfoods?\b/i) && !combined.match(/processor|chopper|cutter|scale|grater|cover|storage|container|masher|maker|box|cleaner/i))) &&
    !combined.match(/hair|beard|massage|skin|face|body|strainer|dispenser|pot|fryer|cleaner|paronychia|pastel/i)
  ) {
    return "pure_foods";
  }

  // 35. Stationery & School items (Pencil Box, Magic Pencil Box, Pen, Notebook)
  if (combined.match(/pencil|pencil.*box|magic.*pencil|geometry|pen\b|notebook|stationery|color.*pencil|খাতা|পেন্সিল|জ্যামিতি/i)) {
    return "stationery";
  }

  // 36. Toy Cars & Remote Vehicles
  if (combined.match(/car.*toy|toy.*car|police.*car|rc.*car|racing.*car|car.*for.*kids|monster.*truck|টয়.*কার|খেলনা.*গাড়ি/i)) {
    return "toy_car";
  }

  // 37. Kids toys, robots, climbing toys, baby items
  if (combined.match(/toy|kid|baby|doll|robot|dancing|climbing|duck|cactus|game|board.*activity|puzzle|water.*gun|pop.*it|bubble|খেলনা|বাচ্চা|পুতুল/i)) {
    return "toys";
  }

  // 38. Raincoat & Monsoon Wear
  if (combined.match(/raincoat|rain.*coat|umbrella|রেইনকোট|ছাতা/i)) {
    return "raincoat";
  }

  // 39. Auto Accessories & Glass Repair
  if (combined.match(/glass.*repair|windshield|crack.*repair|resin|car.*clean|car.*wash|car.*pol|গ্লাস.*রিপেয়ার/i)) {
    return "auto_accessories";
  }

  // 36. Mouse (specific check before keyboard/general tech)
  if (nameText.match(/\bmouse\b|gaming.*mouse|wireless.*mouse|optical.*mouse|মাউস/i) && !nameText.match(/trap|pad|mouse\s*pad/i)) {
    return "mouse";
  }

  // 37. Keyboard, computer, tech
  // CRITICAL: Must be in product NAME (not from "Gadgets, Mouse & Cameras" category!)
  if (nameText.match(/\bkeyboard\b|\bkeypad\b|কিবোর্ড/i)) {
    return "keyboard";
  }
  if (nameText.match(/\b(laptop|desktop|gaming\s*pc)\b|ল্যাপটপ|কম্পিউটার/i) && !nameText.match(/stand|cooler|bag|case/i)) {
    return "keyboard";
  }

  // 38. Tools, hardware, repair
  if (combined.match(/screwdriver|soldering|iron|solder|drill|tool|hardware|wrench|hammer|plier|screw|repair.*kit|machine|saw|socket|ড্রিল|স্ক্রু|টুলস/i)) {
    return "tools";
  }

  // 39. General electronics & gadgets
  if (combined.match(/lens|tripod|ring.*light|mic|microphone|projector|gadget|electronic|মাইক্রোফোন/i)) {
    return "electronics";
  }

  // 40. Bag Sealer & Heat Sealer
  if (combined.match(/bag.*sealer|heat.*sealer|sealer.*cutter|মিনি.*সিলার|ব্যাগ.*সিলার|হ্যান্ডহেল্ড.*সিলার/i)) {
    return "bag_sealer";
  }

  // 41. Home & living
  if (combined.match(/\b(home\s*(decor|appliances?|living|kitchen)?|mug|lamp|dispenser|bottle|flask|pillow|cushion|shelf|rack|mop)\b|লাইট|মগ|বোতল|বালিশ/i)) {
    return "home";
  }

  return null;
}

export function generateProductSvgPlaceholder(name: string = "Product", category: string = ""): string {
  try {
    // Array.from safely splits on unicode code points, never slicing surrogate pairs in half
    const chars = Array.from(name || "Product");
    const safeSnippet = chars.slice(0, 25).join("");
    const safeName = safeSnippet
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="100%" stop-color="#fed7aa"/>
        </linearGradient>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#f97316"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="16" fill="url(#bgGrad)"/>
      <circle cx="200" cy="165" r="50" fill="#ffffff" filter="drop-shadow(0 4px 12px rgba(234,88,12,0.12))"/>
      <g transform="translate(182, 147) scale(1.5)" stroke="url(#primaryGrad)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </g>
      <text x="200" y="250" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700" fill="#9a3412">${safeName}</text>
      <text x="200" y="272" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10" font-weight="600" fill="#ea580c" opacity="0.8">DURTUP OFFICIAL</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch {
    const staticSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#fff7ed"/><circle cx="200" cy="170" r="50" fill="#ffffff"/><text x="200" y="250" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="#9a3412">Product</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(staticSvg)}`;
  }
}

function computeNameHash(str: string): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getCategoryFallbackImage(
  name: string = "",
  category: string = "",
  index: number = 0
): string {
  const key = detectCategoryKey(name, category);
  const nameHash = computeNameHash(name);
  if (key && CATEGORY_IMAGES[key]) {
    const images = CATEGORY_IMAGES[key];
    const pick = (Math.abs(index) + nameHash) % images.length;
    return images[pick];
  }

  const defaultImages = [
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop", // Modern gadget / lifestyle
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", // Power bank
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", // Backpack
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop", // Fast charger
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop", // Jewelry / accessories
  ];
  return defaultImages[(Math.abs(index) + nameHash) % defaultImages.length];
}

export function getCategoryFallbackImages(
  name: string = "",
  category: string = "",
  count: number = 2
): string[] {
  const key = detectCategoryKey(name, category);
  const images = (key && CATEGORY_IMAGES[key]) ? CATEGORY_IMAGES[key] : [
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop",
  ];
  return Array.from({ length: Math.min(count, images.length) }, (_, i) => images[i % images.length]);
}

export function getSmartProductImage(
  name: string = "",
  currentImageUrl?: string,
  category: string = "",
  index: number = 0
): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("3-in-1 kitchen knife sharpener") || lowerName.includes("3 in 1 kitchen knife sharpener")) {
    return "/products/knife_sharpener_3in1.webp";
  }
  if (lowerName.includes("ban color shirt") && lowerName.includes("purple")) {
    return "/products/shirt_ban_purple.webp";
  }
  if (lowerName.includes("ban color shirt") && lowerName.includes("maroon")) {
    return "/products/shirt_ban_light_maroon.webp";
  }
  if (lowerName.includes("cotton shirt") && lowerName.includes("purple")) {
    return "/products/shirt_cotton_purple.webp";
  }
  if (lowerName.includes("bag sealer") || lowerName.includes("heat sealer")) {
    return "/products/mini_bag_sealer_1.webp";
  }

  // If currentImageUrl is a genuine uploaded/supplier image URL, return the direct clean URL
  if (currentImageUrl && typeof currentImageUrl === "string" && currentImageUrl.trim() !== "") {
    const trimmed = currentImageUrl.trim();
    if (!isDeadSupplierOrigin(trimmed)) {
      const isUnsplashGeneric = GENERIC_GADGET_FALLBACKS.some(pattern => trimmed.includes(pattern));

      if (!isUnsplashGeneric) {
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//") || trimmed.startsWith("data:")) {
          const direct = getDirectImageUrl(trimmed);
          if (direct && !isDeadSupplierOrigin(direct)) return direct;
        }
      }
    }
  }

  return getCategoryFallbackImage(name, category, index);
}

// Known dead origin URLs on supplier servers (returns 404 or text/html instead of image binary)
export const KNOWN_DEAD_ORIGIN_URLS = new Set<string>([
  "https://mohasagor.com.bd/public/storage/images/products/ajwNIkIz1JO9dOZKAYW5WslAIGe9laGWB7ctIllQ.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/9jmg46R758uR1Ku8UpbB2fEjuLh1i8PJmX5ve9zb.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/obrg8iSsSHWoqpXuoRzuSYdSRnelkhB2qgsMM3Iw.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/06B4jK73bvMIABaFuuXtW2NirWrSpYRM1yLaMumJ.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/RxTAhyYXd0VI6a7YnCRY0f1KNnUUIdj0XoYJypNL.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/VKgvrT4uYKkDwOuJGZmKu3f4yiB7rsInfgYvnXFo.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/PngofgCFibVX15hx4DouG9NOtDu1mfnf9GfFmOA4.jpg",
]);

// Global in-memory cache of failed image URLs so broken supplier links fail in 0ms without re-trying
export const globalFailedImageUrls = new Set<string>();

/**
 * Returns an array of candidate image URLs in priority order:
 * 1. High-speed Edge WebP CDN URL (Fastest: 100-300ms, 10-20KB, Cloudflare CDN cached)
 * 2. Guaranteed real category-matched product photo (Instant fallback if supplier link is dead)
 * 3. Default clean branded SVG placeholder
 */
export function getProductImageCandidates(product: any, width: number = 400): string[] {
  if (!product) return [];
  const candidates: string[] = [];

  const addCandidate = (url?: string) => {
    if (!url || typeof url !== "string") return;
    let clean = url.trim();
    if (!clean || clean.length < 5) return;

    if (clean.startsWith("//")) {
      clean = `https:${clean}`;
    } else if (clean.startsWith("http://")) {
      clean = clean.replace(/^http:\/\//i, "https://");
    } else if (clean.startsWith("/uploads/") || clean.startsWith("uploads/")) {
      const p = clean.startsWith("/") ? clean : `/${clean}`;
      clean = `https://ecomsellerbd.com${p}`;
    } else if (clean.startsWith("/public/storage/") || clean.startsWith("public/storage/") || clean.startsWith("/storage/") || clean.startsWith("storage/")) {
      const p = clean.startsWith("/") ? clean : `/${clean}`;
      clean = `https://mohasagor.com.bd${p}`;
    }

    if (clean.includes("mohasagor.com/") && !clean.includes("mohasagor.com.bd/")) {
      clean = clean.replace("mohasagor.com/", "mohasagor.com.bd/");
    }

    if (clean.includes("supabase.co") && clean.includes("product-images/master/")) {
      const match = clean.match(/product-images\/master\/([a-zA-Z0-9\-\_]+(?:\.webp|\.jpg|\.png|\.jpeg|\.gif)?)/);
      if (match && match[1]) {
        const fn = match[1].endsWith(".webp") ? match[1] : `${match[1]}.webp`;
        clean = `https://ecomsellerbd.com/uploads/product-images/master/${fn}`;
      }
    }

    if (isDeadSupplierOrigin(clean)) return;

    if (!candidates.includes(clean)) {
      candidates.push(clean);
    }
  };

  const prodName = String(product?.name || "").toLowerCase();
  if (prodName.includes("3-in-1 kitchen knife sharpener") || prodName.includes("3 in 1 kitchen knife sharpener")) {
    addCandidate("/products/knife_sharpener_3in1.webp");
  }
  if (prodName.includes("ban color shirt") && prodName.includes("purple")) {
    addCandidate("/products/shirt_ban_purple.webp");
  }
  if (prodName.includes("ban color shirt") && prodName.includes("maroon")) {
    addCandidate("/products/shirt_ban_light_maroon.webp");
  }
  if (prodName.includes("cotton shirt") && prodName.includes("purple")) {
    addCandidate("/products/shirt_cotton_purple.webp");
  }
  if (prodName.includes("bag sealer") || prodName.includes("heat sealer")) {
    addCandidate("/products/mini_bag_sealer_1.webp");
    addCandidate("/products/mini_bag_sealer_2.webp");
    addCandidate("/products/mini_bag_sealer_3.webp");
    addCandidate("/products/mini_bag_sealer_4.webp");
  }

  // Collect ALL genuine product images from any schema format
  const allRawImages: string[] = [];
  const collect = (u: any) => {
    if (!u) return;
    let str = typeof u === "string" ? u.trim() : (u.image_url || u.url || u.image || u.product_image || u.path || u.src || "").trim();
    if (!str) return;

    if (str.startsWith("//")) {
      str = `https:${str}`;
    } else if (str.startsWith("http://")) {
      str = str.replace(/^http:\/\//i, "https://");
    } else if (str.startsWith("/uploads/") || str.startsWith("uploads/")) {
      const p = str.startsWith("/") ? str : `/${str}`;
      str = `https://ecomsellerbd.com${p}`;
    } else if (str.startsWith("/public/storage/") || str.startsWith("public/storage/") || str.startsWith("/storage/") || str.startsWith("storage/")) {
      const p = str.startsWith("/") ? str : `/${str}`;
      str = `https://mohasagor.com.bd${p}`;
    }

    if (str.includes("mohasagor.com/") && !str.includes("mohasagor.com.bd/")) {
      str = str.replace("mohasagor.com/", "mohasagor.com.bd/");
    }

    if (str.includes("supabase.co") && str.includes("product-images/master/")) {
      const match = str.match(/product-images\/master\/([a-zA-Z0-9\-\_]+(?:\.webp|\.jpg|\.png|\.jpeg|\.gif)?)/);
      if (match && match[1]) {
        const fn = match[1].endsWith(".webp") ? match[1] : `${match[1]}.webp`;
        str = `https://ecomsellerbd.com/uploads/product-images/master/${fn}`;
      }
    }

    if (isDeadSupplierOrigin(str)) return;

    if (!allRawImages.includes(str)) {
      allRawImages.push(str);
    }
  };

  if (product.image) collect(product.image);
  if (product.image_url) collect(product.image_url);
  if (product.thumbnail) collect(product.thumbnail);
  if (product.thumbnail_img) collect(product.thumbnail_img);
  if (product.featured_image) collect(product.featured_image);
  if (Array.isArray(product.images)) product.images.forEach(collect);
  if (Array.isArray(product.product_images)) product.product_images.forEach(collect);
  if (Array.isArray(product.gallery)) product.gallery.forEach(collect);
  if (Array.isArray(product.photos)) product.photos.forEach(collect);
  if (Array.isArray(product.product_variants)) {
    product.product_variants.forEach((v: any) => v && (collect(v.image) || collect(v.image_url) || collect(v.variant_image) || collect(v.photo)));
  }
  if (Array.isArray(product.variants)) {
    product.variants.forEach((v: any) => v && (collect(v.image) || collect(v.image_url) || collect(v.variant_image) || collect(v.photo)));
  }

  // 1. Direct High-Speed Supplier & CDN Candidates FIRST!
  // Filter out any stale generic fallbacks if authentic supplier images exist
  const hasRealSupplier = allRawImages.some(u => u.includes("mohasagor.com.bd") || u.includes("ecomsellerbd.com"));
  const validRawImages = hasRealSupplier
    ? allRawImages.filter(u => !GENERIC_GADGET_FALLBACKS.some(g => u.includes(g)))
    : allRawImages;

  // Primary product image always retains priority #1, followed by secondary gallery images
  for (const raw of validRawImages) {
    if (raw.includes("ecomsellerbd.com")) {
      // Ecomseller images are already lightweight WebP - serve directly with 0 proxy latency!
      addCandidate(raw);
      const cdnUrl = optimizeImageUrl(raw, width);
      if (cdnUrl && cdnUrl !== raw) addCandidate(cdnUrl);
    } else if (raw.includes("images.unsplash.com") || raw.includes("img.drz.lazcdn.com") || raw.includes("res.cloudinary.com")) {
      // Native CDN URLs
      const opt = optimizeImageUrl(raw, width);
      if (opt) addCandidate(opt);
      addCandidate(raw);
    } else if (raw.includes("mohasagor.com.bd")) {
      // High-speed edge CDN proxy + direct origin fallback for non-dead origins
      const cdnUrl = optimizeImageUrl(raw, width);
      if (cdnUrl) addCandidate(cdnUrl);
      const directUrl = getDirectImageUrl(raw) || raw;
      if (directUrl && !isDeadSupplierOrigin(directUrl)) {
        addCandidate(directUrl);
      }
    } else {
      const cdnUrl = optimizeImageUrl(raw, width);
      if (cdnUrl) addCandidate(cdnUrl);
      const directUrl = getDirectImageUrl(raw);
      if (directUrl && !directUrl.includes("wsrv.nl") && !directUrl.includes("mohasagor.com.bd")) {
        addCandidate(directUrl);
      }
    }
  }

  // 2. Fallback to authentic keyword/category matched product photo (100% genuine photos, NEVER blank)
  const categoryFallback = getCategoryFallbackImage(
    product.name || "",
    product.category || product.category_name || (product as any).category_id || (product as any).categorySlug || "",
    typeof product.id === "number" ? product.id : (parseInt(product.id) || 0)
  );
  if (categoryFallback && !categoryFallback.startsWith("data:")) {
    addCandidate(categoryFallback);
  }

  // Also add secondary authentic fallbacks for maximum reliability
  const extraFallbacks = getCategoryFallbackImages(
    product.name || "",
    product.category || product.category_name || "",
    3
  );
  extraFallbacks.forEach((fb) => {
    if (fb && !fb.startsWith("data:")) {
      addCandidate(fb);
    }
  });

  // 3. Clean branded SVG placeholder with actual product name (absolute last resort only if network completely down)
  const svgPlaceholder = generateProductSvgPlaceholder(
    product.name || "Product",
    product.category || product.category_name || ""
  );
  addCandidate(svgPlaceholder);

  return candidates;
}

// High-Performance Proactive Image Preloader - Warms product images with lightweight WebP CDN URLs
const preloadedUrls = new Set<string>();

export function prefetchProductImages(
  products: Array<{ image?: string; image_url?: string; images?: any[]; name?: string }>,
  maxCount: number = 24
) {
  if (typeof window === "undefined" || !Array.isArray(products) || products.length === 0) return;
  const targetSlice = products.slice(0, Math.min(maxCount, products.length));

  const warmImage = (rawUrl?: string) => {
    if (!rawUrl || typeof rawUrl !== "string") return;
    const direct = getDirectImageUrl(rawUrl);
    if (direct && !preloadedUrls.has(direct) && !direct.startsWith("data:")) {
      preloadedUrls.add(direct);
      const img = new Image();
      img.decoding = "async";
      img.src = direct;
    }
    const cdn = optimizeImageUrl(rawUrl, 240);
    if (cdn && !preloadedUrls.has(cdn) && !cdn.startsWith("data:")) {
      preloadedUrls.add(cdn);
      const imgCdn = new Image();
      imgCdn.decoding = "async";
      imgCdn.src = cdn;
    }
  };

  const runWarm = () => {
    targetSlice.forEach((p) => {
      warmImage(p.image || p.image_url);
    });
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runWarm, { timeout: 1500 });
  } else {
    setTimeout(runWarm, 300);
  }
}

/**
 * Automatically creates multi-angle and zoomed perspectives of an exact single product image
 * so products with only 1 photo still have 4 rich, interactive views in the detail gallery.
 */
export function generateExactProductViews(url: string, count: number = 4): string[] {
  if (!url || typeof url !== "string") return [];
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("blob:")) {
    return [cleanUrl];
  }

  const baseView = optimizeImageUrl(cleanUrl, 800, 85, "webp") || cleanUrl;
  const views: string[] = [baseView];
  if (count <= 1) return views;

  // View 2, 3, 4: High-Def Detail Focus & Multi-Angle Crops
  const isUnsplash = cleanUrl.includes("images.unsplash.com");
  if (isUnsplash) {
    views.push(cleanUrl.replace(/([?&])fit=[^&]*/, "$1fit=crop").concat("&crop=center&q=85"));
    views.push(cleanUrl.replace(/([?&])fit=[^&]*/, "$1fit=crop").concat("&crop=top&q=85"));
    views.push(cleanUrl.replace(/([?&])fit=[^&]*/, "$1fit=crop").concat("&crop=entropy&q=85"));
  } else {
    const direct = getDirectImageUrl(cleanUrl) || cleanUrl;
    views.push(`https://wsrv.nl/?url=${encodeURIComponent(direct)}&w=800&h=800&fit=cover&a=center&q=85&output=webp`);
    views.push(`https://wsrv.nl/?url=${encodeURIComponent(direct)}&w=800&h=800&fit=cover&a=top&q=85&output=webp`);
    views.push(`https://wsrv.nl/?url=${encodeURIComponent(direct)}&w=800&h=800&fit=cover&a=bottom&q=85&output=webp`);
  }

  return views.slice(0, count);
}
