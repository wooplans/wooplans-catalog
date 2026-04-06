// ============================================
// FAQ - Accordéon interactif
// ============================================

function toggleFaq(button) {
  const item = button.parentElement;
  const isActive = item.classList.contains('active');
  
  // Close all items
  document.querySelectorAll('.faq-item').forEach(faqItem => {
    faqItem.classList.remove('active');
    faqItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
  });
  
  // Open clicked item if it wasn't active
  if (!isActive) {
    item.classList.add('active');
    button.setAttribute('aria-expanded', 'true');
  }
}

// Initialize FAQ
document.addEventListener('DOMContentLoaded', () => {
  // First FAQ item open by default
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) {
    firstFaq.classList.add('active');
    firstFaq.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
  }
});
