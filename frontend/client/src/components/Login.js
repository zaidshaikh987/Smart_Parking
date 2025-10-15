import React, { useState } from 'react';
import { 
  Container, Box, Card, CardContent, TextField, 
  Button, Typography, Alert 
} from '@mui/material';
import { Lock, Person } from '@mui/icons-material';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', credentials);
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

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10 }}>
        <Card elevation={10}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              🚗 Smart Parking Admin
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 4 }}>
              Sign in to access the dashboard
            </Typography>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                required
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'gray' }} />
                }}
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                required
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'gray' }} />
                }}
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
