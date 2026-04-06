import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import AddEditCustomer from './pages/AddEditCustomer';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />

        {/* Protected routes — require login */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/"                   element={<Dashboard />} />
                  <Route path="/customers"           element={<Customers />} />
                  <Route path="/customers/new"       element={<AddEditCustomer />} />
                  <Route path="/customers/:id"       element={<CustomerDetail />} />
                  <Route path="/customers/:id/edit"  element={<AddEditCustomer />} />
                  <Route path="*"                    element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
