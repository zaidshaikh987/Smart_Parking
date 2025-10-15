import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { ExitToApp, Timer, AttachMoney, DirectionsCar, Badge, Refresh } from '@mui/icons-material';
import { sessionsAPI } from '../services/api';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [exitDialog, setExitDialog] = useState(false);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionsAPI.getActive();
      setSessions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const calculateDuration = (entryTime) => {
    const now = new Date();
    const entry = new Date(entryTime);
    const diffMs = now - entry;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const estimateCharge = (entryTime) => {
    const now = new Date();
    const entry = new Date(entryTime);
    const diffHours = Math.ceil((now - entry) / (1000 * 60 * 60));
    return diffHours * 20; // ₹20 per hour
  };

  const handleManualExit = async (session) => {
    setSelectedSession(session);
    setExitDialog(true);
  };

  const confirmManualExit = async () => {
    try {
      setLoading(true);
      await sessionsAPI.manualExit(selectedSession.session_id);
      setSuccess(`Session ${selectedSession.session_id} ended successfully`);
      setExitDialog(false);
      fetchSessions();
    } catch (err) {
      setError('Failed to exit session');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    active: sessions.length,
    totalDuration: sessions.reduce((sum, s) => {
      const duration = (new Date() - new Date(s.entry_time)) / (1000 * 60 * 60);
      return sum + duration;
    }, 0).toFixed(1),
    estimatedRevenue: sessions.reduce((sum, s) => sum + estimateCharge(s.entry_time), 0)
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          🚗 Active Parking Sessions
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchSessions}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h3" color="primary">{stats.active}</Typography>
              <Typography variant="body2">Active Sessions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h3" color="warning.main">{stats.totalDuration}h</Typography>
              <Typography variant="body2">Total Duration</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h3" color="success.main">₹{stats.estimatedRevenue}</Typography>
              <Typography variant="body2">Estimated Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Session ID</strong></TableCell>
              <TableCell><strong>RFID / User</strong></TableCell>
              <TableCell><strong>Vehicle</strong></TableCell>
              <TableCell><strong>Slot</strong></TableCell>
              <TableCell><strong>Entry Time</strong></TableCell>
              <TableCell><strong>Duration</strong></TableCell>
              <TableCell><strong>Est. Charge</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.session_id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {session.session_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {session.rfid_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {session.user_name || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCar fontSize="small" />
                    {session.vehicle_no || 'N/A'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={session.slot_id} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(session.entry_time).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer fontSize="small" />
                    <Typography variant="body2" fontWeight="bold">
                      {calculateDuration(session.entry_time)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney fontSize="small" color="success" />
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      ₹{estimateCharge(session.entry_time)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<ExitToApp />}
                    onClick={() => handleManualExit(session)}
                  >
                    Exit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No active parking sessions
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={exitDialog} onClose={() => setExitDialog(false)}>
        <DialogTitle>🚪 Manual Exit Confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to manually exit this session?
          </Typography>
          {selectedSession && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Session:</strong> {selectedSession.session_id}</Typography>
              <Typography variant="body2"><strong>RFID:</strong> {selectedSession.rfid_id}</Typography>
              <Typography variant="body2"><strong>Duration:</strong> {calculateDuration(selectedSession.entry_time)}</Typography>
              <Typography variant="body2"><strong>Charge:</strong> ₹{estimateCharge(selectedSession.entry_time)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExitDialog(false)}>Cancel</Button>
          <Button onClick={confirmManualExit} variant="contained" color="error" disabled={loading}>
            Confirm Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
