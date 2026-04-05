import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import AddEditCustomer from './pages/AddEditCustomer';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"                         element={<Dashboard />} />
        <Route path="/customers"                element={<Customers />} />
        <Route path="/customers/new"            element={<AddEditCustomer />} />
        <Route path="/customers/:id"            element={<CustomerDetail />} />
        <Route path="/customers/:id/edit"       element={<AddEditCustomer />} />
        <Route path="*"                         element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
