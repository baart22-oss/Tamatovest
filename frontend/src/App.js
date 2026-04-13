import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Investments from './pages/Investments';
import Referrals from './pages/Referrals';
import Transactions from './pages/Transactions';
import Withdraw from './pages/Withdraw';

// Admin pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminInvestments from './pages/admin/AdminInvestments';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminUsers from './pages/admin/AdminUsers';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* User routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/packages" element={<PrivateRoute><Packages /></PrivateRoute>} />
      <Route path="/investments" element={<PrivateRoute><Investments /></PrivateRoute>} />
      <Route path="/referrals" element={<PrivateRoute><Referrals /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/withdraw" element={<PrivateRoute><Withdraw /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminOverview /></PrivateRoute>} />
      <Route path="/admin/investments" element={<PrivateRoute adminOnly><AdminInvestments /></PrivateRoute>} />
      <Route path="/admin/withdrawals" element={<PrivateRoute adminOnly><AdminWithdrawals /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '0.875rem' },
            success: { style: { background: '#276749', color: 'white' } },
            error: { style: { background: '#c53030', color: 'white' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
