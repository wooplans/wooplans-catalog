// ============================================
// Countdown - Compte à rebours 24h global
// ============================================

class Countdown {
  constructor() {
    this.countdowns = document.querySelectorAll('.countdown');
    if (this.countdowns.length === 0) return;
    
    this.init();
  }
  
  init() {
    // Get or set end time (24h from now, synchronized across all users)
    let endTime = localStorage.getItem('wooplans-countdown-end');
    
    if (!endTime || new Date(endTime) < new Date()) {
      // Set new 24h countdown
      endTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('wooplans-countdown-end', endTime);
    }
    
    this.endTime = new Date(endTime).getTime();
    this.update();
    setInterval(() => this.update(), 1000);
  }
  
  update() {
    const now = Date.now();
    const diff = this.endTime - now;
    
    if (diff <= 0) {
      // Reset countdown
      this.endTime = now + 24 * 60 * 60 * 1000;
      localStorage.setItem('wooplans-countdown-end', new Date(this.endTime).toISOString());
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    this.countdowns.forEach(countdown => {
      const h = countdown.querySelector('[data-hours]');
      const m = countdown.querySelector('[data-minutes]');
      const s = countdown.querySelector('[data-seconds]');
      
      if (h) h.textContent = hours.toString().padStart(2, '0');
      if (m) m.textContent = minutes.toString().padStart(2, '0');
      if (s) s.textContent = seconds.toString().padStart(2, '0');
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Countdown();
});
