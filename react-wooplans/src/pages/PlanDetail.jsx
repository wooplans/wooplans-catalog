import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlan } from '../hooks/usePlans'

export default function PlanDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { plan, loading, error } = usePlan(slug)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [isFastPath, setIsFastPath] = useState(false)

  // Fast path for direct URL access (Facebook Ads)
  useEffect(() => {
    const isDirectAccess = window.performance?.navigation?.type === 1 || 
                          document.referrer === '' ||
                          !document.referrer.includes(window.location.hostname)
    
    if (isDirectAccess && plan) {
      setIsFastPath(true)
    }
  }, [plan])

  // SEO Meta tags
  useEffect(() => {
    if (plan) {
      document.title = `${plan.name} - WooPlans`
      
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.content = `Plan de villa ${plan.name} - ${plan.surface}m², ${plan.bedrooms} chambres. Prix: ${plan.price} FCFA`
      }

      // Structured data for SEO
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": plan.name,
        "image": plan.image_url,
        "description": `Plan de villa ${plan.name} avec ${plan.bedrooms} chambres et ${plan.bathrooms} salles de bain`,
        "offers": {
          "@type": "Offer",
          "price": plan.price,
          "priceCurrency": "XOF",
          "availability": "https://schema.org/InStock"
        }
      })
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [plan])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plan non trouvé</h1>
          <button onClick={() => navigate('/')} className="btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const images = plan.images || [plan.image_url]
  const whatsappMessage = encodeURIComponent(
    `Bonjour, je suis intéressé par le plan ${plan.name}. Pouvez-vous me donner plus d'informations ?`
  )

  return (
    <div className={`min-h-screen bg-gray-50 ${isFastPath ? '' : 'animate-fade-in'}`}>
      {/* Sticky Mobile Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Prix du plan</div>
            <div className="text-xl font-bold text-primary">
              {new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA
            </div>
          </div>
          <a
            href={`https://wa.me/22507070707?text=${whatsappMessage}`}
            className="btn-primary flex-1 text-center py-3"
          >
            Commander
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 pb-24 lg:pb-8">
        {/* Image Gallery Hero */}
        <section className="relative bg-white">
          <div className={`relative aspect-[4/3] lg:aspect-[16/9] ${isFastPath ? '' : 'animate-slide-up'}`}>
            <img
              src={images[currentImageIndex]}
              alt={`${plan.name} - Vue ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              fetchPriority="high"
              onLoad={(e) => {
                e.target.style.opacity = '1'
              }}
              style={{ opacity: isFastPath ? 1 : 0, transition: 'opacity 0.3s' }}
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Promo Badge */}
            {plan.promo && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg animate-bounce">
                -{plan.promo}%
              </div>
            )}
          </div>
        </section>

        {/* Detail Content */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:mt-8">
          {/* Main Info */}
          <div className="lg:col-span-2 px-4 lg:px-0">
            {/* Title & Price */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h1>
              
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {plan.surface}m²
                </span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {plan.bedrooms} chambres
                </span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  {plan.bathrooms} SDB
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                {plan.old_price && (
                  <span className="text-xl text-gray-500 line-through">
                    {new Intl.NumberFormat('fr-FR').format(plan.old_price)} FCFA
                  </span>
                )}
                <span className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA
                </span>
              </div>
            </div>

            {/* CTA Hero */}
            <div className="bg-gradient-to-r from-primary to-orange-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <h2 className="text-2xl font-bold mb-4">Obtenez le plan et devis de cette villa</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`https://wa.me/22507070707?text=${whatsappMessage}`}
                  className="btn-primary bg-white text-primary hover:bg-gray-100 flex-1 text-center"
                >
                  📱 Commander sur WhatsApp
                </a>
                <button className="btn-secondary border-white text-white hover:bg-white/10 flex-1">
                  📞 Rappel gratuit
                </button>
              </div>
            </div>

            {/* 3D Preview Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Aperçu 3D</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(plan.render_images || images.slice(0, 6)).map((img, i) => (
                  <div 
                    key={i} 
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setCurrentImageIndex(i)
                      setShowGallery(true)
                    }}
                  >
                    <img src={img} alt={`Vue 3D ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {/* Presentation */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Présentation</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {plan.description || `Cette magnifique villa de ${plan.surface}m² offre un design moderne et fonctionnel. 
                  Avec ses ${plan.bedrooms} chambres et ${plan.bathrooms} salles de bain, elle est parfaite pour une famille. 
                  Le plan inclut tous les détails techniques nécessaires pour la construction.`}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Surface', value: `${plan.surface}m²` },
                  { label: 'Chambres', value: plan.bedrooms },
                  { label: 'SDB', value: plan.bathrooms },
                  { label: 'Garage', value: plan.garage || 'Non' },
                ].map((spec, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-500 mb-1">{spec.label}</div>
                    <div className="text-xl font-bold text-gray-900">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Ce qui est inclus</h2>
              <ul className="space-y-3">
                {[
                  'Plans architecturaux complets (PDF)',
                  'Plans de fondations',
                  'Plans de coffrage',
                  'Plans de toiture',
                  'Devis estimatif détaillé',
                  'Conseils personnalisés',
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Témoignages clients</h2>
              <div className="space-y-4">
                {[
                  { name: 'Kouamé J.', text: 'Excellent service, plans très détaillés !', rating: 5 },
                  { name: 'Marie K.', text: 'Construction facilitée grâce aux plans complets', rating: 5 },
                ].map((testimonial, i) => (
                  <div key={i} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex mb-2">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-1">"{testimonial.text}"</p>
                    <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                {plan.old_price && (
                  <div className="text-lg text-gray-500 line-through mb-1">
                    {new Intl.NumberFormat('fr-FR').format(plan.old_price)} FCFA
                  </div>
                )}
                <div className="text-4xl font-bold text-primary mb-2">
                  {new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA
                </div>
                {plan.promo && (
                  <div className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                    Économisez {new Intl.NumberFormat('fr-FR').format(plan.old_price - plan.price)} FCFA
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <a
                  href={`https://wa.me/22507070707?text=${whatsappMessage}`}
                  className="btn-primary w-full block text-center"
                >
                  Commander maintenant
                </a>
                
                <div className="text-center text-sm text-gray-500">
                  <div>Paiement sécurisé via Mobile Money</div>
                  <div className="mt-2 flex justify-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">Orange Money</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">MTN MoMo</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">Wave</span>
                  </div>
                </div>
              </div>

              <hr className="my-6" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Livraison immédiate (PDF)
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Support technique inclus
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Modification possible
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Plans */}
        <section className="px-4 lg:px-0 mt-12 mb-8">
          <h2 className="text-2xl font-bold mb-6">Plans similaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Placeholder for similar plans - would be populated dynamically */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card cursor-pointer group">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={`/placeholder-${i}.jpg`} 
                    alt={`Plan similaire ${i}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm mb-1">Villa V{i}0{i}</div>
                  <div className="text-primary font-bold text-sm">
                    {new Intl.NumberFormat('fr-FR').format(50000 + i * 10000)} FCFA
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Share Buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 z-40">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ${plan.name} sur WooPlans !`)}`}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Partager sur WhatsApp"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Partager sur Facebook"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
      </div>
    </div>
  )
}
