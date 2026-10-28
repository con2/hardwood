/**
 * Loads `.env` for the command-line tools before `src/config.ts` is evaluated. Import this first.
 * Production containers have no `.env`; their environment comes from the deployment.
 */
try {
  process.loadEnvFile();
} catch {
  // No .env file.
}
