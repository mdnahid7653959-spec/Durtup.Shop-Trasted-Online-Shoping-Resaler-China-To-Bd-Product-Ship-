const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('--- Starting Deep Live Investigation of https://durtup.shop ---');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9229;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--window-size=1440,900',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-audit-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  function getJson(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  let targets = await getJson(`http://127.0.0.1:${port}/json`);
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (evt) => {
    const res = JSON.parse(evt.data);
    if (res.id && pending.has(res.id)) {
      const { resolve } = pending.get(res.id);
      pending.delete(res.id);
      resolve(res.result);
    }
  };

  const networkRequests = [];
  const networkResponses = new Map();
  const failedRequests = [];
  const consoleMessages = [];

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Network.enable');
      await send('Console.enable');
      await send('Runtime.enable');

      // Listen for network events
      ws.addEventListener('message', (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Network.requestWillBeSent') {
          const req = msg.params;
          networkRequests.push({
            requestId: req.requestId,
            url: req.request.url,
            method: req.request.method,
            type: req.type,
            wallTime: req.wallTime,
            timestamp: req.timestamp
          });
        } else if (msg.method === 'Network.responseReceived') {
          const res = msg.params;
          networkResponses.set(res.requestId, {
            status: res.response.status,
            statusText: res.response.statusText,
            mimeType: res.response.mimeType,
            headers: res.response.headers,
            timing: res.response.timing,
            encodedDataLength: res.response.encodedDataLength
          });
        } else if (msg.method === 'Network.loadingFailed') {
          const fail = msg.params;
          failedRequests.push({
            requestId: fail.requestId,
            errorText: fail.errorText,
            type: fail.type,
            canceled: fail.canceled
          });
        } else if (msg.method === 'Console.messageAdded') {
          consoleMessages.push(msg.params.message);
        }
      });

      console.log('Navigating to https://durtup.shop ...');
      const startTime = Date.now();
      await send('Page.navigate', { url: 'https://durtup.shop' });

      // Wait for initial load and dynamic fetching (10 seconds for thorough capture)
      console.log('Waiting 10 seconds for all background APIs and product streams...');
      await new Promise(r => setTimeout(r, 10000));
      const totalElapsed = Date.now() - startTime;

      // Capture performance metrics
      const perfMetrics = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const timing = performance.timing;
            const nav = performance.getEntriesByType('navigation')[0] || {};
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(p => p.name === 'first-contentful-paint');
            
            // Product DOM inspection
            const productCards = Array.from(document.querySelectorAll('[data-product-id], .group, a[href*="/product/"]'));
            const images = Array.from(document.querySelectorAll('img'));
            const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);
            const spinners = Array.from(document.querySelectorAll('.animate-spin, [class*="loader"], [class*="skeleton"]'));
            
            // LocalStorage and IndexedDB checks
            let lsKeys = [];
            let lsSizeApprox = 0;
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                const val = localStorage.getItem(k);
                lsKeys.push({ key: k, length: val ? val.length : 0 });
                lsSizeApprox += (k.length + (val ? val.length : 0));
              }
            } catch(e) {}

            return {
              url: window.location.href,
              title: document.title,
              dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
              tcpTime: timing.connectEnd - timing.connectStart,
              ttfb: timing.responseStart - timing.requestStart,
              domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
              fullLoad: timing.loadEventEnd - timing.navigationStart,
              fcp: fcp ? fcp.startTime : null,
              navTiming: {
                transferSize: nav.transferSize,
                encodedBodySize: nav.encodedBodySize,
                decodedBodySize: nav.decodedBodySize
              },
              productCardsCount: productCards.length,
              imagesCount: images.length,
              brokenImagesCount: brokenImages.length,
              spinnersCount: spinners.length,
              localStorageSizeKB: Math.round(lsSizeApprox / 1024),
              localStorageKeys: lsKeys
            };
          })()
        `,
        returnByValue: true
      });

      // Calculate total network metrics
      let totalBytesTransferred = 0;
      const categorized = {
        Script: { count: 0, bytes: 0 },
        Stylesheet: { count: 0, bytes: 0 },
        Image: { count: 0, bytes: 0 },
        Fetch: { count: 0, bytes: 0 },
        XHR: { count: 0, bytes: 0 },
        Document: { count: 0, bytes: 0 },
        Media: { count: 0, bytes: 0 },
        Font: { count: 0, bytes: 0 },
        Other: { count: 0, bytes: 0 }
      };

      const largeRequests = [];

      for (const req of networkRequests) {
        const res = networkResponses.get(req.requestId);
        const bytes = res ? (res.encodedDataLength || 0) : 0;
        totalBytesTransferred += bytes;
        const cat = categorized[req.type] || categorized.Other;
        cat.count++;
        cat.bytes += bytes;

        if (bytes > 100 * 1024 || req.url.includes('.json')) {
          largeRequests.push({
            url: req.url,
            type: req.type,
            status: res ? res.status : 'No response',
            sizeKB: Math.round(bytes / 1024),
            mimeType: res ? res.mimeType : 'unknown'
          });
        }
      }

      // Check external supplier requests
      const externalSupplierReqs = networkRequests.filter(r => 
        r.url.includes('mohasagor') || 
        r.url.includes('ecomseller') || 
        r.url.includes('allorigins') || 
        r.url.includes('corsproxy') || 
        r.url.includes('codetabs') || 
        r.url.includes('render.com') ||
        r.url.includes('firebase') ||
        r.url.includes('firestore')
      ).map(r => {
        const res = networkResponses.get(r.requestId);
        const fail = failedRequests.find(f => f.requestId === r.requestId);
        return {
          url: r.url,
          status: res ? res.status : (fail ? `FAILED: ${fail.errorText}` : 'pending'),
          sizeKB: res ? Math.round(res.encodedDataLength / 1024) : 0
        };
      });

      const auditReport = {
        investigationTimestamp: new Date().toISOString(),
        targetUrl: 'https://durtup.shop',
        totalObservationSeconds: Math.round(totalElapsed / 1000),
        performanceMetrics: perfMetrics.result.value,
        networkSummary: {
          totalRequests: networkRequests.length,
          failedRequestsCount: failedRequests.length,
          totalTransferredMB: (totalBytesTransferred / (1024 * 1024)).toFixed(2),
          byCategory: categorized
        },
        largeOrJsonRequests: largeRequests,
        externalSupplierAndBackendRequests: externalSupplierReqs,
        failedNetworkRequests: failedRequests.map(f => {
          const matchingReq = networkRequests.find(r => r.requestId === f.requestId);
          return {
            url: matchingReq ? matchingReq.url : 'unknown',
            error: f.errorText,
            type: f.type
          };
        }),
        consoleErrors: consoleMessages.filter(m => m.level === 'error').map(m => ({
          text: m.text,
          url: m.url,
          line: m.line
        }))
      };

      const outJson = path.join('C:\\Users\\mdnah\\.gemini\\antigravity\\brain\\4a0ec98f-b643-4d8a-8324-6a10793efea6', 'live_audit_report.json');
      fs.writeFileSync(outJson, JSON.stringify(auditReport, null, 2));
      console.log('Saved deep audit report to:', outJson);

      // Print quick summary to stdout
      console.log('\n--- LIVE AUDIT QUICK SUMMARY ---');
      console.log(`Total Requests: ${networkRequests.length}`);
      console.log(`Total Transferred: ${(totalBytesTransferred / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Failed Requests: ${failedRequests.length}`);
      console.log(`TTFB: ${perfMetrics.result.value.ttfb} ms`);
      console.log(`DOMContentLoaded: ${perfMetrics.result.value.domContentLoaded} ms`);
      console.log(`Full Load: ${perfMetrics.result.value.fullLoad} ms`);
      console.log(`FCP: ${perfMetrics.result.value.fcp} ms`);
      console.log(`Console Errors: ${consoleMessages.filter(m => m.level === 'error').length}`);
      console.log(`Spinners/Skeletons lingering: ${perfMetrics.result.value.spinnersCount}`);
      console.log('--------------------------------\n');

    } catch (e) {
      console.error('Audit script error:', e);
    } finally {
      ws.close();
      chromeProc.kill();
      process.exit(0);
    }
  };
}

main();
