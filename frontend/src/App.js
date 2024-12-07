import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import store from './redux/store';
import AppContent from './AppContent';
import { Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Groups from './components/Groups/Groups';
import CreateGroup from './components/Groups/CreateGroup';
import GroupDetail from './components/Groups/GroupDetail';
import Expenses from './components/Expenses/Expenses';
import CreateExpense from './components/Expenses/CreateExpense';
import ExpenseDetails from './components/Expenses/ExpenseDetails';
import Payments from './components/Payments/Payments';
import PaymentDetails from './components/Payments/PaymentDetails';
import Balances from './components/Balances/Balances';
import Profile from './components/Profile/Profile';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
