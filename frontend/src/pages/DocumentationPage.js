import React from 'react';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';

function DocumentationPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Documentation
      </Typography>
      <Typography variant="body1" gutterBottom>
        This is a placeholder documentation page. You can expand it with real docs, code examples, or links.
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="Getting Started" secondary="How to begin using the workspace" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Workspace" secondary="Details about the flow editor and nodes" />
        </ListItem>
        <ListItem>
          <ListItemText primary="FAQ" secondary="Common questions and answers" />
        </ListItem>
      </List>
    </Container>
  );
}

export default DocumentationPage;
