import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  InputAdornment,
} from '@mui/material';
import { createPayment } from '../../redux/slices/paymentSlice';
import { fetchGroups } from '../../redux/slices/groupSlice';

const PaymentForm = ({ open, onClose, initialData }) => {
  const dispatch = useDispatch();
  const { groups } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    groupId: '',
    toUserId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        groupId: initialData.groupId || groups[0]?._id || '',  // Default to first group if no group specified
        toUserId: initialData.toUser?._id || '',
        amount: initialData.amount || '',
        description: 'Balance settlement',
      });
    }
  }, [initialData, groups]);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If no group is selected and there's only one group, use that group
    const effectiveGroupId = formData.groupId || (groups.length === 1 ? groups[0]._id : '');
    
    const paymentData = {
      amount: parseFloat(formData.amount),
      paidTo: formData.toUserId,
      groupId: effectiveGroupId,  // Changed from 'group' to 'groupId' to match backend
      description: formData.description || 'Balance settlement',
    };

    try {
      await dispatch(createPayment(paymentData)).unwrap();
      onClose();
      setFormData({ groupId: '', toUserId: '', amount: '', description: '' });
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  const selectedGroup = groups.find(g => g._id === formData.groupId);
  const groupMembers = selectedGroup
    ? selectedGroup.members
        .map(m => m.user)
        .filter(u => u._id !== user._id)
    : [];

  // If there's only one group, disable group selection
  const singleGroup = groups.length === 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record a Payment</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Group</InputLabel>
              <Select
                name="groupId"
                value={singleGroup ? groups[0]?._id : formData.groupId}
                onChange={handleChange}
                label="Group"
                disabled={!!initialData?.groupId || singleGroup}
                required
              >
                {groups.map((group) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Paid To</InputLabel>
              <Select
                name="toUserId"
                value={formData.toUserId}
                onChange={handleChange}
                label="Paid To"
                disabled={!!initialData?.toUser}
                required
              >
                {groupMembers.map((member) => (
                  <MenuItem key={member._id} value={member._id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="amount"
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What was this payment for?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!formData.amount || !formData.toUserId || (!formData.groupId && !singleGroup)}
          >
            Record Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm;
