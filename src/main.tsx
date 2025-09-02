import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

import Landing from './pages/Landing'
import About from './pages/About'
import ImageEditor from './pages/ImageEditor'
import ToPdf from './pages/ToPdf'
import { ThemeProvider } from './lib/theme'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/compress', element: <App /> },
  { path: '/about', element: <About /> },
  { path: '/edit', element: <ImageEditor /> },
  { path: '/to-pdf', element: <ToPdf /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
