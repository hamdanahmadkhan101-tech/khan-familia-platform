const { startObservability } = await import('./observability/register.js');

startObservability();

const { startServer } = await import('./server.js');

startServer();
