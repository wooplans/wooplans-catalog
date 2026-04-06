// ============================================
// Checkout - Gestion du formulaire
// ============================================

// Toggle promo code
function togglePromo(element) {
  const promoInput = element.nextElementSibling;
  promoInput.classList.toggle('visible');
  if (promoInput.classList.contains('visible')) {
    promoInput.querySelector('input').focus();
  }
}

// Get plan from URL
function getPlanFromURL() {
  const params = new URLSearchParams(window.location.search);
  const planSlug = params.get('plan');
  
  if (!planSlug) return null;
  
  // Fetch plan data from global plans data
  // This would ideally come from a plans.js file or API
  // For now, we'll use the plan data passed from the product page
  return window.checkoutPlan || null;
}

// Update checkout with plan data
function updateCheckoutUI(plan) {
  if (!plan) return;
  
  // Update title
  document.title = `${plan.title} | Checkout`;
  
  // Update price
  const priceEl = document.getElementById('checkout-price');
  const originalPriceEl = document.getElementById('checkout-original-price');
  const mockupEl = document.getElementById('checkout-mockup');
  const planIdEl = document.getElementById('plan-id');
  
  if (priceEl) {
    priceEl.textContent = new Intl.NumberFormat('fr-FR').format(plan.price);
  }
  if (originalPriceEl) {
    originalPriceEl.textContent = new Intl.NumberFormat('fr-FR').format(plan.originalPrice) + ' Fcfa';
  }
  if (mockupEl) {
    mockupEl.src = `/images/mockups/${plan.slug}-mockup.png`;
    mockupEl.alt = `Plan ${plan.title}`;
  }
  if (planIdEl) {
    planIdEl.value = plan.id;
  }
}

// Submit checkout
function submitCheckout(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = document.getElementById('submit-btn');
  const formData = new FormData(form);
  
  // Validate
  const firstName = formData.get('first_name');
  const lastName = formData.get('last_name');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const countryCode = formData.get('country_code');
  
  if (!firstName || !lastName || !email || !phone) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }
  
  // Loading state
  submitBtn.classList.add('btn-loading');
  submitBtn.disabled = true;
  
  // Track checkout start
  if (window.Analytics) {
    Analytics.track('checkout_submit', {
      plan_id: formData.get('plan_id'),
      has_promo: !!formData.get('promo_code')
    });
  }
  
  // Prepare data for Chariow
  const checkoutData = {
    plan_id: formData.get('plan_id'),
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: countryCode + phone.replace(/\s/g, ''),
    promo_code: formData.get('promo_code'),
    lang: formData.get('lang'),
    return_url: window.location.origin + '/fr/merci/'
  };
  
  // Call Chariow API
  fetch('https://xlmwzvkqkqjnoijdldzrol.supabase.co/functions/v1/chariow-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(checkoutData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.checkout_url) {
      // Redirect to payment page
      window.location.href = data.checkout_url;
    } else {
      throw new Error('No checkout URL received');
    }
  })
  .catch(error => {
    console.error('Checkout error:', error);
    alert('Une erreur est survenue. Veuillez réessayer ou nous contacter sur WhatsApp.');
    submitBtn.classList.remove('btn-loading');
    submitBtn.disabled = false;
  });
}

// Initialize checkout page
document.addEventListener('DOMContentLoaded', () => {
  const plan = getPlanFromURL();
  if (plan) {
    updateCheckoutUI(plan);
  }
});
