import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  CameraAlt,
  Fingerprint,
  CheckCircle,
  LocalParking,
  ExitToApp,
  Payment,
  PlayArrow,
  Replay,
} from '@mui/icons-material';

const SystemFlow = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const steps = [
    {
      label: '🚗 Vehicle Arrival',
      icon: <DirectionsCar />,
      description: 'Vehicle approaches entry gate',
      details: [
        'Vehicle detected by proximity sensor',
        'Entry gate ESP32 prepares for authentication',
        'LED indicators show system ready',
      ],
      technology: ['ESP32 Microcontroller', 'Proximity Sensor', 'LED Indicators'],
      color: '#2196f3',
    },
    {
      label: '📹 Vision Detection',
      icon: <CameraAlt />,
      description: 'YOLOv8 AI detects and identifies vehicle',
      details: [
        'Camera captures live video stream',
        'YOLOv8 model processes frames in real-time',
        'Vehicle bounding box and confidence score calculated',
        'Vehicle type classified (car, truck, etc.)',
      ],
      technology: ['YOLOv8 AI Model', 'OpenCV', 'Real-time Video Processing', 'MJPEG Streaming'],
      color: '#9c27b0',
    },
    {
      label: '🔐 RFID Authentication',
      icon: <Fingerprint />,
      description: 'User scans RFID card for access',
      details: [
        'User presents RFID card to reader',
        'Card UID read by RC522 module',
        'UID sent to backend for validation',
        'User account and balance verified',
      ],
      technology: ['RC522 RFID Reader', 'RFID Cards/Tags', 'ESP32 Communication', 'REST API'],
      color: '#ff9800',
    },
    {
      label: '✅ User Verification',
      icon: <CheckCircle />,
      description: 'Backend validates user credentials',
      details: [
        'Backend receives RFID UID from ESP32',
        'MongoDB database queried for user record',
        'Account balance and status checked',
        'License plate cross-referenced (optional)',
        'Authentication result sent back to ESP32',
      ],
      technology: ['FastAPI Backend', 'MongoDB Database', 'JWT Authentication', 'REST API'],
      color: '#4caf50',
    },
    {
      label: '🅿️ Slot Assignment',
      icon: <LocalParking />,
      description: 'System assigns available parking slot',
      details: [
        'Vision service provides real-time slot occupancy',
        'Aggregator coordinates slot allocation',
        'Optimal slot selected based on availability',
        'Slot reserved for incoming vehicle',
        'User notified of assigned slot',
      ],
      technology: ['Vision Service', 'Aggregator Service', 'MQTT Protocol', 'Slot Management Algorithm'],
      color: '#00bcd4',
    },
    {
      label: '🚪 Entry Gate Opens',
      icon: <ExitToApp />,
      description: 'Gate opens for vehicle entry',
      details: [
        'ESP32 receives approval from backend',
        'Servo motor activates to open gate',
        'LED changes to green indicating access',
        'Session started in database',
        'Entry timestamp recorded',
      ],
      technology: ['Servo Motor', 'ESP32 GPIO Control', 'MQTT Messaging', 'Session Management'],
      color: '#8bc34a',
    },
    {
      label: '⏱️ Active Parking Session',
      icon: <LocalParking />,
      description: 'Vehicle parks in assigned slot',
      details: [
        'Vehicle occupies assigned slot',
        'Vision system confirms slot occupied',
        'Parking timer starts',
        'Real-time charge calculated based on duration',
        'Slot status updated in database',
      ],
      technology: ['Real-time Monitoring', 'Vision Tracking', 'Charge Calculation', 'WebSocket Updates'],
      color: '#ff5722',
    },
    {
      label: '🚗 Vehicle Exit',
      icon: <DirectionsCar />,
      description: 'Vehicle approaches exit gate',
      details: [
        'User scans RFID at exit gate',
        'Session retrieved from database',
        'Total parking duration calculated',
        'Final charge computed',
        'Slot marked as available',
      ],
      technology: ['Exit ESP32', 'RFID Reader', 'Session Retrieval', 'Duration Calculation'],
      color: '#3f51b5',
    },
    {
      label: '💳 Payment Processing',
      icon: <Payment />,
      description: 'Payment deducted and gate opens',
      details: [
        'Total charge calculated (₹20/hour)',
        'Amount deducted from user balance',
        'Payment transaction recorded',
        'Exit gate opens',
        'Thank you message displayed',
        'Session closed in database',
      ],
      technology: ['Payment Gateway', 'Transaction Management', 'Balance Update', 'Receipt Generation'],
      color: '#e91e63',
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => Math.min(prevActiveStep + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  React.useEffect(() => {
    let interval;
    if (autoPlay && activeStep < steps.length - 1) {
      interval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= steps.length - 1) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, activeStep, steps.length]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          🔄 Smart Parking System Flow
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={autoPlay ? 'contained' : 'outlined'}
            startIcon={autoPlay ? <Replay /> : <PlayArrow />}
            onClick={toggleAutoPlay}
            color="primary"
          >
            {autoPlay ? 'Stop Auto' : 'Auto Play'}
          </Button>
          <Button variant="outlined" onClick={handleReset} disabled={activeStep === 0}>
            Reset
          </Button>
        </Box>
      </Box>

      {/* Flow Diagram */}
      <Grid container spacing={3}>
        {/* Stepper */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                System Workflow
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        <Typography variant="caption" color="textSecondary">
                          Step {index + 1} of {steps.length}
                        </Typography>
                      }
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: index <= activeStep ? step.color : '#ccc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {step.icon}
                        </Box>
                      )}
                    >
                      <Typography sx={{ fontWeight: 'bold' }}>{step.label}</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {step.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Button size="small" onClick={handleNext} disabled={index === steps.length - 1}>
                          {index === steps.length - 1 ? 'Finish' : 'Continue'}
                        </Button>
                        <Button size="small" onClick={handleBack} disabled={index === 0} sx={{ ml: 1 }}>
                          Back
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Details Panel */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderLeft: 4, borderColor: steps[activeStep].color }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: steps[activeStep].color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 30,
                  }}
                >
                  {steps[activeStep].icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {steps[activeStep].label}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {steps[activeStep].description}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Process Details */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                📋 Process Details
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {steps[activeStep].details.map((detail, idx) => (
                  <Typography component="li" key={idx} variant="body2" sx={{ mb: 1 }}>
                    {detail}
                  </Typography>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Technologies Used */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                🛠️ Technologies Used
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {steps[activeStep].technology.map((tech, idx) => (
                  <Chip
                    key={idx}
                    label={tech}
                    size="small"
                    sx={{ bgcolor: steps[activeStep].color + '20', color: steps[activeStep].color }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <Paper elevation={3} sx={{ mt: 3, p: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Overall Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flexGrow: 1, height: 8, bgcolor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${((activeStep + 1) / steps.length) * 100}%`,
                    height: '100%',
                    bgcolor: steps[activeStep].color,
                    transition: 'width 0.5s ease',
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {Math.round(((activeStep + 1) / steps.length) * 100)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* System Architecture Overview */}
      <Card elevation={3} sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            🏗️ System Architecture
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Frontend Layer
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • React.js Dashboard
                  <br />
                  • Material-UI Components
                  <br />
                  • Real-time WebSocket Updates
                  <br />• Responsive Design
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#f3e5f5' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Backend Services
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • FastAPI REST Server
                  <br />
                  • YOLOv8 Vision Service
                  <br />
                  • Aggregator (MQTT Coordinator)
                  <br />• MongoDB Database
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#fff3e0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Hardware Layer
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • ESP32 Microcontrollers (2x)
                  <br />
                  • RC522 RFID Readers
                  <br />
                  • Servo Motors (Gates)
                  <br />• IP/USB Cameras
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemFlow;
