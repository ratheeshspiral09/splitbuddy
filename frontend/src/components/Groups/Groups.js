import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { fetchGroups } from '../../redux/slices/groupSlice';

const Groups = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { groups, loading, error } = useSelector((state) => state.groups);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const handleCreateGroup = () => {
    navigate('/groups/create');
  };

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
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
          Error: {error.msg || 'Failed to load groups'}
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
            My Groups
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateGroup}
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Create Group
          </Button>
        </Box>

        {groups.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                px: { xs: 2, sm: 0 }
              }}>
              You haven't joined any groups yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateGroup}
              sx={{ 
                mt: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Create Your First Group
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {groups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                    },
                    mx: { xs: 1, sm: 0 }
                  }}
                  onClick={() => handleGroupClick(group._id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {group.name}
                    </Typography>
                    <Chip
                      label={group.category}
                      color="primary"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    {group.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {group.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Typography variant="body2" color="text.secondary">
                      {group.members?.length || 0} members
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      ${group.totalExpenses?.toFixed(2) || '0.00'}
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Groups;
