import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Stepper, Step, StepLabel,
  Paper, Chip, Alert, LinearProgress, Avatar, Divider
} from '@mui/material';
import {
  DirectionsCar, CameraAlt, Badge, LocalParking, Timer, AttachMoney,
  CheckCircle, ExitToApp, CreditCard, Videocam
} from '@mui/icons-material';
import { sessionsAPI, usersAPI, slotsAPI } from '../services/api';

export default function LiveDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [detectedRFID, setDetectedRFID] = useState('');
  const [detectedPlate, setDetectedPlate] = useState('');
  const [assignedSlot, setAssignedSlot] = useState(null);
  const [entryTime, setEntryTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [charge, setCharge] = useState(0);
  const [cameraFeed, setCameraFeed] = useState('entry');
  const [logs, setLogs] = useState([]);

  const steps = [
    'Vehicle Approaching',
    'RFID & Plate Detection',
    'Authentication',
    'Slot Assignment',
    'Parking Session',
    'Exit & Payment'
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time: timestamp, message, type }]);
  };

  const simulateEntryFlow = async () => {
    setDemoRunning(true);
    setActiveStep(0);
    setLogs([]);
    
    // Step 1: Vehicle Approaching
    addLog('🚗 Vehicle detected at entry gate', 'info');
    setCameraFeed('entry');
    setActiveStep(1);
    await sleep(2000);
    
    // Step 2: RFID & Plate Detection
    addLog('📡 Scanning RFID tag...', 'info');
    await sleep(1500);
    const rfid = 'RFID001';
    setDetectedRFID(rfid);
    addLog(`✅ RFID detected: ${rfid}`, 'success');
    await sleep(1000);
    
    addLog('📷 Capturing license plate...', 'info');
    await sleep(1500);
    const plate = 'MH-12-AB-1234';
    setDetectedPlate(plate);
    addLog(`✅ License plate detected: ${plate}`, 'success');
    setActiveStep(2);
    await sleep(2000);
    
    // Step 3: Authentication
    addLog('🔍 Verifying user credentials...', 'info');
    await sleep(1500);
    try {
      const userResponse = await usersAPI.getByRFID(rfid);
      addLog(`✅ User authenticated: ${userResponse.data.user_name}`, 'success');
      addLog(`💰 Wallet balance: ₹${userResponse.data.wallet_balance}`, 'info');
      setActiveStep(3);
      await sleep(2000);
      
      // Step 4: Slot Assignment
      addLog('🔍 Finding available parking slot...', 'info');
      setCameraFeed('parking');
      await sleep(2000);
      
      const slotsResponse = await slotsAPI.getAll();
      const availableSlot = slotsResponse.data.find(s => !s.is_occupied);
      
      if (availableSlot) {
        setAssignedSlot(availableSlot);
        addLog(`✅ Slot assigned: ${availableSlot.slot_name}`, 'success');
        addLog(`📍 Location: Zone ${availableSlot.camera_id}`, 'info');
        
        // Update slot to occupied
        await slotsAPI.updateStatus(availableSlot.slot_id, { is_occupied: true });
        addLog('🚧 Slot marked as occupied', 'info');
        setActiveStep(4);
        await sleep(2000);
        
        // Step 5: Entry complete - Start session
        addLog('🎫 Creating parking session...', 'info');
        const now = new Date();
        setEntryTime(now);
        setCurrentSession({
          session_id: `DEMO_${Date.now()}`,
          rfid_id: rfid,
          user_name: userResponse.data.user_name,
          vehicle_no: plate,
          slot_id: availableSlot.slot_id,
          entry_time: now.toISOString(),
          status: 'active'
        });
        addLog('✅ Parking session started', 'success');
        addLog('🚪 Opening entry gate...', 'info');
        await sleep(1500);
        addLog('✅ Gate opened - Welcome!', 'success');
        
        // Start duration timer
        const timer = setInterval(() => {
          setDuration(prev => prev + 1);
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          setCharge(Math.ceil(mins / 60) * 20); // ₹20 per hour
        }, 1000);
        
        await sleep(5000);
        setActiveStep(5);
        
      } else {
        addLog('❌ No parking slots available', 'error');
      }
    } catch (error) {
      addLog('❌ Authentication failed', 'error');
    }
  };

  const simulateExit = async () => {
    if (!currentSession) return;
    
    addLog('🚗 Vehicle detected at exit gate', 'info');
    setCameraFeed('exit');
    await sleep(1500);
    
    addLog('📡 Scanning RFID tag...', 'info');
    await sleep(1500);
    addLog(`✅ RFID verified: ${currentSession.rfid_id}`, 'success');
    await sleep(1000);
    
    addLog('⏱️ Calculating parking duration...', 'info');
    await sleep(1000);
    const mins = Math.floor(duration / 60);
    const hours = Math.floor(mins / 60);
    addLog(`⏱️ Duration: ${hours}h ${mins % 60}m ${duration % 60}s`, 'info');
    await sleep(1000);
    
    addLog('💰 Calculating charges...', 'info');
    await sleep(1000);
    const finalCharge = Math.max(10, Math.ceil(mins / 60) * 20);
    setCharge(finalCharge);
    addLog(`💰 Total charge: ₹${finalCharge}`, 'info');
    await sleep(1500);
    
    addLog('💳 Processing payment from wallet...', 'info');
    await sleep(2000);
    addLog('✅ Payment successful!', 'success');
    await sleep(1000);
    
    addLog('🅿️ Freeing parking slot...', 'info');
    if (assignedSlot) {
      await slotsAPI.updateStatus(assignedSlot.slot_id, { is_occupied: false });
    }
    addLog('✅ Slot freed', 'success');
    await sleep(1000);
    
    addLog('🚪 Opening exit gate...', 'info');
    await sleep(1500);
    addLog('✅ Thank you! Safe journey! 🎉', 'success');
    
    setDemoRunning(false);
    setActiveStep(6);
  };

  const resetDemo = () => {
    setActiveStep(0);
    setDemoRunning(false);
    setCurrentSession(null);
    setDetectedRFID('');
    setDetectedPlate('');
    setAssignedSlot(null);
    setEntryTime(null);
    setDuration(0);
    setCharge(0);
    setCameraFeed('entry');
    setLogs([]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🎬 Live Parking System Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Watch the complete flow: Vehicle Entry → RFID Detection → Slot Assignment → Parking → Exit & Payment
      </Typography>

      {/* Control Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<DirectionsCar />}
          onClick={simulateEntryFlow}
          disabled={demoRunning}
        >
          Start Entry Demo
        </Button>
        <Button
          variant="contained"
          color="error"
          size="large"
          startIcon={<ExitToApp />}
          onClick={simulateExit}
          disabled={!currentSession || activeStep !== 4}
        >
          Simulate Exit
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={resetDemo}
        >
          Reset Demo
        </Button>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Camera Feed Simulation */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Videocam sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  {cameraFeed === 'entry' ? '📹 Entry Gate Camera' : 
                   cameraFeed === 'parking' ? '📹 Parking Zone Camera' : 
                   '📹 Exit Gate Camera'}
                </Typography>
              </Box>
              
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  bgcolor: '#000',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Camera Feed Background */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, #1a1a2e 25%, #16213e 25%, #16213e 50%, #1a1a2e 50%, #1a1a2e 75%, #16213e 75%, #16213e)',
                    backgroundSize: '20px 20px',
                    opacity: 0.3
                  }}
                />
                
                {/* Camera Content */}
                <Box sx={{ textAlign: 'center', zIndex: 1, color: 'white' }}>
                  {cameraFeed === 'entry' && (
                    <>
                      <CameraAlt sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
                      <Typography variant="h6">Entry Gate Camera</Typography>
                      {detectedPlate && (
                        <Chip
                          label={detectedPlate}
                          color="success"
                          sx={{ mt: 2, fontSize: '1.2rem', py: 2, px: 1 }}
                        />
                      )}
                    </>
                  )}
                  {cameraFeed === 'parking' && assignedSlot && (
                    <>
                      <LocalParking sx={{ fontSize: 80, mb: 2, color: 'success.main' }} />
                      <Typography variant="h6">Parking Zone</Typography>
                      <Chip
                        label={`Slot ${assignedSlot.slot_name}`}
                        color="success"
                        sx={{ mt: 2, fontSize: '1.2rem', py: 2, px: 1 }}
                      />
                    </>
                  )}
                  {cameraFeed === 'exit' && (
                    <>
                      <ExitToApp sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
                      <Typography variant="h6">Exit Gate Camera</Typography>
                    </>
                  )}
                </Box>

                {/* Live Indicator */}
                <Chip
                  label="● LIVE"
                  color="error"
                  size="small"
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Detection Info */}
          {(detectedRFID || detectedPlate || assignedSlot) && (
            <Card elevation={3} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 Detection Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {detectedRFID && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge color="primary" />
                        <Typography><strong>RFID:</strong> {detectedRFID}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {detectedPlate && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCar color="info" />
                        <Typography><strong>License Plate:</strong> {detectedPlate}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {assignedSlot && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalParking color="success" />
                        <Typography><strong>Assigned Slot:</strong> {assignedSlot.slot_name} ({assignedSlot.slot_type})</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Session Info & Logs */}
        <Grid item xs={12} md={6}>
          {/* Session Info */}
          {currentSession && (
            <Card elevation={3} sx={{ mb: 2, bgcolor: '#e8f5e9' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  ✅ Active Parking Session
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Session ID</Typography>
                    <Typography variant="body2" fontFamily="monospace">{currentSession.session_id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">User</Typography>
                    <Typography variant="body2">{currentSession.user_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                    <Typography variant="body2">{currentSession.vehicle_no}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Slot</Typography>
                    <Typography variant="body2">{currentSession.slot_id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timer fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Typography variant="body2" fontWeight="bold">{formatDuration(duration)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney fontSize="small" color="success" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Current Charge</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">₹{charge}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* System Logs */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 System Logs
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  maxHeight: 400,
                  overflow: 'auto',
                  bgcolor: '#1e1e1e',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace'
                }}
              >
                {logs.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ color: '#888' }}>
                    Waiting for demo to start...
                  </Typography>
                )}
                {logs.map((log, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: log.type === 'success' ? '#4caf50' :
                               log.type === 'error' ? '#f44336' :
                               log.type === 'warning' ? '#ff9800' : '#2196f3',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem'
                      }}
                    >
                      [{log.time}] {log.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>How it works:</strong>
        </Typography>
        <Typography variant="body2" component="div">
          1. Click "Start Entry Demo" to simulate a vehicle arriving<br/>
          2. Watch as the system detects RFID, reads license plate, and assigns a parking slot<br/>
          3. A parking session starts with live duration and charge calculation<br/>
          4. Click "Simulate Exit" when ready to end the session<br/>
          5. The system calculates final charges and processes payment automatically
        </Typography>
      </Alert>
    </Box>
  );
}
