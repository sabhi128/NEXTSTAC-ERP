import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import NetworkDebugger from './components/NetworkDebugger' // Debugger
import CustomCursor from './components/shared/CustomCursor'

function App() {
  return (
    <>
      <CustomCursor />
      <RouterProvider router={router} />
      <NetworkDebugger />
    </>
  )
}

export default App
