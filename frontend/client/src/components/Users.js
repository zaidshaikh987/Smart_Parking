import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Alert,
  InputAdornment, Tabs, Tab
} from '@mui/material';
import {
  PersonAdd, Edit, Delete, AccountBalanceWallet, CreditCard,
  Search, Phone, Email, DirectionsCar, Badge
} from '@mui/icons-material';
import { usersAPI, walletAPI } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openWalletDialog, setOpenWalletDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState({
    rfid_id: '',
    user_name: '',
    vehicle_no: '',
    contact: '',
    email: '',
    initial_balance: 100
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.rfid_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setFormData({
      rfid_id: '',
      user_name: '',
      vehicle_no: '',
      contact: '',
      email: '',
      initial_balance: 100
    });
    setSelectedUser(null);
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setFormData({
      rfid_id: user.rfid_id,
      user_name: user.user_name,
      vehicle_no: user.vehicle_no,
      contact: user.contact,
      email: user.email,
      initial_balance: user.wallet_balance || 0
    });
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleManageWallet = async (user) => {
    try {
      const response = await walletAPI.getBalance(user.rfid_id);
      setSelectedUser({ ...user, wallet_balance: response.data.balance });
      setOpenWalletDialog(true);
    } catch (err) {
      setError('Failed to load wallet details');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (selectedUser) {
        await usersAPI.update(formData.rfid_id, formData);
        setSuccess('User updated successfully');
      } else {
        await usersAPI.create(formData);
        setSuccess('User registered successfully');
      }
      
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (rfidId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setLoading(true);
      await usersAPI.delete(rfidId);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleTopupWallet = async (amount) => {
    try {
      setLoading(true);
      await walletAPI.topup({
        rfid_id: selectedUser.rfid_id,
        amount: parseFloat(amount),
        payment_method: 'manual_admin'
      });
      setSuccess(`₹${amount} added to wallet successfully`);
      setOpenWalletDialog(false);
      fetchUsers();
    } catch (err) {
      setError('Failed to top up wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          👥 RFID User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleAddUser}
          size="large"
        >
          Register New User
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h4" color="primary">{users.length}</Typography>
              <Typography variant="body2">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {users.filter(u => u.is_active).length}
              </Typography>
              <Typography variant="body2">Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                ₹{users.reduce((sum, u) => sum + (u.wallet_balance || 0), 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">Total Wallet Balance</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#fce4ec' }}>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {users.filter(u => (u.wallet_balance || 0) < 50).length}
              </Typography>
              <Typography variant="body2">Low Balance Users</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by name, RFID, or vehicle number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Users Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>RFID Tag</strong></TableCell>
              <TableCell><strong>User Name</strong></TableCell>
              <TableCell><strong>Vehicle No.</strong></TableCell>
              <TableCell><strong>Contact</strong></TableCell>
              <TableCell><strong>Wallet Balance</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.rfid_id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge color="primary" />
                    <Typography fontWeight="bold">{user.rfid_id}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.user_name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCar fontSize="small" />
                    {user.vehicle_no}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" />
                    {user.contact}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<AccountBalanceWallet />}
                    label={`₹${(user.wallet_balance || 0).toFixed(2)}`}
                    color={user.wallet_balance > 100 ? 'success' : user.wallet_balance > 50 ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleManageWallet(user)}
                    title="Manage Wallet"
                  >
                    <CreditCard />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleEditUser(user)}
                    title="Edit User"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteUser(user.rfid_id)}
                    title="Delete User"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? '✏️ Edit User' : '➕ Register New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RFID Tag ID"
                value={formData.rfid_id}
                onChange={(e) => setFormData({ ...formData, rfid_id: e.target.value })}
                disabled={!!selectedUser}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Badge /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User Name"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={formData.vehicle_no}
                onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><DirectionsCar /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Initial Wallet Balance"
                type="number"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                disabled={!!selectedUser}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {selectedUser ? 'Update' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wallet Management Dialog */}
      <Dialog open={openWalletDialog} onClose={() => setOpenWalletDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>💰 Manage Wallet - {selectedUser?.user_name}</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h3" color="primary" gutterBottom>
              ₹{(selectedUser?.wallet_balance || 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Balance
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 3 }}>
              {[100, 250, 500, 1000].map(amount => (
                <Grid item xs={6} key={amount}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleTopupWallet(amount)}
                    startIcon={<AccountBalanceWallet />}
                  >
                    + ₹{amount}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWalletDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
