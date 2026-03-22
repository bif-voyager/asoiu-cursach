import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import WarehousePage from './pages/WarehousePage';
import ShipmentsPage from './pages/ShipmentsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import ClaimsPage from './pages/ClaimsPage';

function ProtectedRoute({ children }) {
  // const { user } = useAuth();
  // return user ? children : <Navigate to="/login" replace />;
  return children; // Auth temporarily disabled
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrdersPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="claims" element={<ClaimsPage />} />
      </Route>
    </Routes>
  );
}
