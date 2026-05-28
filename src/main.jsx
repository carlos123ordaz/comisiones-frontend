import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </HashRouter>,
)
