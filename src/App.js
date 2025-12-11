import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import About from './About';
// Import other components/pages as needed

export default function App() {
  return (
    <HashRouter>
      <div>
        {/* Existing layout components like Navbar, Footer, etc. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          {/* Add other routes here */}
        </Routes>
      </div>
    </HashRouter>
  );
}