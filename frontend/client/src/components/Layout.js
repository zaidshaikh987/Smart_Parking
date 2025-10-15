import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer, List,
  ListItem, ListItemIcon, ListItemText, ListItemButton
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon,
  LocalParking, ExitToApp, People, DirectionsCar,
  Settings, Videocam, PlayCircle, AccountTree
} from '@mui/icons-material';

export default function Layout({ children, user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: '🎬 Live Demo', icon: <PlayCircle />, path: '/demo' },
    { text: '📹 Real Vision Feed', icon: <Videocam />, path: '/vision' },
    { text: '🔄 System Flow', icon: <AccountTree />, path: '/flow' },
    { text: 'Parking Slots', icon: <LocalParking />, path: '/parking' },
    { text: 'RFID Users', icon: <People />, path: '/users' },
    { text: 'Active Sessions', icon: <DirectionsCar />, path: '/sessions' },
    { text: 'System Monitor', icon: <Settings />, path: '/system' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🚗 Smart Parking System
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.username || 'Admin'}
          </Typography>
          <IconButton color="inherit" onClick={onLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280, mt: 8 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 8, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
