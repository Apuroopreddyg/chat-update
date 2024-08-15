
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login'; // Assuming you have a Login component
import Register from './components/Register'; // Assuming you have a Register component
import Dashboard from './components/Dashboard'; // Assuming you have a Dashboard component
import './App.css'; // Import the global CSS file

function App() {
  return (
    <Router>
      <div>
        <div className="overlay"></div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Other routes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
