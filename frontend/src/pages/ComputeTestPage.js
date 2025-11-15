import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, Grid, Paper, TextField, Typography } from '@mui/material';
import useComputeStore from '../store/computeStore';
function FileDrop({ label, accept = '.gh', file, onFileChange }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    if (files?.length) {
      onFileChange(files[0]);
    }
  };

  const onInputChange = (event) => {
    handleFiles(event.target.files);
    event.target.value = null;
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <Paper
      variant="outlined"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      sx={{
        p: 2,
        borderColor: dragActive ? 'primary.main' : 'divider',
        cursor: 'pointer',
        textAlign: 'center',
        mb: 2,
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={onInputChange}
      />
      <Typography variant="subtitle1" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Drop a file or click to browse (.gh only)
      </Typography>
      {file && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Selected: {file.name}
        </Typography>
      )}
    </Paper>
  );
}

function formatResponse(value) {
  if (value instanceof ArrayBuffer) {
    return new TextDecoder('utf-8').decode(value);
  }

  if (value instanceof Blob) {
    return '[Binary blob returned]';
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value ?? '');
}

function ComputeTestPage() {
  const computeStore = useComputeStore();

  const [proxyFile, setProxyFile] = useState(null);
  const [proxyPath, setProxyPath] = useState('');
  const [proxyResult, setProxyResult] = useState('');
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyError, setProxyError] = useState('');

  const [ghFile, setGhFile] = useState(null);
  const [ghResult, setGhResult] = useState('');
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState('');

  const [jsonInput, setJsonInput] = useState('');
  const [jsonToGhLoading, setJsonToGhLoading] = useState(false);
  const [jsonToGhError, setJsonToGhError] = useState('');
  const [jsonToGhDownload, setJsonToGhDownload] = useState(null);
  const [versionResult, setVersionResult] = useState('');
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState('');
  const [healthResult, setHealthResult] = useState('');
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState('');

  useEffect(() => {
    return () => {
      if (jsonToGhDownload?.url) {
        URL.revokeObjectURL(jsonToGhDownload.url);
      }
    };
  }, [jsonToGhDownload]);

  const handleProxyRun = async () => {
    if (!proxyFile) return;
    setProxyLoading(true);
    setProxyError('');

    try {
      const response = await computeStore.proxyGhFile(proxyFile, proxyPath);
      setProxyResult(formatResponse(response));
    } catch (err) {
      setProxyError(err.message || 'Request failed');
    } finally {
      setProxyLoading(false);
    }
  };

  const handleGhToJson = async () => {
    if (!ghFile) return;
    setGhLoading(true);
    setGhError('');

    try {
      const content = await ghFile.text();
      const payload = { fileName: ghFile.name, ghScript: content };
      const result = await computeStore.parseGhToJson(payload);
      setGhResult(JSON.stringify(result, null, 2));
    } catch (err) {
      setGhError(err.message || 'Conversion failed');
    } finally {
      setGhLoading(false);
    }
  };

  const handleJsonToGh = async () => {
    setJsonToGhLoading(true);
    setJsonToGhError('');

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setJsonToGhError('Invalid JSON payload');
      setJsonToGhLoading(false);
      return;
    }

    try {
      const buffer = await computeStore.jsonToGh(parsed);
      if (jsonToGhDownload?.url) {
        URL.revokeObjectURL(jsonToGhDownload.url);
      }
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setJsonToGhDownload({ url, name: `converted-${Date.now()}.gh` });
    } catch (err) {
      setJsonToGhError(err.message || 'Conversion failed');
    } finally {
      setJsonToGhLoading(false);
    }
  };

  const handleFetchVersion = async () => {
    setVersionLoading(true);
    setVersionError('');

    try {
      const response = await computeStore.fetchVersion();
      setVersionResult(formatResponse(response));
    } catch (err) {
      setVersionError(err.message || 'Failed to fetch version');
    } finally {
      setVersionLoading(false);
    }
  };

  const handleFetchHealth = async () => {
    setHealthLoading(true);
    setHealthError('');

    try {
      const response = await computeStore.fetchHealth();
      setHealthResult(formatResponse(response));
    } catch (err) {
      setHealthError(err.message || 'Failed to fetch health');
    } finally {
      setHealthLoading(false);
    }
  };

  const proxiedInstructions = useMemo(
    () =>
      proxyPath
        ? `Calling /compute${proxyPath.startsWith('/') ? proxyPath : `/${proxyPath}`}`
        : 'Calling /compute',
    [proxyPath]
  );

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Compute Gateway Test
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        These three blocks let you exercise the compute proxy and utility endpoints without wiring them into a full UI.
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Proxy .gh file</Typography>
            <Typography variant="body2" color="text.secondary">
              Drop a GH file and send it through the /compute proxy. {proxiedInstructions}
            </Typography>
            <FileDrop label="Drop file for proxy" file={proxyFile} onFileChange={setProxyFile} />
            <TextField
              label="Optional target path"
              value={proxyPath}
              onChange={(event) => setProxyPath(event.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={handleProxyRun} disabled={!proxyFile || proxyLoading}>
              {proxyLoading ? 'Running...' : 'Run Proxy'}
            </Button>
            {proxyError && (
              <Typography color="error" variant="body2">
                {proxyError}
              </Typography>
            )}
            <Box component="pre" sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, minHeight: 120, overflow: 'auto' }}>
              {proxyResult || 'Result will appear here'}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">GH → JSON</Typography>
            <Typography variant="body2" color="text.secondary">
              Drop a GH definition and post the text to /scripts/compute-gh-to-json. The JSON response will appear below.
            </Typography>
            <FileDrop label="Drop GH script for JSON" file={ghFile} onFileChange={setGhFile} />
            <Button variant="contained" onClick={handleGhToJson} disabled={!ghFile || ghLoading}>
              {ghLoading ? 'Converting...' : 'Convert to JSON'}
            </Button>
            {ghError && (
              <Typography color="error" variant="body2">
                {ghError}
              </Typography>
            )}
            <Box component="pre" sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, minHeight: 120, overflow: 'auto' }}>
              {ghResult || 'JSON output will appear here'}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">JSON → GH</Typography>
            <Typography variant="body2" color="text.secondary">
              Paste a JSON payload and send it to /scripts/compute-json-to-gh. You can download the resulting .gh file.
            </Typography>
            <TextField
              label="JSON payload"
              multiline
              minRows={6}
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
              placeholder={"{\"definitionJson\": { ... }}"}
            />
            <Button variant="contained" onClick={handleJsonToGh} disabled={!jsonInput || jsonToGhLoading}>
              {jsonToGhLoading ? 'Running...' : 'Convert to GH'}
            </Button>
            {jsonToGhError && (
              <Typography color="error" variant="body2">
                {jsonToGhError}
              </Typography>
            )}
            {jsonToGhDownload && (
              <Button variant="outlined" component="a" href={jsonToGhDownload.url} download={jsonToGhDownload.name}>
                Download {jsonToGhDownload.name}
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Version check</Typography>
            <Typography variant="body2" color="text.secondary">
              Calls /version on the gateway to ensure the proxy can reach the compute server's /version endpoint.
            </Typography>
            <Button variant="contained" onClick={handleFetchVersion} disabled={versionLoading}>
              {versionLoading ? 'Checking...' : 'Fetch version'}
            </Button>
            {versionError && (
              <Typography color="error" variant="body2">
                {versionError}
              </Typography>
            )}
            <Box component="pre" sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, minHeight: 80, overflow: 'auto' }}>
              {versionResult || 'Version response will appear here'}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Health check</Typography>
            <Typography variant="body2" color="text.secondary">
              Hits /health/alive to confirm the gateway is responsive without relying on compute.
            </Typography>
            <Button variant="contained" onClick={handleFetchHealth} disabled={healthLoading}>
              {healthLoading ? 'Checking...' : 'Fetch health'}
            </Button>
            {healthError && (
              <Typography color="error" variant="body2">
                {healthError}
              </Typography>
            )}
            <Box component="pre" sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, minHeight: 80, overflow: 'auto' }}>
              {healthResult || 'Health response will appear here'}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ComputeTestPage;
