import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness } from '@mui/icons-material';
import useThemeStore from '../store/themeStore';

function ThemeToggle() {
  const { mode, setMode } = useThemeStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    handleClose();
  };

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Brightness7 />;
      case 'dark':
        return <Brightness4 />;
      default:
        return <SettingsBrightness />;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} size="small">
        {getIcon()}
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleModeChange('light')} selected={mode === 'light'}>
          <ListItemIcon>
            <Brightness7 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Light</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleModeChange('dark')} selected={mode === 'dark'}>
          <ListItemIcon>
            <Brightness4 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dark</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleModeChange('system')} selected={mode === 'system'}>
          <ListItemIcon>
            <SettingsBrightness fontSize="small" />
          </ListItemIcon>
          <ListItemText>System</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default ThemeToggle;
