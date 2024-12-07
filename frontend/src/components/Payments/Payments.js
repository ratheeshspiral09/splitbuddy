import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Button,
  IconButton,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fetchPayments, deletePayment } from '../../redux/slices/paymentSlice';
import PaymentForm from './PaymentForm';

const Payments = () => {
  const dispatch = useDispatch();
  const { payments, loading, error } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(false);

  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const handleCreatePayment = () => {
    setOpenPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    setOpenPaymentForm(false);
  };

  const handleDeletePayment = async (e, paymentId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await dispatch(deletePayment(paymentId)).unwrap();
        dispatch(fetchPayments()); // Refresh the payments list
      } catch (error) {
        console.error('Failed to delete payment:', error);
      }
    }
  };

  const handleAccordionChange = (groupId) => (event, isExpanded) => {
    setExpandedGroup(isExpanded ? groupId : false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group payments by group
  const groupedPayments = payments.reduce((acc, payment) => {
    const groupId = payment.group._id;
    if (!acc[groupId]) {
      acc[groupId] = {
        groupName: payment.group.name,
        payments: []
      };
    }
    acc[groupId].payments.push(payment);
    return acc;
  }, {});

  // Calculate total amount for each group
  const calculateGroupTotal = (groupPayments) => {
    return groupPayments.reduce((total, payment) => {
      if (payment.paidBy._id === user._id) {
        return total + payment.amount;
      } else if (payment.paidTo._id === user._id) {
        return total - payment.amount;
      }
      return total;
    }, 0);
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
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          sx={{ 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Payments
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreatePayment}
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Payment
          </Button>
        </Box>

        {Object.keys(groupedPayments).length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                px: { xs: 2, sm: 0 }
              }}
            >
              No payments recorded yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreatePayment}
              sx={{ 
                mt: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Record Your First Payment
            </Button>
          </Box>
        ) : (
          <Box>
            {Object.entries(groupedPayments).map(([groupId, { groupName, payments }]) => (
              <Accordion
                key={groupId}
                expanded={expandedGroup === groupId}
                onChange={handleAccordionChange(groupId)}
                sx={{
                  mb: 2,
                  '& .MuiAccordionSummary-content': {
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1, sm: 2 }
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    flexDirection: 'row',
                    '& .MuiAccordionSummary-expandIconWrapper': {
                      transform: 'rotate(0deg)',
                      marginLeft: 'auto',
                      transition: '0.2s',
                      '&.Mui-expanded': {
                        transform: 'rotate(180deg)',
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: { xs: 1, sm: 2 },
                      width: '100%'
                    }}
                  >
                    <Typography 
                      variant="h6"
                      sx={{
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                      }}
                    >
                      {groupName}
                    </Typography>
                    <Chip
                      label={`Total: ₹${calculateGroupTotal(payments).toFixed(2)}`}
                      color={calculateGroupTotal(payments) >= 0 ? 'success' : 'error'}
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List sx={{ width: '100%', p: 0 }}>
                    {payments.map((payment, index) => (
                      <React.Fragment key={payment._id}>
                        {index > 0 && <Divider />}
                        <ListItem
                          sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            py: { xs: 2, sm: 1 },
                            px: { xs: 2, sm: 2 }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  alignItems: { xs: 'flex-start', sm: 'center' },
                                  gap: { xs: 1, sm: 2 },
                                  mb: { xs: 1, sm: 0 }
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontSize: { xs: '1rem', sm: '1.1rem' }
                                  }}
                                >
                                  {payment.paidBy._id === user._id
                                    ? `You paid ${payment.paidTo.name}`
                                    : `${payment.paidBy.name} paid you`}
                                </Typography>
                                <Chip
                                  label={`₹${payment.amount.toFixed(2)}`}
                                  color={payment.paidBy._id === user._id ? 'primary' : 'success'}
                                  size="small"
                                  sx={{ width: 'fit-content' }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                  mt: { xs: 1, sm: 0 }
                                }}
                              >
                                {formatDate(payment.date)}
                              </Typography>
                            }
                          />
                          {payment.paidBy._id === user._id && (
                            <ListItemSecondaryAction
                              sx={{
                                position: { xs: 'relative', sm: 'absolute' },
                                transform: { xs: 'none', sm: 'translateY(-50%)' },
                                top: { xs: 'auto', sm: '50%' },
                                right: { xs: 0, sm: 16 },
                                mt: { xs: 2, sm: 0 }
                              }}
                            >
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={(e) => handleDeletePayment(e, payment._id)}
                                sx={{
                                  '&:hover': {
                                    color: 'error.main'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>
      <PaymentForm open={openPaymentForm} onClose={handleClosePaymentForm} />
    </Container>
  );
};

export default Payments;
