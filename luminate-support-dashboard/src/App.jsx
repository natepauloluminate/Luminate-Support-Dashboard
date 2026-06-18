import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Overview from './pages/Overview.jsx';
import Analytics from './pages/Analytics.jsx';
import SLA from './pages/SLA.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/sla" element={<SLA />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
