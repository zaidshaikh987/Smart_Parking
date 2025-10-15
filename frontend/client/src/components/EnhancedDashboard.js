import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  LocalParking,
  AccountBalance,
  People,
  TrendingUp,
  Videocam,
  DirectionsCar,
  Memory,
  CheckCircle,
  Refresh,
  Timeline,
  AttachMoney,
  EventAvailable,
  AssignmentTurnedIn,
} from '@mui/icons-material';
import { analyticsAPI, visionAPI, aggregatorAPI, sessionsAPI } from '../services/api';

export default function EnhancedDashboard() {
  const [stats, setStats] = useState({
    slots: { total: 20, occupied: 8, free: 12 },
    sessions: { active: 5, today: 23 },
    revenue: { today: 460, thisMonth: 12500 },
    users: { total: 156, active: 12 },
  });
  const [systemHealth, setSystemHealth] = useState({
    backend: true,
    vision: true,
    aggregator: true,
  });
  const [recentActivity, setRecentActivity] = useState([
    { type: 'entry', user: 'User #1234', time: '2 mins ago', slot: 'A-12' },
    { type: 'exit', user: 'User #5678', time: '5 mins ago', slot: 'B-05', amount: 40 },
    { type: 'entry', user: 'User #9012', time: '8 mins ago', slot: 'C-23' },
    { type: 'exit', user: 'User #3456', time: '12 mins ago', slot: 'A-08', amount: 60 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, visionRes, aggRes] = await Promise.allSettled([
        analyticsAPI.getDashboardStats(),
        visionAPI.getStatus(),
        aggregatorAPI.getStatus(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      setSystemHealth({
        backend: statsRes.status === 'fulfilled',
        vision: visionRes.status === 'fulfilled' && visionRes.value.data.status === 'online',
        aggregator: aggRes.status === 'fulfilled' && aggRes.value.data.status === 'online',
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const occupancyPercentage = stats.slots.total > 0
    ? ((stats.slots.occupied / stats.slots.total) * 100).toFixed(0)
    : 0;

  const statCards = [
    {
      title: 'Available Slots',
      value: stats.slots.free,
      total: stats.slots.total,
      icon: <LocalParking sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
    },
    {
      title: 'Active Sessions',
      value: stats.sessions.active,
      subtitle: `${stats.sessions.today} today`,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.revenue.today}`,
      subtitle: `₹${stats.revenue.thisMonth} this month`,
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
    },
    {
      title: 'Total Users',
      value: stats.users.total,
      subtitle: `${stats.users.active} active now`,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
    },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Real-time parking system analytics
          </Typography>
        </Box>
        <IconButton
          onClick={fetchStats}
          disabled={loading}
          sx={{ bgcolor: 'white', boxShadow: 2, '&:hover': { bgcolor: '#f5f5f5' } }}
        >
          {loading ? <CircularProgress size={24} /> : <Refresh />}
        </IconButton>
      </Box>

      {/* System Health Status - Compact */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              bgcolor: systemHealth.backend ? '#e8f5e9' : '#ffebee',
              border: 1,
              borderColor: systemHealth.backend ? '#4caf50' : '#f44336',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Memory sx={{ color: systemHealth.backend ? '#4caf50' : '#f44336' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Backend: {systemHealth.backend ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              bgcolor: systemHealth.vision ? '#e8f5e9' : '#fff3e0',
              border: 1,
              borderColor: systemHealth.vision ? '#4caf50' : '#ff9800',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Videocam sx={{ color: systemHealth.vision ? '#4caf50' : '#ff9800' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Vision: {systemHealth.vision ? 'Active' : 'Offline'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              bgcolor: systemHealth.aggregator ? '#e8f5e9' : '#fff3e0',
              border: 1,
              borderColor: systemHealth.aggregator ? '#4caf50' : '#ff9800',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: systemHealth.aggregator ? '#4caf50' : '#ff9800' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Aggregator: {systemHealth.aggregator ? 'Running' : 'Offline'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={3}
              sx={{
                background: card.gradient,
                color: 'white',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {card.value}
                    </Typography>
                    {card.subtitle && (
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {card.subtitle}
                      </Typography>
                    )}
                    {card.total && (
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        of {card.total} total
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ opacity: 0.9 }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Occupancy Chart */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Parking Occupancy
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current space utilization
                  </Typography>
                </Box>
                <Chip
                  label={`${occupancyPercentage}% Full`}
                  color={occupancyPercentage > 80 ? 'error' : occupancyPercentage > 50 ? 'warning' : 'success'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Visual Occupancy Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Occupied: {stats.slots.occupied}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Free: {stats.slots.free}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={occupancyPercentage}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: occupancyPercentage > 80 ? '#f44336' : occupancyPercentage > 50 ? '#ff9800' : '#4caf50',
                    },
                  }}
                />
              </Box>

              {/* Slot Grid Visualization */}
              <Box>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  Slot Status Overview
                </Typography>
                <Grid container spacing={1}>
                  {Array.from({ length: stats.slots.total }, (_, i) => (
                    <Grid item xs={2.4} sm={1.5} md={1.2} key={i}>
                      <Paper
                        elevation={1}
                        sx={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: i < stats.slots.occupied ? '#ffebee' : '#e8f5e9',
                          border: 1,
                          borderColor: i < stats.slots.occupied ? '#f44336' : '#4caf50',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 3,
                          },
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 10 }}>
                          {String.fromCharCode(65 + Math.floor(i / 10))}-{(i % 10) + 1}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Recent Activity
              </Typography>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: activity.type === 'entry' ? '#4caf50' : '#2196f3',
                          }}
                        >
                          {activity.type === 'entry' ? <DirectionsCar /> : <AttachMoney />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {activity.type === 'entry' ? 'Vehicle Entry' : 'Vehicle Exit'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {activity.time}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {activity.user} • Slot {activity.slot}
                            </Typography>
                            {activity.amount && (
                              <Chip
                                label={`₹${activity.amount}`}
                                size="small"
                                color="success"
                                sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                              />
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#e3f2fd',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#bbdefb',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Videocam sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      View Live Feed
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#f3e5f5',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#e1bee7',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <LocalParking sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Manage Slots
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#fff3e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#ffe0b2',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Timeline sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      View Reports
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#e8f5e9',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#c8e6c9',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <People sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Manage Users
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
