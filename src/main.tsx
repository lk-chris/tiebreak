import React from 'react';
import ReactDOM from 'react-dom/client';
import { PollProvider } from './context/PollContext';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PollProvider>
      <App />
    </PollProvider>
  </React.StrictMode>
);
