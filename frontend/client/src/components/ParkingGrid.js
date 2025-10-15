import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';

const ParkingSlot = ({ slot }) => {
  const isOccupied = slot.is_occupied;
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        backgroundColor: isOccupied ? '#ffebee' : '#e8f5e9',
        border: isOccupied ? '2px solid #e57373' : '2px solid #81c784',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        }
      }}
    >
      <Box sx={{ fontSize: 40, mb: 1 }}>
        {isOccupied ? (
          <Cancel sx={{ fontSize: 40, color: '#d32f2f' }} />
        ) : (
          <CheckCircle sx={{ fontSize: 40, color: '#388e3c' }} />
        )}
      </Box>
      
      <Typography variant="h6" fontWeight="bold">
        {slot.slot_name}
      </Typography>
      
      <Chip
        label={isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
        size="small"
        color={isOccupied ? 'error' : 'success'}
        sx={{ mt: 1 }}
      />
      
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        {slot.slot_type}
      </Typography>
    </Paper>
  );
};

export default function ParkingGrid() {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/slots');
      setSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      // Demo data if backend not available
      if (slots.length === 0) {
        setSlots([
          { slot_id: 'A1', slot_name: 'A1', is_occupied: false, slot_type: 'standard', camera_id: 'CAM_01' },
          { slot_id: 'A2', slot_name: 'A2', is_occupied: true, slot_type: 'standard', camera_id: 'CAM_01' },
          { slot_id: 'A3', slot_name: 'A3', is_occupied: false, slot_type: 'compact', camera_id: 'CAM_01' },
          { slot_id: 'B1', slot_name: 'B1', is_occupied: true, slot_type: 'standard', camera_id: 'CAM_02' },
          { slot_id: 'B2', slot_name: 'B2', is_occupied: false, slot_type: 'disabled', camera_id: 'CAM_02' },
          { slot_id: 'B3', slot_name: 'B3', is_occupied: false, slot_type: 'standard', camera_id: 'CAM_02' },
        ]);
      }
    }
  };

  const freeSlots = slots.filter(s => !s.is_occupied).length;
  const occupiedSlots = slots.filter(s => s.is_occupied).length;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Paper sx={{ p: 2, flex: 1, bgcolor: '#e8f5e9' }}>
          <Typography variant="h4" color="#388e3c">{freeSlots}</Typography>
          <Typography variant="body2">Available Slots</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, bgcolor: '#ffebee' }}>
          <Typography variant="h4" color="#d32f2f">{occupiedSlots}</Typography>
          <Typography variant="body2">Occupied Slots</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, bgcolor: '#e3f2fd' }}>
          <Typography variant="h4" color="#1976d2">{slots.length}</Typography>
          <Typography variant="body2">Total Slots</Typography>
        </Paper>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        🎭 Live Parking View (Theater Style)
      </Typography>

      <Grid container spacing={2}>
        {slots.map(slot => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={slot.slot_id}>
            <ParkingSlot slot={slot} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
