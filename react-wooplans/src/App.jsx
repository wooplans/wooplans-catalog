import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlanDetail from './pages/PlanDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plans/:slug" element={<PlanDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
