// ============================================
// Gallery - Navigation galerie images
// ============================================

class Gallery {
  constructor() {
    this.currentIndex = 0;
    this.images = window.planData?.images || [];
    this.mainImg = document.getElementById('gallery-main-img');
    this.thumbs = document.querySelectorAll('.gallery-thumb');
    
    if (!this.mainImg || this.images.length === 0) return;
    
    this.init();
  }
  
  init() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
  }
  
  setImage(index) {
    if (index < 0) index = this.images.length - 1;
    if (index >= this.images.length) index = 0;
    
    this.currentIndex = index;
    const imageUrl = this.images[index];
    
    // Update main image with transition
    this.mainImg.style.opacity = '0.7';
    setTimeout(() => {
      this.mainImg.src = `${imageUrl}?width=800&quality=80&format=webp`;
      this.mainImg.onload = () => {
        this.mainImg.style.opacity = '1';
      };
    }, 150);
    
    // Update thumbnails
    this.thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
      thumb.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }
  
  next() {
    this.setImage(this.currentIndex + 1);
  }
  
  prev() {
    this.setImage(this.currentIndex - 1);
  }
}

// Global functions for onclick handlers
let galleryInstance;

document.addEventListener('DOMContentLoaded', () => {
  galleryInstance = new Gallery();
});

function setGalleryImage(index) {
  if (galleryInstance) galleryInstance.setImage(index);
}

function nextImage() {
  if (galleryInstance) galleryInstance.next();
}

function prevImage() {
  if (galleryInstance) galleryInstance.prev();
}
