import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchPaymentById, clearCurrentPayment } from '../../redux/slices/paymentSlice';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentPayment: payment, loading, error } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchPaymentById(id));
    return () => {
      dispatch(clearCurrentPayment());
    };
  }, [dispatch, id]);

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

  if (!payment) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" color="error" align="center">
          Payment not found
        </Typography>
      </Container>
    );
  }

  const isUserPayer = payment.paidBy._id === user._id;
  const isUserReceiver = payment.paidTo._id === user._id;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar
              sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}
            >
              {payment.paidBy.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                Payment Details
              </Typography>
              {payment.description && (
                <Typography variant="subtitle1" color="text.secondary">
                  {payment.description}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              ${payment.amount.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              {isUserPayer ? 'You' : payment.paidBy.name} paid{' '}
              {isUserReceiver ? 'you' : payment.paidTo.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(payment.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Group
            </Typography>
            <Chip
              label={payment.group.name}
              color="primary"
              onClick={() => navigate(`/groups/${payment.group._id}`)}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PaymentDetails;
