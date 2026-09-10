import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Farmer from "./pages/Farmer.jsx";
import Distributor from "./pages/Distributor.jsx";
import MarketPrices from "./pages/MarketPrices.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Buyer from "./pages/Buyer.jsx";
import PricePrediction from "./pages/PricePrediction";

// example (src/App.jsx or router file)
import Traceability from "./pages/Traceability";




// ======================================================
// ⭐ PROTECTED ROUTE COMPONENT
// ======================================================
const Protected = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Role mismatch → redirect home
  if (role && user.role !== role) return <Navigate to="/" replace />;

  // Authorized → allow route
  return children;
};


export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/farmer"
            element={
              <Protected role="farmer">
                <Farmer />
              </Protected>
            }
          />

          <Route
            path="/buyer"
            element={
              <Protected role="buyer">
                <Buyer />
              </Protected>
            }
          />

          <Route
            path="/distributor"
            element={
              <Protected role="distributor">
                <Distributor />
              </Protected>
            }
          />

          {/* PUBLIC PAGES */}
          <Route path="/market" element={<MarketPrices />} />
          <Route path="/trace" element={<Traceability />} />
          <Route path="/predict" element={<PricePrediction />} />


        </Routes>
      </div>
    </div>
  );
}
