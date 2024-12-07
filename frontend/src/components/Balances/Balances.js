import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchGroups } from '../../redux/slices/groupSlice';
import PaymentForm from '../Payments/PaymentForm';

const Balances = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { groups, loading } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  useEffect(() => {
    if (!hasInitiallyFetched) {
      dispatch(fetchGroups());
      setHasInitiallyFetched(true);
    }
  }, [dispatch, hasInitiallyFetched]);

  // Get settlement summary for a group
  const getGroupSettlements = useCallback((group) => {
    if (!group?.members) return [];
    
    const settlements = [];
    const members = group.members;

    // Find who owes money (negative balance) and who should receive money (positive balance)
    const debtors = members.filter(m => m.balance < 0);
    const creditors = members.filter(m => m.balance > 0);

    debtors.forEach(debtor => {
      let remainingDebt = Math.abs(debtor.balance);
      
      creditors.forEach(creditor => {
        if (remainingDebt > 0 && creditor.balance > 0) {
          const amount = Math.min(remainingDebt, creditor.balance);
          if (amount > 0) {
            settlements.push({
              from: debtor.user,
              to: creditor.user,
              amount: Number(amount.toFixed(2))
            });
            remainingDebt -= amount;
          }
        }
      });
    });

    return settlements;
  }, []);

  // Calculate total balance for a group
  const calculateGroupBalance = useCallback((group) => {
    if (!group || !user?._id) return 0;
    
    const currentUserId = user._id;
    const settlements = getGroupSettlements(group);
    
    return settlements.reduce((total, settlement) => {
      if (settlement.from._id === currentUserId) {
        return total + settlement.amount;
      } else if (settlement.to._id === currentUserId) {
        return total - settlement.amount;
      }
      return total;
    }, 0);
  }, [getGroupSettlements, user?._id]);

  // Calculate overall balances across all groups
  const overallBalances = useMemo(() => {
    if (!groups?.length || !user?._id) return [];
    
    const balances = new Map(); // userId -> {balance, settlements: Map()}
    const currentUserId = user._id;

    // First, collect all balances and track individual settlements
    groups.forEach(group => {
      if (!group?.members) return;
      
      const settlements = getGroupSettlements(group);
      
      // Initialize balances for this group
      group.members.forEach(member => {
        if (!member?.user?._id) return;
        
        if (!balances.has(member.user._id)) {
          balances.set(member.user._id, {
            balance: 0,
            settlements: new Map(),
            user: member.user
          });
        }
      });

      // Add settlements
      settlements.forEach(settlement => {
        const fromId = settlement.from._id;
        const toId = settlement.to._id;
        
        if (fromId === currentUserId) {
          // Current user owes money
          const userData = balances.get(toId);
          if (userData) {
            userData.balance = (userData.balance || 0) + settlement.amount;
          }
        } else if (toId === currentUserId) {
          // Current user is owed money
          const userData = balances.get(fromId);
          if (userData) {
            userData.balance = (userData.balance || 0) - settlement.amount;
          }
        }
      });
    });

    // Convert to array and filter out zero balances and current user
    return Array.from(balances.values())
      .filter(({ balance, user: balanceUser }) => 
        balance !== 0 && balanceUser._id !== currentUserId
      )
      .map(({ balance, user: balanceUser }) => ({
        userId: balanceUser._id,
        user: balanceUser,
        balance: Number(balance.toFixed(2))
      }));
  }, [groups, user?._id, getGroupSettlements]);

  const handleSettleUp = (balance) => {
    setSelectedSettlement({
      groupId: null,
      toUser: balance.user,
      amount: Math.abs(balance.balance)
    });
    setPaymentFormOpen(true);
  };

  const handleClosePaymentForm = () => {
    setPaymentFormOpen(false);
    setSelectedSettlement(null);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2.125rem' },
            textAlign: { xs: 'center', sm: 'left' },
            mb: 3
          }}
        >
          Balances
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Overall Balances */}
            <Paper 
              elevation={2}
              sx={{ 
                mb: 4,
                p: { xs: 2, sm: 3 }
              }}
            >
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: 2
                }}
              >
                Overall Summary
              </Typography>
              {overallBalances.length === 0 ? (
                <Typography 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  No balances to show
                </Typography>
              ) : (
                <List sx={{ width: '100%', p: 0 }}>
                  {overallBalances.map((balance, index) => (
                    <React.Fragment key={balance.user._id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          py: { xs: 2, sm: 1.5 },
                          gap: { xs: 1.5, sm: 0 }
                        }}
                      >
                        <ListItemAvatar
                          sx={{
                            minWidth: { xs: 40, sm: 56 },
                            alignSelf: { xs: 'center', sm: 'flex-start' }
                          }}
                        >
                          <Avatar
                            sx={{
                              width: { xs: 40, sm: 40 },
                              height: { xs: 40, sm: 40 },
                              bgcolor: balance.balance > 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            {balance.balance > 0 ? <ArrowForwardIcon /> : <ArrowBackIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'center', sm: 'flex-start' },
                                gap: { xs: 1, sm: 2 }
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                                  textAlign: { xs: 'center', sm: 'left' }
                                }}
                              >
                                {balance.user.name}
                              </Typography>
                              <Chip
                                label={`₹${Math.abs(balance.balance).toFixed(2)}`}
                                color={balance.balance > 0 ? 'success' : 'error'}
                                sx={{
                                  fontSize: { xs: '0.9rem', sm: '1rem' }
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 1,
                                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                textAlign: { xs: 'center', sm: 'left' }
                              }}
                            >
                              {balance.balance > 0
                                ? `You owe ${balance.user.name}`
                                : `${balance.user.name} owes you`}
                            </Typography>
                          }
                        />
                        <Button
                          variant="outlined"
                          color={balance.balance > 0 ? 'success' : 'primary'}
                          onClick={() => handleSettleUp(balance)}
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            mt: { xs: 1, sm: 0 }
                          }}
                        >
                          Settle Up
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Group Balances */}
            {groups.map((group) => {
              const settlements = getGroupSettlements(group);
              const userSettlements = settlements.filter(
                s => s.from._id === user._id || s.to._id === user._id
              );

              if (userSettlements.length === 0) return null;

              return (
                <Accordion 
                  key={group._id}
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
                        {group.name}
                      </Typography>
                      <Chip
                        label={`Balance: ₹${Math.abs(calculateGroupBalance(group)).toFixed(2)}`}
                        color={calculateGroupBalance(group) >= 0 ? 'error' : 'success'}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '0.875rem' }
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List sx={{ width: '100%', p: 0 }}>
                      {userSettlements.map((settlement, index) => (
                        <React.Fragment key={`${settlement.from._id}-${settlement.to._id}`}>
                          {index > 0 && <Divider />}
                          <ListItem
                            sx={{
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              py: { xs: 2, sm: 1.5 },
                              gap: { xs: 1.5, sm: 0 }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'center', sm: 'flex-start' },
                                    gap: { xs: 1, sm: 2 }
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontSize: { xs: '1rem', sm: '1.1rem' },
                                      textAlign: { xs: 'center', sm: 'left' }
                                    }}
                                  >
                                    {settlement.from._id === user._id
                                      ? `You owe ${settlement.to.name}`
                                      : `${settlement.from.name} owes you`}
                                  </Typography>
                                  <Chip
                                    label={`₹${settlement.amount.toFixed(2)}`}
                                    color={settlement.from._id === user._id ? 'error' : 'success'}
                                    size="small"
                                    sx={{
                                      fontSize: { xs: '0.875rem', sm: '0.875rem' }
                                    }}
                                  />
                                </Box>
                              }
                            />
                            <Button
                              variant="outlined"
                              color={settlement.from._id === user._id ? 'success' : 'primary'}
                              onClick={() => handleSettleUp({
                                user: settlement.from._id === user._id ? settlement.to : settlement.from,
                                amount: settlement.from._id === user._id ? settlement.amount : -settlement.amount,
                                group
                              })}
                              sx={{
                                width: { xs: '100%', sm: 'auto' },
                                mt: { xs: 1, sm: 0 }
                              }}
                            >
                              Settle Up
                            </Button>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}
      </Box>
      
      <PaymentForm
        open={paymentFormOpen}
        onClose={() => {
          setPaymentFormOpen(false);
          setSelectedSettlement(null);
        }}
        initialValues={selectedSettlement}
      />
    </Container>
  );
};

export default Balances;
