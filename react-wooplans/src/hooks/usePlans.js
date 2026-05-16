import { useEffect, useState } from 'react'
import { mockPlans } from '../utils/mockData'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Mode local avec données factices
const LOCAL_MODE = true

export function usePlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        // En mode local, on utilise directement les données factices
        if (LOCAL_MODE) {
          // Simulation d'un petit délai de chargement
          await new Promise(resolve => setTimeout(resolve, 500))
          setPlans(mockPlans)
          setLoading(false)
          return
        }

        // Check if data is pre-injected (for SSR fallback)
        if (window.__ALL_PLANS__) {
          setPlans(window.__ALL_PLANS__)
          setLoading(false)
          return
        }

        // Fetch from localStorage first
        const cached = localStorage.getItem('wooplans_data')
        const cachedTime = localStorage.getItem('wooplans_time')

        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime)
          if (age < 300000) { // 5 min cache
            setPlans(JSON.parse(cached))
            setLoading(false)
            return
          }
        }

        // Fetch from Supabase
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)

        const response = await fetch(`${SUPABASE_URL}/rest/v1/plans?select=*&order=created_at.desc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) throw new Error('Failed to fetch plans')

        const data = await response.json()
        setPlans(data)

        // Cache in localStorage
        localStorage.setItem('wooplans_data', JSON.stringify(data))
        localStorage.setItem('wooplans_time', Date.now().toString())

      } catch (err) {
        console.error('Error fetching plans:', err)
        setError(err.message)

        // Fallback to mock data in case of error
        setPlans(mockPlans)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  return { plans, loading, error }
}

export function usePlan(slug) {
  const { plans, loading, error } = usePlans()

  const plan = plans.find(p => p.slug === slug) ||
               (window.__INITIAL_PLAN__?.slug === slug ? window.__INITIAL_PLAN__ : null)

  return { plan, loading, error }
}
