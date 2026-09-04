import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from '../src/store/store';
// import "./assets/fonts/sfpro/fonts.css";
import "../src/assests/fonts/sfpro/fonts.css"
import { CustomProvider } from 'rsuite';

// CRA treats this benign browser warning as a fatal overlay error.
const resizeObserverLoopErr =
  /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;
window.addEventListener('error', (event) => {
  if (resizeObserverLoopErr.test(event.message)) {
    event.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CustomProvider>
    <Provider store={store}>
    <App />
  </Provider>
  </CustomProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
