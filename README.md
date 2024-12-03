# prometheus-docker-sd
[![](https://images.microbadger.com/badges/image/stucky/prometheus-docker-sd.svg)](https://microbadger.com/images/stucky/prometheus-docker-sd)
[![](https://images.microbadger.com/badges/version/stucky/prometheus-docker-sd.svg)](https://microbadger.com/images/stucky/prometheus-docker-sd)
[![](https://images.microbadger.com/badges/commit/stucky/prometheus-docker-sd.svg)](https://microbadger.com/images/stucky/prometheus-docker-sd)
[![Docker Pulls](https://img.shields.io/docker/pulls/stucky/prometheus-docker-sd.svg)](https://hub.docker.com/r/stucky/prometheus-docker-sd)

Prometheus Service Discovery for Docker Container.

## How to use this image
Sample `docker-compose.yml`:

```yaml
services:

# ==============================================================================
# prometheus
# ------------------------------------------------------------------------------
  prometheus:
    image: "prom/prometheus:v2.25.0"
    restart: unless-stopped
    networks:
      - monitoring_ext
    expose:
      - "9090"
    ports:
      - "19090:9090"
    volumes:
      - ./prometheus/config:/etc/prometheus:ro
      - ./prometheus/data:/prometheus:rw
      - prometheus-docker-sd:/prometheus-docker-sd:ro
    command: [
      "--config.file=/etc/prometheus/prometheus.yml",
      "--storage.tsdb.path=/prometheus",
      "--storage.tsdb.retention.time=15d",
      "--web.console.libraries=/usr/share/prometheus/console_libraries",
      "--web.console.templates=/usr/share/prometheus/consoles"
    ]

# ==============================================================================
# prometheus-docker-sd
# ------------------------------------------------------------------------------
  prometheus-docker-sd:
    image: "stucky/prometheus-docker-sd:latest"
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - prometheus-docker-sd:/prometheus-docker-sd:rw

# ==============================================================================
# Volumes
# ------------------------------------------------------------------------------
volumes:
  prometheus-docker-sd:

# ==============================================================================


# ==============================================================================
# Networks
# ------------------------------------------------------------------------------
networks:
 monitoring_ext:
   external: true
   name: monitoring_ext

# ==============================================================================
```

Create a network
```bash
docker network create monitoring_ext
```

Add to your scrape config in `prometheus.yml`:
```yaml
scrape_configs:

- job_name: 'service_discovery'
  file_sd_configs:
    - files:
      - /prometheus-docker-sd/docker-targets.json
```

Add the following labels to your containers.
| label                            | mandatory | default          | description                                         | 
| -------------------------------- | :-------: | ---------------- | --------------------------------------------------- |
| prometheus-scrape.enabled        |       yes |                  | Must set to "true" for enabled.                     |
| prometheus-scrape.job_name       |        no | <Container-Name> | Content for the prometheus label "job".             |
| prometheus-scrape.hostname       |        no | <Container-Name> | Hostname, if it differs from the container name or for access via the public interface. |
| prometheus-scrape.port           |        no |             9090 | Port of the metrics endpoint.                       |
| prometheus-scrape.scheme         |        no |             http | Scheme http or https                                |
| prometheus-scrape.metrics_path   |        no |         /metrics | Path to the metrics endpoint.                       |

**Important: The Container has to be in the same network (monitoring_ext) that prometheus.**

Usage of the label at the example of node-exporter:
```bash
docker run -d \
  --name="node-exporter" \
  --pid="host" \
  -v /:/host:ro \
  --network=monitoring_ext \
  -l prometheus-scrape.enabled=true \
  -l prometheus-scrape.job_name="node-exporter" \
  -l prometheus-scrape.port=9100 \
  -l prometheus-scrape.metrics_path="/metrics" \
  quay.io/prometheus/node-exporter \
  --path.rootfs=/host
```

Or via `docker-compose.yml`:
```bash
services:
  node-exporter:
    image: prom/node-exporter:latest
    restart: unless-stopped
    networks:
      - internal
      - monitoring_ext
    labels:
      prometheus-scrape.enabled:         "true"
      prometheus-scrape.job_name:        "node-exporter"
      prometheus-scrape.port:            9100
      prometheus-scrape.metrics_path:    "/metrics"
    volumes:
      - /proc:/rootfs/proc:ro
      - /sys:/rootfs/sys:ro
      - /:/rootfs:ro
    expose:
      - "9100"

networks:
    internal:
    monitoring_ext:
        external: true
        name: monitoring_ext
```
