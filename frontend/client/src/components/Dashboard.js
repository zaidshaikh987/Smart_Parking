import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Alert } from '@mui/material';
import { LocalParking, AccountBalance, People, TrendingUp, Videocam, DirectionsCar, Memory, CheckCircle } from '@mui/icons-material';
import { analyticsAPI, visionAPI, aggregatorAPI, sessionsAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    slots: { total: 0, occupied: 0, free: 0 },
    sessions: { active: 0 },
    revenue: { today: 0 },
    users: { total: 0 }
  });
  const [systemHealth, setSystemHealth] = useState({
    backend: false,
    vision: false,
    aggregator: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, visionRes, aggRes, sessionsRes] = await Promise.allSettled([
        analyticsAPI.getDashboardStats(),
        visionAPI.getStatus(),
        aggregatorAPI.getStatus(),
        sessionsAPI.getActive()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      setSystemHealth({
        backend: statsRes.status === 'fulfilled',
        vision: visionRes.status === 'fulfilled' && visionRes.value.data.status === 'online',
        aggregator: aggRes.status === 'fulfilled' && aggRes.value.data.status === 'online'
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Available Slots',
      value: stats.slots.free,
      icon: <LocalParking sx={{ fontSize: 50 }} />,
      color: '#4caf50'
    },
    {
      title: 'Active Sessions',
      value: stats.sessions.active,
      icon: <People sx={{ fontSize: 50 }} />,
      color: '#2196f3'
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.revenue.today.toFixed(2)}`,
      icon: <AccountBalance sx={{ fontSize: 50 }} />,
      color: '#ff9800'
    },
    {
      title: 'Total Users',
      value: stats.users.total,
      icon: <TrendingUp sx={{ fontSize: 50 }} />,
      color: '#9c27b0'
    }
  ];

  const occupancyPercentage = stats.slots.total > 0 
    ? ((stats.slots.occupied / stats.slots.total) * 100).toFixed(1)
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        📊 Dashboard Overview
      </Typography>

      {/* System Health Status */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Alert 
            severity={systemHealth.backend ? 'success' : 'error'}
            icon={<Memory />}
            sx={{ py: 0.5 }}
          >
            Backend: {systemHealth.backend ? 'Connected' : 'Offline'}
          </Alert>
        </Grid>
        <Grid item xs={12} md={4}>
          <Alert 
            severity={systemHealth.vision ? 'success' : 'warning'}
            icon={<Videocam />}
            sx={{ py: 0.5 }}
          >
            Vision Service: {systemHealth.vision ? 'Active' : 'Offline'}
          </Alert>
        </Grid>
        <Grid item xs={12} md={4}>
          <Alert 
            severity={systemHealth.aggregator ? 'success' : 'warning'}
            icon={<CheckCircle />}
            sx={{ py: 0.5 }}
          >
            Aggregator: {systemHealth.aggregator ? 'Running' : 'Offline'}
          </Alert>
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={3} sx={{ bgcolor: card.color, color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{card.value}</Typography>
                    <Typography variant="body2">{card.title}</Typography>
                  </Box>
                  <Box sx={{ opacity: 0.7 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
