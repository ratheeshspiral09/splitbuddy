import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createGroup } from '../../redux/slices/groupSlice';
import { searchUsers } from '../../redux/slices/userSlice';
import debounce from 'lodash/debounce';

const CreateGroup = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    members: [],
  });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user: currentUser } = useSelector((state) => state.auth);
  const { searchResults, loading: searchLoading } = useSelector((state) => state.users);

  // Debounced search function
  const debouncedSearch = debounce((term) => {
    if (term.trim()) {
      dispatch(searchUsers(term));
    }
  }, 300);

  const handleSearch = (event, newInputValue) => {
    setSearchTerm(newInputValue);
    debouncedSearch(newInputValue);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      setError('Group name and category are required');
      return;
    }

    try {
      const groupData = {
        ...formData,
        members: formData.members.map(member => member._id)
      };
      await dispatch(createGroup(groupData)).unwrap();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
  };

  // Filter out the current user from search results
  const filteredSearchResults = searchResults.filter(
    user => user._id !== currentUser?._id
  );

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create New Group
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Group Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              <MenuItem value="Trip">Trip</MenuItem>
              <MenuItem value="Home">Home</MenuItem>
              <MenuItem value="Office">Office</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />

          <Autocomplete
            multiple
            id="members"
            options={filteredSearchResults}
            getOptionLabel={(option) => option.email}
            value={formData.members}
            onChange={(event, newValue) => {
              setFormData({ ...formData, members: newValue });
            }}
            onInputChange={handleSearch}
            loading={searchLoading}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.email}
                  {...getTagProps({ index })}
                  key={option._id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Members"
                placeholder="Type email to search"
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Create Group
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateGroup;
