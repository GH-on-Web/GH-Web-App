import React from 'react';
import { Container, Typography } from '@mui/material';

function HomePage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>
      <Typography variant="body1">
        Welcome to the app. Use the navigation bar to switch between Workspace and Documentation.
      </Typography>
    </Container>
  );
}

export default HomePage;
