const fs = require('fs');
const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Critical Responsive CSS to be inserted before </head>
const criticalCss = `    <style id="critical-ssr-css">
      .shell-root-container { min-height: 100vh; display: flex; flex-direction: column; background-color: #f8f9fa; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; overflow-x: hidden; width: 100%; box-sizing: border-box; }
      .shell-header { width: 100%; background: #ffffff; border-bottom: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.02); position: relative; z-index: 30; }
      .shell-header-container { max-width: 1280px; margin: 0 auto; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-sizing: border-box; width: 100%; }
      .shell-search-desktop { flex: 1; max-width: 680px; margin: 0 12px; display: flex; align-items: center; border: 2px solid #f97316; border-radius: 9999px; overflow: hidden; height: 42px; box-sizing: border-box; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
      .shell-search-mobile { display: none; padding: 4px 16px 8px; width: 100%; box-sizing: border-box; }
      .shell-hero-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 16px; align-items: stretch; width: 100%; box-sizing: border-box; }
      .shell-hero-side { display: flex; flex-direction: column; gap: 12px; justify-content: space-between; }
      .shell-trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
      .shell-cat-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; text-align: center; }
      .shell-mobile-nav { display: none; }

      @media (max-width: 1023px) {
        .shell-hero-grid { grid-template-columns: 1fr; }
        .shell-hero-side { display: none !important; }
      }

      @media (max-width: 767px) {
        .shell-search-desktop { display: none !important; }
        .shell-search-mobile { display: block; }
        .shell-search-mobile-bar { display: flex; align-items: center; border: 2px solid #f97316; border-radius: 9999px; overflow: hidden; height: 42px; width: 100%; box-sizing: border-box; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
        .shell-trust-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .shell-cat-grid { display: flex; overflow-x: auto; gap: 12px; padding-bottom: 6px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .shell-cat-item { flex-shrink: 0; width: 68px; }
        .shell-wishlist-header, .shell-account-header { display: none !important; }
        .shell-mobile-nav {
          display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid #e2e8f0; height: 56px; align-items: center; justify-content: space-around;
        }
      }
    </style>
  </head>`;

if (!html.includes('id="critical-ssr-css"')) {
  html = html.replace('  </head>', criticalCss);
}

// 2. Replace <div id="root"> content with responsive shell
const rootStartTag = '<div id="root">';
const rootEndTag = '    <!-- Pre-rendered Semantic Crawler & AI Fallback Content -->';

const startIndex = html.indexOf(rootStartTag);
const endIndex = html.indexOf(rootEndTag);

