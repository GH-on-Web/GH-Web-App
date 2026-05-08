import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * ErrorBoundary - Catches React errors and prevents app crash
 * Specifically handles ResizeObserver errors gracefully
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a ResizeObserver error
    const errorMessage = error?.message || error?.toString() || '';
    const isResizeObserverError = 
      errorMessage.includes('ResizeObserver') ||
      errorMessage.includes('ResizeObserver loop');
    
    // If it's a ResizeObserver error, don't show error boundary
    if (isResizeObserverError) {
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error but don't crash for ResizeObserver errors
    const errorMessage = error?.message || error?.toString() || '';
    if (!errorMessage.includes('ResizeObserver')) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="error">
            Something went wrong
          </Typography>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

