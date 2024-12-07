import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchExpenses, deleteExpense } from '../../redux/slices/expenseSlice';

const Expenses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { expenses, loading, error } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  const handleCreateExpense = () => {
    navigate('/expenses/create');
  };

  const handleExpenseClick = (expenseId) => {
    navigate(`/expenses/${expenseId}`);
  };

  const handleDeleteExpense = async (e, expenseId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await dispatch(deleteExpense(expenseId));
      dispatch(fetchExpenses());
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" color="error" align="center">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}
          sx={{ 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
          <Typography variant="h4" component="h1"
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
            Expenses
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateExpense}
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            ADD EXPENSE
          </Button>
        </Box>

        {expenses.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                px: { xs: 2, sm: 0 }
              }}>
              No expenses recorded yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateExpense}
              sx={{ 
                mt: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              ADD YOUR FIRST EXPENSE
            </Button>
          </Box>
        ) : (
          <Paper elevation={2} sx={{ mt: 2 }}>
            <List sx={{ width: '100%', p: 0 }}>
              {expenses.map((expense, index) => (
                <React.Fragment key={expense._id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    button
                    onClick={() => handleExpenseClick(expense._id)}
                    sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      py: { xs: 2, sm: 1 },
                      px: { xs: 2, sm: 2 }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            mb: { xs: 1, sm: 0 }
                          }}
                        >
                          {expense.description}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1, sm: 2 },
                            mt: { xs: 1, sm: 0 }
                          }}
                        >
                          <Chip
                            label={`₹${expense.amount}`}
                            color="primary"
                            size="small"
                            sx={{ width: 'fit-content' }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.875rem', sm: '0.875rem' }
                            }}
                          >
                            {formatDate(expense.date)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction
                      sx={{
                        position: { xs: 'relative', sm: 'absolute' },
                        transform: { xs: 'none', sm: 'translateY(-50%)' },
                        top: { xs: 'auto', sm: '50%' },
                        right: { xs: 0, sm: 16 },
                        mt: { xs: 2, sm: 0 }
                      }}
                    >
                      {expense.createdBy === user._id && (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => handleDeleteExpense(e, expense._id)}
                          sx={{
                            '&:hover': {
                              color: 'error.main'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Expenses;
