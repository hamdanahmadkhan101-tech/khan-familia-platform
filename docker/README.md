# Docker Strategy

The repository keeps Docker concerns split by purpose so each phase stays small and reviewable.

Current layout:

- `docker/compose.observability.yml`: local observability stack for the API
- `docker/observability/*`: collector, Prometheus, Tempo, and Grafana provisioning files

Planned later layout:

- `docker/Dockerfile.web`: web app image
- `docker/Dockerfile.api`: API app image
- `docker/Dockerfile.worker`: worker image
- `docker/compose.apps.yml`: app container runtime composition

How the current observability compose works:

1. The API exports traces and metrics to the local OpenTelemetry Collector over OTLP.
2. The collector exports metrics to Prometheus and traces to Tempo.
3. Grafana reads Prometheus and Tempo as data sources and shows the data in one UI.

Run the local observability stack from the repository root:

```bash
docker compose -f docker/compose.observability.yml up
```

Then start the API with observability enabled:

```bash
OTEL_ENABLED=true OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pnpm --filter @khan-familia/api dev
```

Local endpoints:

- Grafana: http://localhost:3002 (`admin` / `admin`)
- Prometheus: http://localhost:9090
- Tempo: http://localhost:3200
- OpenTelemetry Collector OTLP HTTP: http://localhost:4318

This compose file is intentionally separate from future app-containerization work. That lets us
keep observability running while later adding a second compose file for the apps themselves.
In practice, we can combine them with multiple `-f` files or a future root `compose.yml` if we
want everything started together.
