import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Autocomplete,
  Chip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { createExpense } from '../../redux/slices/expenseSlice';
import { fetchGroups } from '../../redux/slices/groupSlice';

const splitTypes = [
  { value: 'equal', label: 'Split Equally' },
  { value: 'percentage', label: 'Split by Percentage' },
  { value: 'amount', label: 'Split by Exact Amount' },
];

const CreateExpense = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { groups, loading: groupsLoading } = useSelector((state) => state.groups);
  const { loading: expenseLoading } = useSelector((state) => state.expenses);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    groupId: '',
    splitType: 'equal',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    splits: [],
  });

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  useEffect(() => {
    if (selectedGroup) {
      // Initialize splits with group members
      const initialSplits = selectedGroup.members.map(member => ({
        userId: member.user._id,
        name: member.user.name,
        amount: 0,
        percentage: 0,
      }));
      setFormData(prev => ({
        ...prev,
        groupId: selectedGroup._id,
        splits: initialSplits,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        groupId: '',
        splits: [],
      }));
    }
  }, [selectedGroup]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.groupId) {
      newErrors.groupId = 'Group selection is required';
    }
    if (!formData.splits || formData.splits.length === 0) {
      newErrors.splits = 'At least one member must be selected for splitting';
    }

    // Validate splits based on split type
    if (formData.splits.length > 0) {
      if (formData.splitType === 'percentage') {
        const totalPercentage = formData.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          newErrors.splits = 'Total percentage must equal 100%';
        }
      } else if (formData.splitType === 'amount') {
        const totalAmount = formData.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
        if (Math.abs(totalAmount - parseFloat(formData.amount)) > 0.01) {
          newErrors.splits = 'Total split amounts must equal the expense amount';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const expenseData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      groupId: formData.groupId,
      date: formData.date,
      notes: formData.notes,
      splitBetween: formData.splits.map(split => {
        if (formData.splitType === 'equal') {
          return {
            user: split.userId,
            share: 1, // Equal share
            shareType: 'equal'
          };
        } else if (formData.splitType === 'percentage') {
          return {
            user: split.userId,
            share: split.percentage,
            shareType: 'percentage'
          };
        } else {
          return {
            user: split.userId,
            share: split.amount,
            shareType: 'exact'
          };
        }
      })
    };

    try {
      await dispatch(createExpense(expenseData)).unwrap();
      navigate('/expenses');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create expense' });
    }
  };

  const calculateSplitAmount = (split, index) => {
    const amount = parseFloat(formData.amount) || 0;
    if (formData.splitType === 'equal') {
      return amount / formData.splits.length;
    } else if (formData.splitType === 'percentage') {
      return (amount * (split.percentage || 0)) / 100;
    } else {
      return split.amount || 0;
    }
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...formData.splits];
    newSplits[index][field] = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      splits: newSplits,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (groupsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Create New Expense
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={!!errors.date}
                  helperText={errors.date}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={groups}
                  getOptionLabel={(option) => option.name}
                  value={selectedGroup}
                  onChange={(event, newValue) => {
                    setSelectedGroup(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Group"
                      error={!!errors.groupId}
                      helperText={errors.groupId}
                      required
                    />
                  )}
                />
              </Grid>

              {selectedGroup && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth required error={!!errors.splits}>
                      <InputLabel>Split Type</InputLabel>
                      <Select
                        name="splitType"
                        value={formData.splitType}
                        onChange={handleChange}
                        label="Split Type"
                      >
                        {splitTypes.map(type => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.splits && (
                        <FormHelperText>{errors.splits}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Split Details
                    </Typography>
                    {formData.splits.map((split, index) => (
                      <Box key={split.userId} sx={{ mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={4}>
                            <Typography>{split.name}</Typography>
                          </Grid>
                          <Grid item xs={8}>
                            {formData.splitType === 'equal' ? (
                              <TextField
                                fullWidth
                                label="Amount"
                                value={calculateSplitAmount(split, index).toFixed(2)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                  readOnly: true,
                                }}
                              />
                            ) : (
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label={formData.splitType === 'percentage' ? 'Percentage' : 'Amount'}
                                    type="number"
                                    value={formData.splitType === 'percentage' ? split.percentage : split.amount}
                                    onChange={(e) => handleSplitChange(
                                      index,
                                      formData.splitType === 'percentage' ? 'percentage' : 'amount',
                                      e.target.value
                                    )}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          {formData.splitType === 'percentage' ? '%' : '$'}
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </Grid>
                                {formData.splitType === 'percentage' && (
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Amount"
                                      value={calculateSplitAmount(split, index).toFixed(2)}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        readOnly: true,
                                      }}
                                    />
                                  </Grid>
                                )}
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>

              {errors.submit && (
                <Grid item xs={12}>
                  <Typography color="error">{errors.submit}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={expenseLoading}
                  >
                    {expenseLoading ? 'Creating...' : 'Create Expense'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/expenses')}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateExpense;
