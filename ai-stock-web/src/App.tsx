import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import WebAuthGuard from './components/WebAuthGuard'
import WebLayout from './components/WebLayout'
import { webRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <WebLayout>
        <Routes>
          {webRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={['/account', '/watch'].includes(route.path) ? <WebAuthGuard>{route.element}</WebAuthGuard> : route.element}
            />
          ))}
        </Routes>
      </WebLayout>
    </BrowserRouter>
  )
}

export default App