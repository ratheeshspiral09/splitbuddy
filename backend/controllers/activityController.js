const Activity = require('../models/Activity');
const Group = require('../models/Group');

// Create a new activity
const createActivity = async (activityData) => {
  try {
    console.log('Creating activity with data:', JSON.stringify(activityData, null, 2)); 
    const activity = new Activity(activityData);
    const savedActivity = await activity.save();
    console.log('Activity saved successfully:', JSON.stringify(savedActivity, null, 2)); 
    return savedActivity;
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    throw error;
  }
};

// Get activities for a user (paginated)
const getUserActivities = async (req, res) => {
  try {
    console.log('Fetching activities for user:', req.user.id); 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find all groups the user is a member of
    const userGroups = await Group.find({
      'members.user': req.user.id
    });
    const groupIds = userGroups.map(group => group._id);
    console.log('Found user groups:', groupIds); 

    // Get activities where user is either actor, target, or member of the group
    const query = {
      $or: [
        { actor: req.user.id },
        { target: req.user.id },
        { group: { $in: groupIds } }
      ]
    };
    console.log('Activity search query:', JSON.stringify(query, null, 2));

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name email')
      .populate('target', 'name email')
      .populate('group', 'name')
      .populate('expense', 'description amount')
      .populate('payment', 'amount');

    console.log('Found activities:', activities.length);
    console.log('Activity types found:', activities.map(a => a.type));

    // Get total count for pagination
    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalActivities: total
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

// Get recent activities for dashboard
const getRecentActivities = async (req, res) => {
  try {
    console.log('Fetching recent activities for user:', req.user._id); 
    const userGroups = await Group.find({
      'members.user': req.user._id
    });
    const groupIds = userGroups.map(group => group._id);

    const activities = await Activity.find({
      $or: [
        { actor: req.user._id },
        { target: req.user._id },
        { group: { $in: groupIds } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('actor', 'name email')
      .populate('target', 'name email')
      .populate('group', 'name')
      .populate('expense', 'description amount')
      .populate('payment', 'amount');

    console.log('Found recent activities:', activities); 
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};

module.exports = {
  createActivity,
  getUserActivities,
  getRecentActivities
};
