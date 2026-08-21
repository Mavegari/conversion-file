import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToolsPage from './pages/ToolsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ToolsPage />} />
        <Route path="/converter/:type" element={<div>Converter Page (Coming Soon)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
