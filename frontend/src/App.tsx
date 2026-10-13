import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './app/AppRouter'
import { NaPackProvider } from './app/NaPackProvider'

function App() {
  return (
    <NaPackProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </NaPackProvider>
  )
}

export default App