import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Alert, Divider
} from '@mui/material';
import {
  CheckCircle, Cancel, Refresh, Videocam, Router, Memory,
  DeveloperBoard, MeetingRoom, SignalCellularAlt
} from '@mui/icons-material';
import { systemAPI, visionAPI, aggregatorAPI } from '../services/api';

export default function SystemMonitor() {
  const [backendStatus, setBackendStatus] = useState({ connected: false });
  const [visionStatus, setVisionStatus] = useState({ status: 'offline', cameras: [] });
  const [aggregatorStatus, setAggregatorStatus] = useState({ status: 'offline' });
  const [gateStatuses, setGateStatuses] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllStatus();
    const interval = setInterval(fetchAllStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllStatus = async () => {
    try {
      setLoading(true);
      
      // Backend status
      try {
        const backendRes = await systemAPI.getStatus();
        setBackendStatus({ ...backendRes.data, connected: true });
      } catch {
        setBackendStatus({ connected: false });
      }

      // Vision service status
      try {
        const visionRes = await visionAPI.getStatus();
        setVisionStatus(visionRes.data);
      } catch {
        setVisionStatus({ status: 'offline', cameras: [] });
      }

      // Aggregator status
      try {
        const aggRes = await aggregatorAPI.getStatus();
        setAggregatorStatus(aggRes.data);
      } catch {
        setAggregatorStatus({ status: 'offline', mqtt_connected: false });
      }

      // ESP32 gates status (simulator IPs)
      const gateIPs = ['127.0.0.1:8100', '127.0.0.1:8101'];
      const gatePromises = gateIPs.map(async (ip) => {
        try {
          const res = await systemAPI.getGateStatus(ip);
          return [ip, { ...res.data, connected: true }];
        } catch {
          return [ip, { connected: false }];
        }
      });
      const gateResults = await Promise.all(gatePromises);
      setGateStatuses(Object.fromEntries(gateResults));
      
    } finally {
      setLoading(false);
    }
  };

  const StatusChip = ({ status, label }) => {
    const isOnline = status === 'online' || status === 'running' || status === true;
    return (
      <Chip
        icon={isOnline ? <CheckCircle /> : <Cancel />}
        label={label || (isOnline ? 'Online' : 'Offline')}
        color={isOnline ? 'success' : 'error'}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          ⚙️ System Monitor
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchAllStatus}
          disabled={loading}
        >
          Refresh All
        </Button>
      </Box>

      {/* Backend Service */}
      <Card sx={{ mb: 3 }} elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Memory sx={{ fontSize: 40, color: backendStatus.connected ? 'success.main' : 'error.main' }} />
              <Typography variant="h5">FastAPI Backend</Typography>
            </Box>
            <StatusChip status={backendStatus.connected} />
          </Box>
          {backendStatus.connected && (
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Total Slots</Typography>
                <Typography variant="h6">{backendStatus.total_slots || 0}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Occupied</Typography>
                <Typography variant="h6">{backendStatus.occupied_slots || 0}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Free</Typography>
                <Typography variant="h6">{backendStatus.free_slots || 0}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Occupancy</Typography>
                <Typography variant="h6">{backendStatus.occupancy_rate || '0%'}</Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Vision Service */}
      <Card sx={{ mb: 3 }} elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Videocam sx={{ fontSize: 40, color: visionStatus.status === 'online' ? 'success.main' : 'error.main' }} />
              <Typography variant="h5">Vision Service (YOLOv8)</Typography>
            </Box>
            <StatusChip status={visionStatus.status} />
          </Box>
          {visionStatus.status === 'online' && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Cameras:</strong> {visionStatus.cameras?.length || 0} active
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {visionStatus.cameras?.map((cam, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2"><strong>{cam.camera_id}</strong></Typography>
                      <Typography variant="caption">Slots: {cam.slots_count || 0}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Aggregator Service */}
      <Card sx={{ mb: 3 }} elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Router sx={{ fontSize: 40, color: aggregatorStatus.status === 'online' ? 'success.main' : 'error.main' }} />
              <Typography variant="h5">Aggregator Service</Typography>
            </Box>
            <StatusChip status={aggregatorStatus.status} />
          </Box>
          {aggregatorStatus.status === 'online' && (
            <Grid container spacing={2}>
              <Grid item xs={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SignalCellularAlt />
                  <Box>
                    <Typography variant="caption">MQTT Broker</Typography>
                    <Typography variant="body2">
                      <StatusChip status={aggregatorStatus.mqtt_connected} label={aggregatorStatus.mqtt_connected ? 'Connected' : 'Disconnected'} />
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Videocam />
                  <Box>
                    <Typography variant="caption">Vision Link</Typography>
                    <Typography variant="body2">
                      <StatusChip status={aggregatorStatus.vision_connected} label={aggregatorStatus.vision_connected ? 'Connected' : 'Disconnected'} />
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Memory />
                  <Box>
                    <Typography variant="caption">Backend Link</Typography>
                    <Typography variant="body2">
                      <StatusChip status={aggregatorStatus.backend_connected} label={aggregatorStatus.backend_connected ? 'Connected' : 'Disconnected'} />
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* ESP32 Gate Controllers */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeveloperBoard /> ESP32 Gate Controllers
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2, bgcolor: '#fafafa' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Gate ID / IP</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Gate Position</strong></TableCell>
                  <TableCell><strong>RFID Reader</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(gateStatuses).map(([ip, status]) => (
                  <TableRow key={ip}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{ip}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={status.connected} />
                    </TableCell>
                    <TableCell>
                      {status.connected ? (
                        <Chip 
                          label={status.gate_open ? 'OPEN' : 'CLOSED'} 
                          color={status.gate_open ? 'warning' : 'success'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {status.connected ? (
                        status.rfid_connected ? 
                          <Chip label="Connected" color="success" size="small" /> :
                          <Chip label="Error" color="error" size="small" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!status.connected}
                        startIcon={<MeetingRoom />}
                        onClick={() => systemAPI.controlGate(ip, status.gate_open ? 'close' : 'open')}
                      >
                        {status.gate_open ? 'Close' : 'Open'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {Object.keys(gateStatuses).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No gate controllers configured
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
