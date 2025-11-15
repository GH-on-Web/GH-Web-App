import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import DocumentationPage from './pages/DocumentationPage';
import './App.css';

function App() {
  return (
    <Router>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar position="static">
          <Toolbar variant="dense" sx={{ minHeight: 48 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
              GH Web Workspace
            </Typography>
            <Button color="inherit" component={Link} to="/" size="small">
              Home
            </Button>
            <Button color="inherit" component={Link} to="/workspace" size="small">
              Workspace
            </Button>
            <Button color="inherit" component={Link} to="/docs" size="small">
              Docs
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/docs" element={<DocumentationPage />} />
          </Routes>
        </Box>
        <Box component="footer" sx={{ py: 0.5, px: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} GH Web Workspace
          </Typography>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
