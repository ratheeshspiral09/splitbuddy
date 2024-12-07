import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchExpenseById, deleteExpense } from '../../redux/slices/expenseSlice';

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentExpense: expense, loading, error } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    dispatch(fetchExpenseById(id));
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await dispatch(deleteExpense(id));
      navigate('/expenses');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderSplitDetails = () => {
    if (!expense || !expense.splitBetween) return null;

    // Get the split type from the first split (they should all be the same)
    const splitType = expense.splitBetween[0]?.shareType || 'equal';

    // For percentage splits, calculate the total percentage to show remaining
    const totalPercentage = splitType === 'percentage' 
      ? expense.splitBetween.reduce((sum, split) => sum + split.share, 0)
      : 100;

    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Split Details
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Split Type: {splitType.charAt(0).toUpperCase() + splitType.slice(1)}
        </Typography>
        <List>
          {expense.splitBetween.map((split, index) => {
            const isCurrentUser = split.user._id === user._id;
            const isPayer = expense.paidBy._id === split.user._id;
            const shareAmount = split.share; // The share is already calculated in the backend
            
            return (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Avatar>{split.user.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography>
                        {split.user.name}
                        {isCurrentUser && (
                          <Chip
                            size="small"
                            label="You"
                            color="primary"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                        {isPayer && (
                          <Chip
                            size="small"
                            label="Paid"
                            color="success"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color={isPayer ? 'success.main' : 'error.main'}>
                        {isPayer
                          ? `Paid $${expense.amount.toFixed(2)} · Gets back $${(expense.amount - shareAmount).toFixed(2)}`
                          : `Owes $${shareAmount.toFixed(2)} to ${expense.paidBy.name}`}
                      </Typography>
                      {splitType === 'percentage' && (
                        <Typography variant="caption" color="textSecondary">
                          ({(shareAmount / expense.amount * 100).toFixed(0)}% of total)
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
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
          Error: {error.msg || 'Failed to load expense details'}
        </Typography>
      </Container>
    );
  }

  if (!expense) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" color="error" align="center">
          Expense not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {expense.description}
              </Typography>
              <Chip
                label={expense.group?.name || 'Personal'}
                color={expense.group ? 'primary' : 'default'}
                sx={{ mb: 2 }}
              />
            </Box>
            {expense.paidBy?._id === user?.id && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete Expense
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Amount"
                    secondary={`$${expense.amount.toFixed(2)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Date"
                    secondary={formatDate(expense.date)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Paid By"
                    secondary={expense.paidBy?.name || 'Unknown'}
                  />
                </ListItem>
                {expense.notes && (
                  <ListItem>
                    <ListItemText
                      primary="Notes"
                      secondary={expense.notes}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              {renderSplitDetails()}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default ExpenseDetails;
