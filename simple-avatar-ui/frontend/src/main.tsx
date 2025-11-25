import ReactDOM from 'react-dom/client';
import App from './App';

// Note: StrictMode removed because it causes double-mounting
// which breaks WebRTC/TRTC connections
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
