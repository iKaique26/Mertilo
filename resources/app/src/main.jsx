import React from 'react';
import ReactDOM from 'react-dom/client';
import './theme/tokens.css';
import { App } from './App';

export default App;

const rootElement = document.getElementById('root') ?? document.createElement('div');
if (!rootElement.id) {
  rootElement.id = 'root';
}
if (!rootElement.parentNode) {
  document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
