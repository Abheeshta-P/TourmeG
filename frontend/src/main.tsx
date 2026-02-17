import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'leaflet/dist/leaflet.css';
import { DefaultNodeProvider } from './context/DefaultNodeProvider.tsx';


createRoot(document.getElementById('root')!).render(
  <DefaultNodeProvider>
    <App />
  </DefaultNodeProvider>,
)
