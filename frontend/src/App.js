import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LiveblocksProvider } from '@liveblocks/react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import DocumentationPage from './pages/DocumentationPage';
import './App.css';

function App() {
  const publicApiKey = process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY;
  
  if (!publicApiKey) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Liveblocks API key is missing. Please check your .env file.
        </Typography>
      </Box>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <Router>
        <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                GH Web Workspace
              </Typography>
              <Button color="inherit" component={Link} to="/">
                Home
              </Button>
              <Button color="inherit" component={Link} to="/workspace">
                Workspace
              </Button>
              <Button color="inherit" component={Link} to="/docs">
                Docs
              </Button>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
              <Route path="/docs" element={<DocumentationPage />} />
            </Routes>
          </Box>
          <Box component="footer" sx={{ py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Container>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} GH Web Workspace
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </LiveblocksProvider>
  );
}

export default App;
