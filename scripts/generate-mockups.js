// ============================================
// Generate Mockups - Script Node.js
// Génère des images de mockup pour chaque plan
// ============================================

const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');

const plans = require('../src/_data/plans.json');

// Template HTML pour le mockup
const mockupTemplate = (plan) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 600px;
      height: 800px;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
    }
    
    .mockup {
      width: 400px;
      height: 560px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 
        0 50px 100px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(212, 168, 83, 0.2);
      transform: perspective(1000px) rotateY(-8deg) rotateX(3deg);
      padding: 32px;
      position: relative;
      overflow: hidden;
    }
    
    .mockup::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #D4A853 0%, #B8933F 100%);
    }
    
    .badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: #D4A853;
      color: #000;
      padding: 10px 20px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(212, 168, 83, 0.4);
    }
    
    .header {
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    
    .logo {
      font-family: 'DM Sans', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #D4A853;
      margin-bottom: 8px;
    }
    
    .logo span {
      color: #1a1a1a;
    }
    
    .title {
      font-family: 'DM Sans', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
      line-height: 1.2;
    }
    
    .subtitle {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }
    
    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .spec {
      background: #f8f8f8;
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid #D4A853;
    }
    
    .spec-label {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .spec-value {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .price-section {
      background: linear-gradient(135deg, #f8f8f8 0%, #fff 100%);
      border: 2px dashed #D4A853;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .price-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    
    .price {
      font-family: 'DM Sans', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .price-currency {
      font-size: 14px;
      color: #666;
    }
    
    .features {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    
    .features li {
      margin-bottom: 6px;
      padding-left: 16px;
      position: relative;
      list-style: none;
    }
    
    .features li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #22C55E;
      font-weight: 700;
    }
    
    .stamp {
      position: absolute;
      bottom: 24px;
      right: 24px;
      border: 2px solid #22C55E;
      color: #22C55E;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      transform: rotate(-12deg);
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="mockup">
    <div class="badge">-50%</div>
    <div class="header">
      <div class="logo">Woo<span>Plans</span></div>
      <div class="title">${plan.fr.title}</div>
      <div class="subtitle">${plan.fr.subtitle}</div>
    </div>
    <div class="content">
      <div class="spec">
        <div class="spec-label">Surface</div>
        <div class="spec-value">${plan.surface} m²</div>
      </div>
      <div class="spec">
        <div class="spec-label">Chambres</div>
        <div class="spec-value">${plan.rooms}</div>
      </div>
      <div class="spec">
        <div class="spec-label">Prix</div>
        <div class="spec-value">${plan.price.toLocaleString()} FCFA</div>
      </div>
      <div class="spec">
        <div class="spec-label">Format</div>
        <div class="spec-value">PDF + DWG</div>
      </div>
    </div>
    <div class="price-section">
      <div class="price-label">Offre limitée</div>
      <div class="price">
        ${plan.price.toLocaleString()} <span class="price-currency">FCFA</span>
      </div>
    </div>
    <ul class="features">
      <li>Plan architectural détaillé</li>
      <li>Devis estimatif complet</li>
      <li>Support WhatsApp inclus</li>
    </ul>
    <div class="stamp">Plan vérifié ✓</div>
  </div>
</body>
</html>
`;

async function generateMockups() {
  const outputDir = path.join(__dirname, '../src/images/mockups');
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`🎨 Génération de ${plans.length} mockups...\n`);
  
  for (const plan of plans) {
    const outputPath = path.join(outputDir, `${plan.slug}-mockup.png`);
    
    try {
      await nodeHtmlToImage({
        output: outputPath,
        html: mockupTemplate(plan),
        puppeteerArgs: {
          defaultViewport: { width: 600, height: 800 }
        }
      });
      
      console.log(`✅ ${plan.slug}-mockup.png`);
    } catch (error) {
      console.error(`❌ Erreur pour ${plan.slug}:`, error.message);
    }
  }
  
  console.log('\n✨ Génération terminée !');
}

// Exécuter si appelé directement
if (require.main === module) {
  generateMockups();
}

module.exports = { generateMockups };
