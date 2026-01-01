import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import NetworkDebugger from './components/NetworkDebugger' // Debugger

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <NetworkDebugger />
    </>
  )
}

export default App
