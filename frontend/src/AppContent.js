import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';

// Components
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import PrivateRoute from './components/Auth/PrivateRoute';
import CreateGroup from './components/Groups/CreateGroup';
import GroupDetail from './components/Groups/GroupDetail';
import Groups from './components/Groups/Groups';
import Expenses from './components/Expenses/Expenses';
import ExpenseDetails from './components/Expenses/ExpenseDetails';
import CreateExpense from './components/Expenses/CreateExpense';
import Profile from './components/Profile/Profile';
import Balances from './components/Balances/Balances';
import Payments from './components/Payments/Payments';
import PaymentDetails from './components/Payments/PaymentDetails';
import ActivityPage from './pages/ActivityPage';

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/create" element={<CreateGroup />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/create" element={<CreateExpense />} />
            <Route path="/expenses/:id" element={<ExpenseDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/:id" element={<PaymentDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/balances" element={<Balances />} />
            <Route path="/activities" element={<ActivityPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default AppContent;
