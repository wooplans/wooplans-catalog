// ============================================
// Main JavaScript - WooPlans Shop v3
// ============================================

// Analytics
class Analytics {
  static track(event, data = {}) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      lang: document.documentElement.lang,
      ...data
    };
    
    // Send to Supabase
    fetch('https://xlmwzvkqkqjnoijdldzrol.supabase.co/functions/v1/analytics', {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => {});
  }
}

// Share functions
function shareWhatsApp(title, url) {
  const text = encodeURIComponent(`${title} - ${url}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
  Analytics.track('share', { platform: 'whatsapp', url });
}

function shareFacebook(url) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  Analytics.track('share', { platform: 'facebook', url });
}

function copyLink(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
    }, 2000);
  });
  Analytics.track('share', { platform: 'copy', url });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Track page view
  Analytics.track('page_view');
  
  // Track outbound links
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.addEventListener('click', () => {
      Analytics.track('outbound_click', { url: link.href });
    });
  });
});
