import React, { useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups } from '../../redux/slices/groupSlice';
import { fetchExpenses } from '../../redux/slices/expenseSlice';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups } = useSelector((state) => state.groups);
  const { expenses } = useSelector((state) => state.expenses);
  const { user, loading: authLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchGroups());
      dispatch(fetchExpenses());
    }
  }, [dispatch, user]);

  const calculateTotalBalance = () => {
    if (!user || !user._id || !groups) return '0.00';
    
    let total = 0;
    groups.forEach(group => {
      if (group && group.members) {
        const memberBalance = group.members.find(m => m?.user?._id === user._id)?.balance || 0;
        total += memberBalance;
      }
    });
    return total.toFixed(2);
  };

  const getRecentExpenses = () => {
    if (!expenses) return [];
    return expenses.slice(0, 5);
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="text.secondary" align="center">
          Please log in to view your dashboard
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Balance Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Overall Balance
            </Typography>
            <Typography variant="h4" component="p" sx={{ mb: 2 }}>
              ${calculateTotalBalance()}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/expenses/create')}
            >
              Add an Expense
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Activity</Typography>
              <Button
                color="primary"
                onClick={() => navigate('/expenses')}
              >
                View All
              </Button>
            </Box>
            {getRecentExpenses().length > 0 ? (
              <List>
                {getRecentExpenses().map((expense) => (
                  <ListItem
                    key={expense?._id}
                    button
                    onClick={() => navigate(`/expenses/${expense?._id}`)}
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={expense?.description}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            ${expense?.amount?.toFixed(2)}
                          </Typography>
                          {' • '}
                          {new Date(expense?.date).toLocaleDateString()}
                          {expense?.group && (
                            <>
                              {' • '}
                              <Chip
                                label={expense.group.name}
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            </>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">
                  No recent expenses
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/expenses/create')}
                  sx={{ mt: 2 }}
                >
                  Add Your First Expense
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Groups */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Your Groups</Typography>
              <Button
                color="primary"
                onClick={() => navigate('/groups')}
              >
                View All
              </Button>
            </Box>
            {groups?.length > 0 ? (
              <Grid container spacing={2}>
                {groups.map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group?._id}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                      }}
                      onClick={() => navigate(`/groups/${group?._id}`)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {group?.name}
                        </Typography>
                        <Typography color="text.secondary">
                          {group?.members?.length || 0} members
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Your balance: ${group?.members?.find(m => m?.user?._id === user?._id)?.balance?.toFixed(2) || '0.00'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">
                  You haven't joined any groups yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/groups/create')}
                  sx={{ mt: 2 }}
                >
                  Create Your First Group
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
