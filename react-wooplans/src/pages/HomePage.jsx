import { Link } from 'react-router-dom'
import { usePlans } from '../hooks/usePlans'

export default function HomePage() {
  const { plans, loading } = usePlans()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-r from-primary to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 animate-fade-in">
              Trouvez le plan de villa<br />parfait pour vous
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Des centaines de plans de villas modernes avec devis estimatif gratuit
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#plans" className="btn-primary bg-white text-primary hover:bg-gray-100">
                Voir les plans
              </a>
              <a href="https://wa.me/22507070707" className="btn-secondary border-white text-white hover:bg-white/10">
                Contact WhatsApp
              </a>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Plans disponibles' },
              { number: '1200+', label: 'Clients satisfaits' },
              { number: '50%', label: 'Économie moyenne' },
              { number: '24h', label: 'Devis gratuit' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section id="plans" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Nos Villas Populaires</h2>
            <p className="section-subtitle">Découvrez nos plans les plus demandés</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.slice(0, 6).map((plan) => (
              <Link 
                key={plan.id} 
                to={`/plans/${plan.slug}`}
                className="card group cursor-pointer"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={plan.image_url || '/placeholder.jpg'}
                    alt={plan.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  {plan.promo && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      -{plan.promo}%
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {plan.surface}m²
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {plan.bedrooms} ch.
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      {plan.bathrooms} sdb.
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {plan.old_price && (
                        <div className="text-sm text-gray-500 line-through">
                          {new Intl.NumberFormat('fr-FR').format(plan.old_price)} FCFA
                        </div>
                      )}
                      <div className="text-2xl font-bold text-primary">
                        {new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA
                      </div>
                    </div>
                    <div className="text-primary font-semibold group-hover:translate-x-1 transition-transform">
                      Voir →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="#contact" className="btn-primary inline-block">
              Voir tous les plans
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Pourquoi choisir WooPlans ?</h2>
            <p className="section-subtitle">Un accompagnement complet de A à Z</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📐',
                title: 'Plans détaillés',
                description: 'Des plans architecturaux complets avec cotations et spécifications techniques'
              },
              {
                icon: '💰',
                title: 'Devis gratuit',
                description: 'Estimation précise des coûts de construction adaptée à votre budget'
              },
              {
                icon: '🏗️',
                title: 'Suivi chantier',
                description: 'Accompagnement technique pendant toute la durée de votre projet'
              },
            ].map((benefit, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 md:py-24 bg-gradient-to-r from-primary to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à concrétiser votre projet ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contactez-nous dès maintenant pour obtenir votre devis gratuit
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://wa.me/22507070707" 
              className="btn-primary bg-white text-primary hover:bg-gray-100"
            >
              📱 WhatsApp
            </a>
            <a 
              href="tel:+22507070707" 
              className="btn-secondary border-white text-white hover:bg-white/10"
            >
              📞 Appeler
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">WooPlans</h3>
              <p className="text-gray-400">
                Votre partenaire de confiance pour tous vos projets de construction en Côte d'Ivoire.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📍 Abidjan, Côte d'Ivoire</li>
                <li>📞 +225 07 07 07 07</li>
                <li>✉️ contact@wooplans.ci</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGV</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2024 WooPlans. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
