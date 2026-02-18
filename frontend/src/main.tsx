import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'leaflet/dist/leaflet.css';
import { DefaultNodeProvider } from './context/DefaultNodeProvider.tsx';
import { NodeProvider } from './context/NodeContextProvider.tsx';


createRoot(document.getElementById('root')!).render(
  <DefaultNodeProvider>
    <NodeProvider>
      <App />
    </NodeProvider>
  </DefaultNodeProvider>,
)
