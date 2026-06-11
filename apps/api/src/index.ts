const { startObservability } = await import('./observability/register.js');

await startObservability();

const { startServer } = await import('./server.js');

startServer();
