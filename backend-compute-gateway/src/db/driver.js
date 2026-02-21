import neo4j from 'neo4j-driver';

let _driver = null;

/**
 * Returns the singleton Neo4j driver instance.
 * Reads NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD from environment.
 */
export function getDriver() {
  if (_driver) return _driver;

  const uri  = process.env.NEO4J_URI      || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER     || 'neo4j';
  const pass = process.env.NEO4J_PASSWORD || 'neo4j';

  _driver = neo4j.driver(uri, neo4j.auth.basic(user, pass), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 5000,
  });

  return _driver;
}

/** Open a new session (caller must close it). */
export function session(database = process.env.NEO4J_DATABASE || 'neo4j') {
  return getDriver().session({ database });
}

/**
 * Verify connectivity and create uniqueness constraints.
 * Call once at server startup.
 */
export async function initSchema() {
  const s = session();
  try {
    await getDriver().verifyConnectivity();
    console.log('[neo4j] Connected');

    // Idempotent constraints — safe to run on every startup
    const constraints = [
      'CREATE CONSTRAINT gh_doc_id IF NOT EXISTS FOR (d:GHDocument)  REQUIRE d.id IS UNIQUE',
      'CREATE CONSTRAINT gh_comp_id IF NOT EXISTS FOR (c:GHComponent) REQUIRE c.id IS UNIQUE',
    ];
    for (const cypher of constraints) {
      await s.run(cypher);
    }
    console.log('[neo4j] Schema ready');
  } catch (err) {
    console.warn('[neo4j] Could not connect or init schema:', err.message);
  } finally {
    await s.close();
  }
}

export async function closeDriver() {
  if (_driver) {
    await _driver.close();
    _driver = null;
  }
}
