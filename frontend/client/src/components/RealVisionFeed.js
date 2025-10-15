import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Videocam,
  DirectionsCar,
  LocalParking,
  Speed,
  Refresh,
} from '@mui/icons-material';

const RealVisionFeed = () => {
  const [visionMode, setVisionMode] = useState('simulated'); // 'simulated' or 'real'
  const [visionStatus, setVisionStatus] = useState(null);
  const [slotStatus, setSlotStatus] = useState({});
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SIMULATED_URL = 'http://localhost:8001';
  const REAL_URL = 'http://localhost:8005';

  const getCurrentURL = () => (visionMode === 'real' ? REAL_URL : SIMULATED_URL);

  useEffect(() => {
    fetchVisionData();
    const interval = setInterval(fetchVisionData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [visionMode]);

  const fetchVisionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseURL = getCurrentURL();

      // Fetch status
      const statusRes = await fetch(`${baseURL}/status`);
      if (!statusRes.ok) throw new Error('Vision service not responding');
      const statusData = await statusRes.json();
      setVisionStatus(statusData);

      // Fetch slot status
      const slotsRes = await fetch(`${baseURL}/slots/status`);
      if (!slotsRes.ok) throw new Error('Could not fetch slot status');
      const slotsData = await slotsRes.json();
      setSlotStatus(slotsData.slots || {});

      // Fetch cameras
      const camerasRes = await fetch(`${baseURL}/cameras`);
      if (!camerasRes.ok) throw new Error('Could not fetch cameras');
      const camerasData = await camerasRes.json();
      setCameras(camerasData.cameras || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching vision data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleVisionMode = () => {
    setVisionMode((prev) => (prev === 'real' ? 'simulated' : 'real'));
  };

  const occupiedCount = Object.values(slotStatus).filter((s) => s.occupied).length;
  const totalSlots = Object.keys(slotStatus).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Videocam sx={{ fontSize: 40 }} />
          Live Vision System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={visionMode === 'real'}
                onChange={toggleVisionMode}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={visionMode === 'real' ? 'REAL YOLOv8' : 'SIMULATED'}
                  color={visionMode === 'real' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            }
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchVisionData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error} - Make sure the vision service is running on {getCurrentURL()}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Vision Status
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {visionStatus?.status || 'Unknown'}
                  </Typography>
                </Box>
                <Videocam sx={{ fontSize: 40, color: '#2196f3' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Detection Model
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {visionMode === 'real' ? 'YOLOv8n' : 'Simulated'}
                  </Typography>
                </Box>
                <Speed sx={{ fontSize: 40, color: '#9c27b0' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Cameras Active
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {cameras.length}
                  </Typography>
                </Box>
                <Videocam sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: occupiedCount > totalSlots / 2 ? '#ffebee' : '#e8f5e9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Slots Occupied
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {occupiedCount} / {totalSlots}
                  </Typography>
                </Box>
                <LocalParking
                  sx={{ fontSize: 40, color: occupiedCount > totalSlots / 2 ? '#f44336' : '#4caf50' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Video Feed */}
      <Grid container spacing={3}>
        {cameras.length > 0 ? (
          cameras.map((camera) => (
            <Grid item xs={12} lg={6} key={camera.camera_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      📹 {camera.camera_id} - {camera.source || 'Live Feed'}
                    </Typography>
                    <Chip
                      label={camera.status === 'active' ? 'LIVE' : 'OFFLINE'}
                      color={camera.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  {/* Video Stream */}
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      bgcolor: '#000',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {camera.status === 'active' ? (
                      <img
                        src={`${getCurrentURL()}/camera/${camera.camera_id}/frame`}
                        alt={`Camera ${camera.camera_id}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        <Typography>Camera Offline</Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Camera Info */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<LocalParking />}
                      label={`${camera.slots_count || 0} Slots Monitored`}
                      size="small"
                      variant="outlined"
                    />
                    {visionMode === 'real' && (
                      <Chip
                        icon={<DirectionsCar />}
                        label="YOLOv8 Detection Active"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">No cameras available. Start the vision service to see live feeds.</Alert>
          </Grid>
        )}
      </Grid>

      {/* Parking Slots Status */}
      {Object.keys(slotStatus).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              🅿️ Parking Slot Status (Real-Time Detection)
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(slotStatus).map(([slotId, status]) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={slotId}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: status.occupied ? '#ffebee' : '#e8f5e9',
                      border: 2,
                      borderColor: status.occupied ? '#f44336' : '#4caf50',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {slotId}
                    </Typography>
                    <Chip
                      label={status.occupied ? 'OCCUPIED' : 'FREE'}
                      color={status.occupied ? 'error' : 'success'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RealVisionFeed;
