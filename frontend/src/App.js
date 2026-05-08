import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LiveblocksProvider } from '@liveblocks/react';
import { AppBar, Toolbar, Typography, Button, Box, Container, ThemeProvider, createTheme, CssBaseline, useMediaQuery, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import Workspace3DMPage from './pages/Workspace3DMPage';
import DocumentationPage from './pages/DocumentationPage';
import ComputeTestPage from './pages/ComputeTestPage';
import NodeParserDemo from './pages/NodeParserDemo';
import InteractiveNodesDemo from './pages/InteractiveNodesDemo';
import ThemeToggle from './components/ThemeToggle';
import useThemeStore from './store/themeStore';
import './App.css';

function App() {
  const publicApiKey = process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY;
  const { mode } = useThemeStore();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const theme = useMemo(() => {
    const themeMode = mode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : mode;
    return createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: themeMode === 'light' ? '#eeeeee' : '#424242',
        },
      },
    });
  }, [mode, prefersDarkMode]);

  if (!publicApiKey) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Liveblocks API key is missing. Please check your .env file.
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AppBar position="static">
              <Toolbar variant="dense" sx={{ minHeight: 48 }}>
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenuOpen}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      minWidth: 200,
                    }
                  }}
                >
                  <MenuItem component={Link} to="/" onClick={handleMenuClose}>
                    Home
                  </MenuItem>
                  <MenuItem component={Link} to="/workspace3dm" onClick={handleMenuClose}>
                    Workspace 3DM
                  </MenuItem>
                  <MenuItem component={Link} to="/node-parser" onClick={handleMenuClose}>
                    Graph Editor
                  </MenuItem>
                  <MenuItem component={Link} to="/compute-test" onClick={handleMenuClose}>
                    Compute Test
                  </MenuItem>
                  <MenuItem component={Link} to="/docs" onClick={handleMenuClose}>
                    Docs
                  </MenuItem>
                </Menu>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: 'inline-block' }}
                  >
                    <path
                      d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                  </svg>
                  CloudHopper
                </Typography>
                <ThemeToggle />
              </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
                <Route path="/workspace3dm" element={<Workspace3DMPage />} />
                <Route path="/workspace3dm/:workspaceId" element={<Workspace3DMPage />} />
                <Route path="/node-parser" element={<NodeParserDemo />} />
                <Route path="/node-parser/:workspaceId" element={<NodeParserDemo />} />
                <Route path="/compute-test" element={<ComputeTestPage />} />
                {/* <Route path="/interactive" element={<InteractiveNodesDemo />} /> */}
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
      </ThemeProvider>
    </LiveblocksProvider>
  );
}

export default App;
