import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LiveblocksProvider } from '@liveblocks/react';
import { AppBar, Toolbar, Typography, Button, Box, Container, ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import Workspace3DMPage from './pages/Workspace3DMPage';
import DocumentationPage from './pages/DocumentationPage';
import NodeParserDemo from './pages/NodeParserDemo';
import InteractiveNodesDemo from './pages/InteractiveNodesDemo';
import ThemeToggle from './components/ThemeToggle';
import useThemeStore from './store/themeStore';
import './App.css';

function App() {
  const publicApiKey = process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY;
  const { mode } = useThemeStore();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

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
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
                  GH Web Workspace
                </Typography>
                <Button color="inherit" component={Link} to="/" size="small">
                  Home
                </Button>
                <Button color="inherit" component={Link} to="/workspace" size="small">
                  Workspace
                </Button>
                <Button color="inherit" component={Link} to="/workspace3dm" size="small">
                  Workspace 3DM
                </Button>
                <Button color="inherit" component={Link} to="/node-parser" size="small">
                  Graph Editor
                </Button>
                <Button color="inherit" component={Link} to="/interactive" size="small">
                  Interactive
                </Button>
                <Button color="inherit" component={Link} to="/docs" size="small">
                  Docs
                </Button>
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
