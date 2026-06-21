import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PresentationView } from './pages/PresentationView'

function App() {
  return (
    <BrowserRouter>
      <div className="h-full bg-[#0a0a0a] text-slate-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/p/:presentationId" element={<Navigate to="0" replace />} />
          <Route path="/p/:presentationId/:pageIndex" element={<PresentationView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
