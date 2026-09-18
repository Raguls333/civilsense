import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept fetch calls to point to the Render backend in production
const originalFetch = window.fetch;
window.fetch = function() {
  let [resource, config] = arguments;
  const API_URL = import.meta.env.PROD ? 'https://civilsense.onrender.com' : '';
  
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    resource = API_URL + resource;
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
