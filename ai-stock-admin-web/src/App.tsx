import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AdminAuthGuard from './components/AdminAuthGuard'
import AdminLayout from './components/AdminLayout'
import { adminRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          {adminRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.path === '/login' ? route.element : <AdminAuthGuard>{route.element}</AdminAuthGuard>}
            />
          ))}
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  )
}

export default App