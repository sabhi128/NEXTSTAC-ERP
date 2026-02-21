import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading Application...</div>}>
        <RouterProvider router={router} />
      </React.Suspense>
    </ErrorBoundary>
  )
}

export default App
