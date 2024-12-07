import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Pagination,
  CircularProgress,
  Paper
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';

const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/activities?page=${page}`);
      setActivities(response.data.activities);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
    }
  };

  const getActivityDescription = (activity) => {
    const actorName = activity.actor?.name || 'Someone';
    const targetName = activity.target?.name || 'someone';
    const groupName = activity.group?.name || 'a group';
    const amount = activity.amount ? `$${activity.amount.toFixed(2)}` : '';

    switch (activity.type) {
      case 'GROUP_CREATE':
        return `${actorName} created group "${groupName}"`;
      case 'GROUP_UPDATE':
        return `${actorName} updated group "${groupName}"`;
      case 'GROUP_DELETE':
        return `${actorName} deleted group "${groupName}"`;
      case 'MEMBER_ADD':
        return `${actorName} added ${targetName} to "${groupName}"`;
      case 'MEMBER_REMOVE':
        return `${actorName} removed ${targetName} from "${groupName}"`;
      case 'EXPENSE_ADD':
        return `${actorName} added expense ${amount} in "${groupName}"`;
      case 'EXPENSE_UPDATE':
        return `${actorName} updated expense in "${groupName}"`;
      case 'EXPENSE_DELETE':
        return `${actorName} deleted expense from "${groupName}"`;
      case 'PAYMENT_MADE':
        return `${actorName} paid ${amount} to ${targetName}`;
      case 'PAYMENT_DELETE':
        return `${actorName} deleted payment to ${targetName}`;
      case 'BALANCE_SETTLE':
        return `${actorName} settled balance with ${targetName}`;
      default:
        return activity.description || 'Activity performed';
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Activity Feed</Typography>
      <List>
        {activities.map((activity) => (
          <ListItem key={activity._id} divider>
            <ListItemText
              primary={getActivityDescription(activity)}
              secondary={formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            />
          </ListItem>
        ))}
      </List>
      {activities.length === 0 && (
        <Typography variant="body2" color="textSecondary" align="center" sx={{ my: 2 }}>
          No activities to display
        </Typography>
      )}
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Paper>
  );
};

export default ActivityList;
