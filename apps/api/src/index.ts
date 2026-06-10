await import('./observability/register.js');

const { startServer } = await import('./server.js');

startServer();
