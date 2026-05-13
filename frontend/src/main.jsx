import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

// Recharts defaultProps uyarılarını bastır
const _origError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('defaultProps')) return
  _origError(...args)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 25_000,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 4000),
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
