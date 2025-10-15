import React, { useState } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Lock,
  Person,
  Visibility,
  VisibilityOff,
  DirectionsCar,
  Security,
  Speed,
} from '@mui/icons-material';
import axios from 'axios';

export default function LoginNew({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/admin/login', credentials);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Using demo mode.');
      // Demo mode - bypass login for testing
      const demoUser = { username: 'demo', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(demoUser));
      setTimeout(() => onLogin(demoUser), 1000);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <DirectionsCar sx={{ fontSize: 40 }} />, text: 'Real-time Slot Tracking' },
    { icon: <Security sx={{ fontSize: 40 }} />, text: 'RFID Secure Access' },
    { icon: <Speed sx={{ fontSize: 40 }} />, text: 'AI-Powered Vision' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'float 20s infinite alternate',
        },
        '@keyframes float': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(50px, 50px) scale(1.1)' },
        },
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Left Side - Branding & Features */}
            <Box
              sx={{
                flex: 1,
                minWidth: 300,
                color: 'white',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <Zoom in timeout={1000}>
                <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      letterSpacing: '-1px',
                    }}
                  >
                    Smart Parking
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      opacity: 0.9,
                      fontWeight: 300,
                    }}
                  >
                    Next-Gen Parking Management System
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 6 }}>
                    {features.map((feature, index) => (
                      <Fade in timeout={1200 + index * 200} key={index}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                              transform: 'translateX(10px)',
                            },
                          }}
                        >
                          {feature.icon}
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {feature.text}
                          </Typography>
                        </Box>
                      </Fade>
                    ))}
                  </Box>
                </Box>
              </Zoom>
            </Box>

            {/* Right Side - Login Card */}
            <Box sx={{ flex: 1, minWidth: 400, maxWidth: 500 }}>
              <Zoom in timeout={600}>
                <Card
                  elevation={24}
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  }}
                >
                  {/* Header with Gradient */}
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      p: 4,
                      textAlign: 'center',
                      color: 'white',
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                      }}
                    >
                      <DirectionsCar sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      Welcome Back
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Sign in to access your dashboard
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 4 }}>
                    {error && (
                      <Fade in>
                        <Alert
                          severity="info"
                          sx={{
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              fontSize: 24,
                            },
                          }}
                        >
                          {error}
                        </Alert>
                      </Fade>
                    )}

                    <form onSubmit={handleSubmit}>
                      <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        margin="normal"
                        required
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
                            },
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        margin="normal"
                        required
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
                            },
                          },
                        }}
                      />

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={loading}
                        sx={{
                          mt: 4,
                          py: 1.8,
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                            transform: 'translateY(-2px)',
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                          },
                        }}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>

                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Demo credentials: admin / admin123
                        </Typography>
                      </Box>
                    </form>
                  </CardContent>
                </Card>
              </Zoom>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}
