import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AccountTree, ViewInAr } from '@mui/icons-material';
import useViewModeStore from '../store/viewModeStore';

function ViewModeToggle() {
  const { mode, setMode } = useViewModeStore();

  const handleChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label="view mode"
    >
      <ToggleButton value="graph" aria-label="graph mode">
        <AccountTree fontSize="small" />
      </ToggleButton>
      <ToggleButton value="3d" aria-label="3d mode">
        <ViewInAr fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default ViewModeToggle;
