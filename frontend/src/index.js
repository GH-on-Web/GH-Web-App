import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress ResizeObserver errors (common with Three.js and resizable containers)
// This is a known harmless error that doesn't affect functionality
const resizeObserverLoopErrRe = /ResizeObserver/i;
const resizeObserverLoopLimitErrRe = /ResizeObserver.*limit/i;

// Override console.error to catch ResizeObserver errors before React's error overlay
const originalConsoleError = window.console.error;
window.console.error = function(...args) {
  const firstArg = args[0];
  if (
    (typeof firstArg === 'string' && 
     (resizeObserverLoopErrRe.test(firstArg) || resizeObserverLoopLimitErrRe.test(firstArg))) ||
    (firstArg?.message && 
     (resizeObserverLoopErrRe.test(firstArg.message) || resizeObserverLoopLimitErrRe.test(firstArg.message)))
  ) {
    // Silently ignore ResizeObserver errors
    return;
  }
  originalConsoleError.apply(console, args);
};

// Catch errors at window level
const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (
    typeof message === 'string' &&
    (resizeObserverLoopErrRe.test(message) || resizeObserverLoopLimitErrRe.test(message))
  ) {
    return true; // Suppress the error
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

// Catch unhandled promise rejections
window.addEventListener('error', (event) => {
  if (
    event.message &&
    (resizeObserverLoopErrRe.test(event.message) || resizeObserverLoopLimitErrRe.test(event.message))
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason?.toString() || '';
  if (resizeObserverLoopErrRe.test(reason) || resizeObserverLoopLimitErrRe.test(reason)) {
    event.preventDefault();
  }
});

// Disable React's error overlay for ResizeObserver errors
if (process.env.NODE_ENV === 'development') {
  const originalError = window.Error;
  window.Error = function(...args) {
    const error = new originalError(...args);
    if (resizeObserverLoopErrRe.test(error.message) || resizeObserverLoopLimitErrRe.test(error.message)) {
      // Mark as handled to prevent React overlay
      error._suppressReactErrorOverlay = true;
    }
    return error;
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
