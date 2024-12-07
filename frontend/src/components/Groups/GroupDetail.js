import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  Grid,
  Tabs,
  Tab,
  Autocomplete,
  CircularProgress,
  Chip
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, PersonRemove as PersonRemoveIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getGroup, addMember, removeMember } from '../../redux/slices/groupSlice';
import { loadUser } from '../../redux/slices/authSlice';
import { fetchGroupPayments } from '../../redux/slices/paymentSlice';
import { searchUsers, clearSearchResults } from '../../redux/slices/userSlice';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedGroup: currentGroup, loading, error } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);
  const { payments } = useSelector((state) => state.payments);
  const { searchResults, loading: searchLoading } = useSelector((state) => state.users);
  const [openInvite, setOpenInvite] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(getGroup(id));
      dispatch(fetchGroupPayments(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!user) {
      dispatch(loadUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (searchTerm) {
      const delayDebounceFn = setTimeout(() => {
        dispatch(searchUsers(searchTerm));
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, dispatch]);

  // Check if current user is the creator
  const isGroupCreator = Boolean(
    user?._id && 
    currentGroup?.creator?._id && 
    user._id === currentGroup.creator._id
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      // Add members sequentially
      for (const user of selectedUsers) {
        await dispatch(addMember({ groupId: id, email: user.email })).unwrap();
      }
      setOpenInvite(false);
      setSearchTerm('');
      setSelectedUsers([]);
      dispatch(clearSearchResults());
      // Refresh group data
      dispatch(getGroup(id));
      setSnackbar({
        open: true,
        message: selectedUsers.length > 1 
          ? 'Members invited successfully!' 
          : 'Member invited successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to invite members',
        severity: 'error'
      });
    }
  };

  const handleCloseInvite = () => {
    setOpenInvite(false);
    setSearchTerm('');
    setSelectedUsers([]);
    dispatch(clearSearchResults());
  };

  const handleRemoveMember = async (member) => {
    // Prevent removing yourself
    if (member.user._id === user?._id) {
      setSnackbar({
        open: true,
        message: 'You cannot remove yourself from the group',
        severity: 'error'
      });
      return;
    }
    setMemberToDelete(member);
    setOpenConfirmDelete(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      await dispatch(removeMember({
        groupId: id,
        userId: memberToDelete.user._id
      })).unwrap();
      // Refresh group data
      dispatch(getGroup(id));
      setSnackbar({
        open: true,
        message: 'Member removed successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to remove member',
        severity: 'error'
      });
    }
    setOpenConfirmDelete(false);
    setMemberToDelete(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{typeof error === 'object' ? error.msg || 'An error occurred' : error}</Alert>
      </Box>
    );
  }

  if (!currentGroup) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Group not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {currentGroup.name}
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        {currentGroup.category}
      </Typography>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Members ({currentGroup.members?.length || 0})
          {isGroupCreator && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenInvite(true)}
              size="small"
            >
              Add Member
            </Button>
          )}
        </Typography>

        <List>
          {currentGroup.members?.map((member) => (
            <ListItem
              key={member.user._id}
              secondaryAction={
                isGroupCreator && member.user._id !== user?._id && (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <PersonRemoveIcon />
                  </IconButton>
                )
              }
            >
              <ListItemAvatar>
                <Avatar>{member.user.name[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={member.user.name}
                secondary={member.user.email}
              />
              <Typography variant="body2" color={member.balance > 0 ? 'success.main' : member.balance < 0 ? 'error.main' : 'text.secondary'}>
                {member.balance > 0 ? `gets back $${member.balance.toFixed(2)}` : member.balance < 0 ? `owes $${Math.abs(member.balance).toFixed(2)}` : 'settled up'}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="EXPENSES" />
          <Tab label="PAYMENTS" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 2 }}>
        {tabValue === 0 ? (
          currentGroup.expenses && currentGroup.expenses.length > 0 ? (
            <List>
              {currentGroup.expenses.map((expense) => (
                <ListItem 
                  key={expense._id}
                  button
                  onClick={() => navigate(`/expenses/${expense._id}`)}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={expense.description}
                    secondary={`Paid by ${expense.paidBy === user?.id ? 'You' : currentGroup.members.find(m => m.user._id === expense.paidBy)?.user.name || 'Unknown'}`}
                  />
                  <Typography variant="body1" sx={{ ml: 2 }}>
                    ${expense.amount.toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">
              No expenses recorded yet
            </Typography>
          )
        ) : (
          payments && payments.length > 0 ? (
            <List>
              {payments.map((payment) => (
                <ListItem 
                  key={payment._id}
                  button
                  onClick={() => navigate(`/payments/${payment._id}`)}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar>{payment.paidBy.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {payment.paidBy._id === user?._id ? 'You' : payment.paidBy.name} 
                        {' → '} 
                        {payment.paidTo._id === user?._id ? 'You' : payment.paidTo.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {new Date(payment.date).toLocaleDateString()}
                        </Typography>
                        {payment.description && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            {' - '}{payment.description}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Typography variant="body1" color="primary" sx={{ ml: 2, fontWeight: 'medium' }}>
                    ${payment.amount.toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">
              No payments recorded yet
            </Typography>
          )
        )}
      </Box>

      {/* Add Member Dialog */}
      <Dialog 
        open={openInvite} 
        onClose={handleCloseInvite}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Members</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Search and select users to add to the group
          </DialogContentText>
          <Autocomplete
            multiple
            fullWidth
            options={searchResults}
            getOptionLabel={(option) => option.email}
            value={selectedUsers}
            onChange={(event, newValue) => setSelectedUsers(newValue)}
            onInputChange={(event, newInputValue) => setSearchTerm(newInputValue)}
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Email Address"
                variant="outlined"
                margin="dense"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{option.name[0]}</Avatar>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  avatar={<Avatar>{option.name[0]}</Avatar>}
                  label={option.email}
                  {...getTagProps({ index })}
                  key={option._id}
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvite}>Cancel</Button>
          <Button 
            onClick={handleInvite} 
            variant="contained" 
            color="primary"
            disabled={selectedUsers.length === 0}
          >
            Add {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}Member{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={openConfirmDelete} onClose={handleConfirmRemoveMember}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this member from the group?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleConfirmRemoveMember} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupDetail;