if (startIndex !== -1 && endIndex !== -1) {
  const newRootContent = `<div id="root">
      <div class="shell-root-container">
        <!-- Clean Storefront Header (Responsive for Mobile & Desktop) -->
        <header class="shell-header">
          <div class="shell-header-container">
            
            <!-- Left: Menu & Brand Logo with Signature Smile -->
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
              <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;cursor:pointer;color:#1e293b;">
                <svg style="width:24px;height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              </div>
              <a href="/" style="display:flex;flex-direction:column;align-items:flex-start;text-decoration:none;user-select:none;line-height:1;">
                <div style="display:flex;align-items:baseline;">
                  <span style="font-size:26px;font-weight:900;color:#ea580c;letter-spacing:-0.5px;">Durtup</span>
                  <span style="font-size:15px;font-weight:700;color:#0f172a;">.shop</span>
                </div>
                <svg viewBox="0 0 100 20" style="width:84px;height:8px;margin-top:-2px;color:#ea580c;fill:none;stroke:currentColor;stroke-width:3;">
                  <path d="M 5,5 Q 50,18 95,5" stroke-linecap="round" />
                  <path d="M 85,2 L 95,5 L 90,11" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" />
                </svg>
              </a>
            </div>

            <!-- Center: Wide Search Bar with Integrated Search Button (Desktop) -->
            <div class="shell-search-desktop">
              <div style="flex:1;display:flex;align-items:center;padding:0 14px;gap:8px;min-width:0;">
                <svg style="width:16px;height:16px;color:#f97316;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span style="color:#94a3b8;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">Search 'Smart watch'...</span>
                <svg style="width:16px;height:16px;color:#94a3b8;flex-shrink:0;cursor:pointer;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <div style="height:100%;padding:0 18px;background:linear-gradient(90deg,#f97316,#ea580c);color:#ffffff;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;flex-shrink:0;">
                <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Search</span>
              </div>
            </div>

            <!-- Right: Messages, Wishlist, Account -->
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <a href="/messages" style="display:flex;flex-direction:column;align-items:center;padding:2px 10px;text-decoration:none;color:#334155;">
                <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span style="font-size:10px;font-weight:600;margin-top:2px;">Messages</span>
              </a>
              <a href="/wishlist" class="shell-wishlist-header" style="display:flex;flex-direction:column;align-items:center;padding:2px 10px;text-decoration:none;color:#334155;">
                <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span style="font-size:10px;font-weight:600;margin-top:2px;">Wishlist</span>
              </a>
              <a href="/account" class="shell-account-header" style="display:flex;flex-direction:column;align-items:center;padding:2px 10px;text-decoration:none;color:#334155;">
                <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span style="font-size:10px;font-weight:600;margin-top:2px;">Account</span>
              </a>
            </div>

          </div>

          <!-- Mobile Search Bar (Full Width directly below header row) -->
          <div class="shell-search-mobile">
            <div class="shell-search-mobile-bar">
              <div style="flex:1;display:flex;align-items:center;padding:0 12px;gap:8px;min-width:0;">
                <svg style="width:16px;height:16px;color:#f97316;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span style="color:#94a3b8;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">Search 'Smart watch'...</span>
              </div>
              <div style="height:100%;padding:0 14px;background:linear-gradient(90deg,#f97316,#ea580c);color:#ffffff;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;cursor:pointer;user-select:none;flex-shrink:0;">
                <svg style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Search</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Category Horizontal Quick Pills -->
        <nav style="max-width:1280px;margin:0 auto;padding:6px 16px;width:100%;box-sizing:border-box;">
          <div style="display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;">
            <a href="/" style="padding:6px 14px;background:#f97316;color:#ffffff;border-radius:9999px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;box-shadow:0 1px 3px rgba(249,115,22,0.3);flex-shrink:0;">All</a>
            <a href="/category/gadgets-electronics" style="padding:6px 14px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;border-radius:9999px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Gadgets &amp; Electronics</a>
            <a href="/category/mens-fashion" style="padding:6px 14px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;border-radius:9999px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Men's Fashion</a>
            <a href="/category/womens-fashion" style="padding:6px 14px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;border-radius:9999px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Women's Fashion</a>
            <a href="/category/home-lifestyle" style="padding:6px 14px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;border-radius:9999px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Home &amp; Lifestyle</a>
            <a href="/category/foods" style="padding:6px 14px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;border-radius:9999px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Pure Foods</a>
            <a href="/category/kids-zone" style="padding:6px 14px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;border-radius:9999px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Kids Zone</a>
          </div>
        </nav>

        <!-- Hero Section: Banner on Left + 2 Featured Side Cards on Right (Desktop only) -->
        <section style="max-width:1280px;margin:8px auto;padding:0 16px;width:100%;box-sizing:border-box;">
          <div class="shell-hero-grid">
            
            <!-- Main Hero Slider Banner (Full width on Mobile) -->
            <div style="width:100%;aspect-ratio:1024/400;max-height:440px;background:#020617;border-radius:20px;overflow:hidden;position:relative;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              <img src="/banners/hero-banner-1.webp" alt="Durtup" style="width:100%;height:100%;object-fit:cover;display:block;" />
            </div>

            <!-- Right 2 Dynamic Side Cards (Hidden on Mobile/Tablet via critical CSS) -->
            <div class="shell-hero-side">
              
              <!-- Card 1: Period Pain Relief Belt -->
              <a href="/product/period-pain-relief-waist-belt-heating-pad-device-8997" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,0.03);position:relative;">
                <div style="position:relative;width:100%;height:105px;background:#f8fafc;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                  <span style="position:absolute;top:6px;right:6px;background:rgba(239,68,68,0.1);color:#dc2626;font-size:10px;font-weight:900;padding:2px 6px;border-radius:9999px;border:1px solid rgba(239,68,68,0.2);">-26%</span>
                  <img src="https://wsrv.nl/?url=https%3A%2F%2Fmohasagor.com.bd%2Fpublic%2Fstorage%2Fimages%2Fproducts%2F5EoqbLKLuvGtkvQoE7fJVOcgRMY7CemAFUhDFPz0.webp&w=300&output=webp" alt="Period Pain Relief" style="max-height:95px;max-width:100%;object-fit:contain;" />
                </div>
                <div style="margin-top:8px;">
                  <p style="font-size:12px;font-weight:600;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Period Pain Relief Waist Belt Heating Pa...</p>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px solid #f1f5f9;">
                  <div>
                    <span style="font-size:15px;font-weight:900;color:#ea580c;">৳890</span>
                    <span style="font-size:11px;color:#94a3b8;text-decoration:line-through;margin-left:4px;">৳1,202</span>
                  </div>
                  <span style="background:#f1f5f9;color:#0f172a;font-size:11px;font-weight:700;padding:4px 12px;border-radius:9999px;border:1px solid #e2e8f0;">Buy Now</span>
                </div>
              </a>

              <!-- Card 2: Olevs Luxury Watch -->
              <a href="/product/olevs-waterproof-luxury-mens-quartz-watchblack-white-3287" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,0.03);position:relative;">
                <div style="position:relative;width:100%;height:105px;background:#f8fafc;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                  <span style="position:absolute;top:6px;right:6px;background:rgba(239,68,68,0.1);color:#dc2626;font-size:10px;font-weight:900;padding:2px 6px;border-radius:9999px;border:1px solid rgba(239,68,68,0.2);">-26%</span>
                  <img src="https://wsrv.nl/?url=https%3A%2F%2Fmohasagor.com.bd%2Fpublic%2Fstorage%2Fimages%2Fproducts%2FMv7Ge2WAYs5opGUIYBV9SOnmGmNx6orTulF894b4.jpg&w=300&output=webp" alt="Olevs Watch" style="max-height:95px;max-width:100%;object-fit:contain;" />
                </div>
                <div style="margin-top:8px;">
                  <p style="font-size:12px;font-weight:600;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Olevs Luxury Men's Quartz Watch(Blac...</p>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px solid #f1f5f9;">
                  <div>
                    <span style="font-size:15px;font-weight:900;color:#ea580c;">৳1,250</span>
                    <span style="font-size:11px;color:#94a3b8;text-decoration:line-through;margin-left:4px;">৳1,688</span>
                  </div>
                  <span style="background:#f1f5f9;color:#0f172a;font-size:11px;font-weight:700;padding:4px 12px;border-radius:9999px;border:1px solid #e2e8f0;">Buy Now</span>
                </div>
              </a>

            </div>

          </div>
        </section>

        <!-- Trust Badges Strip (4 Features on Desktop, 2x2 on Mobile) -->
        <section style="max-width:1280px;margin:8px auto;padding:0 16px;width:100%;box-sizing:border-box;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:12px 16px;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div class="shell-trust-grid">
              
              <div style="display:flex;align-items:center;gap:10px;">
                <svg style="width:22px;height:22px;color:#0f172a;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <div style="min-width:0;">
                  <p style="font-size:12px;font-weight:800;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">100% Authentic</p>
                  <p style="font-size:10px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Genuine Products</p>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px;">
                <svg style="width:22px;height:22px;color:#0f172a;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div style="min-width:0;">
                  <p style="font-size:12px;font-weight:800;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Fast Delivery</p>
                  <p style="font-size:10px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Across Bangladesh</p>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px;">
                <svg style="width:22px;height:22px;color:#0f172a;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div style="min-width:0;">
                  <p style="font-size:12px;font-weight:800;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Secure Payment</p>
                  <p style="font-size:10px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">100% Protected</p>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px;">
                <svg style="width:22px;height:22px;color:#0f172a;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <div style="min-width:0;">
                  <p style="font-size:12px;font-weight:800;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Easy Returns</p>
                  <p style="font-size:10px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Check &amp; Return</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- Shop by Category Section (8 Circular Cards, Horizontal Scroll on Mobile) -->
        <section style="max-width:1280px;margin:8px auto 60px;padding:0 16px;width:100%;box-sizing:border-box;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="width:4px;height:16px;background:#f97316;border-radius:9999px;display:inline-block;"></span>
                  <h2 style="font-size:16px;font-weight:900;color:#0f172a;margin:0;">Shop by Category</h2>
                </div>
                <p style="font-size:11px;color:#64748b;margin:2px 0 0 12px;">Explore all product categories</p>
              </div>
              <a href="/categories" style="font-size:12px;font-weight:700;color:#ea580c;text-decoration:none;">View All &rarr;</a>
            </div>

            <!-- Category Cards (Responsive) -->
            <div class="shell-cat-grid">
              
              <a href="/category/gadgets-electronics" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-gadgets.webp" alt="Gadgets" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Gadgets</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">ইলেকট্রনিক্স</span>
              </a>

              <a href="/category/watch" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-watch.webp" alt="Smart Watch" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Smart Watch</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">স্মার্ট ওয়াচ</span>
              </a>

              <a href="/category/mens-fashion" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-mens.webp" alt="Men's Wear" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Men's Wear</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">পুরুষদের পোশাক</span>
              </a>

              <a href="/category/womens-fashion" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-womens.webp" alt="Women's Wear" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Women's Wear</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">শাড়ি ও ড্রেস</span>
              </a>

              <a href="/category/home-lifestyle" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-home.webp" alt="Home Living" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Home Living</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">হোম অ্যাপ্লায়েন্স</span>
              </a>

              <a href="/category/foods" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-foods.webp" alt="Pure Foods" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Pure Foods</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">খাবার ও মধু</span>
              </a>

              <a href="/category/kids-zone" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#f8fafc;box-shadow:0 2px 6px rgba(0,0,0,0.04);margin-bottom:4px;">
                  <img src="/category-kids.webp" alt="Kids Zone" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">Kids Zone</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">বাচ্চাদের খেলনা</span>
              </a>

              <a href="/categories" class="shell-cat-item" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;">
                <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f1f5f9;background:#0f172a;box-shadow:0 2px 6px rgba(0,0,0,0.08);margin-bottom:4px;display:flex;align-items:center;justify-content:center;color:#ffffff;">
                  <svg style="width:26px;height:26px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <span style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;">All Categories</span>
                <span style="font-size:9px;color:#94a3b8;white-space:nowrap;">সব ক্যাটাগরি</span>
              </a>

            </div>

          </div>
        </section>

        <!-- Mobile Bottom Navigation (Shown only on Mobile) -->
        <div class="shell-mobile-nav">
          <a href="/" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#ea580c;font-size:10px;font-weight:700;">
            <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
          </a>
          <a href="/wishlist" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#64748b;font-size:10px;font-weight:600;">
            <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>Wishlist</span>
          </a>
          <a href="/cart" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#64748b;font-size:10px;font-weight:600;">
            <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span>Cart</span>
          </a>
          <a href="/orders" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#64748b;font-size:10px;font-weight:600;">
            <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
            <span>Orders</span>
          </a>
          <a href="/account" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#64748b;font-size:10px;font-weight:600;">
            <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Account</span>
          </a>
        </div>

      </div>
    </div>\n\n`;

  html = html.substring(0, startIndex) + newRootContent + html.substring(endIndex);
  fs.writeFileSync(path, html, 'utf8');
  console.log('Successfully updated index.html with 100% responsive critical shell!');
} else {
  console.error('Could not find start or end tags in index.html');
}
