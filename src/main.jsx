import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from "@mui/material";
import { HashRouter } from 'react-router-dom';
import { appTheme } from './theme';

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <HashRouter>
      <App />
    </HashRouter>
  </ThemeProvider>,
)
