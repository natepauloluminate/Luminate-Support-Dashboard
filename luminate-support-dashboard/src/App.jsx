import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Overview from './pages/Overview.jsx';
import Analytics from './pages/Analytics.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
