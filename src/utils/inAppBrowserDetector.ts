/**
 * In-App Browser Detection & External Browser Redirect Utility
 * Detects social media webviews (Facebook, TikTok, Instagram, Messenger, etc.)
 * and facilitates shifting users to real default browsers (Chrome/Safari).
 */

export interface InAppBrowserInfo {
  isInApp: boolean;
  platform: 'facebook' | 'tiktok' | 'instagram' | 'messenger' | 'twitter' | 'wechat' | 'generic' | null;
  displayName: string;
  isAndroid: boolean;
  isIOS: boolean;
}

export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof window === 'undefined' || !navigator) {
    return { isInApp: false, platform: null, displayName: '', isAndroid: false, isIOS: false };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Specific Social Media In-App User Agents
  const isFacebook = /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua);
  const isMessenger = /Messenger/i.test(ua);
  const isInstagram = /Instagram/i.test(ua);
  const isTikTok = /musical_ly|ByteLocale|ByteFullConfig|TikTok|BytedanceWebview/i.test(ua);
  const isTwitter = /Twitter/i.test(ua);
  const isWeChat = /MicroMessenger/i.test(ua);
  const isSnapchat = /Snapchat/i.test(ua);
  const isLine = /Line\//i.test(ua);
  const isPinterest = /Pinterest/i.test(ua);

  // Generic WebView check (especially Android WebView or iOS UIWebView/WKWebView without standalone Safari)
  const isGenericAndroidWebView = isAndroid && /Version\/[0-9\.]+\s+(Chrome|Mobile)/i.test(ua) && /wv/i.test(ua);
  const isGenericIOSWebView = isIOS && !/(CriOS|FxiOS|Version\/[\d.]+.*Safari)/i.test(ua) && !/Safari/i.test(ua);

  let platform: InAppBrowserInfo['platform'] = null;
  let displayName = '';

  if (isFacebook) {
    platform = 'facebook';
    displayName = 'Facebook';
  } else if (isTikTok) {
    platform = 'tiktok';
    displayName = 'TikTok';
  } else if (isInstagram) {
    platform = 'instagram';
    displayName = 'Instagram';
  } else if (isMessenger) {
    platform = 'messenger';
    displayName = 'Messenger';
  } else if (isTwitter) {
    platform = 'twitter';
    displayName = 'X / Twitter';
  } else if (isWeChat) {
    platform = 'wechat';
    displayName = 'WeChat';
  } else if (isSnapchat) {
    platform = 'generic';
    displayName = 'Snapchat';
  } else if (isLine) {
    platform = 'generic';
    displayName = 'LINE';
  } else if (isPinterest) {
    platform = 'generic';
    displayName = 'Pinterest';
  } else if (isGenericAndroidWebView || isGenericIOSWebView) {
    platform = 'generic';
    displayName = 'সোশ্যাল মিডিয়া ব্রাউজার';
  }

  const isInApp = platform !== null;

  return {
    isInApp,
    platform,
    displayName,
    isAndroid,
    isIOS
  };
}

/**
 * Attempts to automatically open current page in the default system browser on Android.
 */
export function openInExternalBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const info = detectInAppBrowser();
  const currentUrl = window.location.href;

  if (info.isAndroid) {
    try {
      // Remove protocol
      const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
      
      // Android Intent scheme to trigger default system browser
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;`;
      
      window.location.href = intentUrl;
      return true;
    } catch (e) {
      console.warn('Failed to launch Android Intent:', e);
    }
  } else if (info.isIOS) {
    // For iOS, try opening a direct link or popup
    try {
      window.open(currentUrl, '_blank');
    } catch {
      // iOS usually suppresses window.open in WebViews unless user initiated
    }
  }

  return false;
}
