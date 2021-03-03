# prometheus-docker-sd
[![](https://images.microbadger.com/badges/image/stucky/prometheus-docker-sd.svg)](https://microbadger.com/images/stucky/prometheus-docker-sd)
[![](https://images.microbadger.com/badges/version/stucky/prometheus-docker-sd.svg)](https://microbadger.com/images/stucky/prometheus-docker-sd)
[![](https://images.microbadger.com/badges/commit/stucky/prometheus-docker-sd.svg)](https://microbadger.com/images/stucky/prometheus-docker-sd)
[![Docker Pulls](https://img.shields.io/docker/pulls/stucky/prometheus-docker-sd.svg)](https://hub.docker.com/r/stucky/prometheus-docker-sd)

Prometheus Service Discovery for Docker Container.

## How to use this image
Sample `docker-compose.yml`:
```bash
version: '2'
services:

# ==============================================================================
# prometheus
# ------------------------------------------------------------------------------
  prometheus:
    image: "prom/prometheus:v2.10.0"
    restart: unless-stopped
    expose:
      - "9090"
    ports:
      - "9090:9090"
    volumes:
       - ./prometheus/config:/etc/prometheus:ro
       - ./prometheus/data:/prometheus:rw
    volumes_from:
       - prometheus-docker-sd:ro
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
```

Add to your scrape config in `prometheus.yml`:
```bash
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

**Important: The Container has to be in the same network that prometheus.**

Usage of the label at the example of node-exporter.
```bash
docker run -d \
  --name="node-exporter" \
  --pid="host" \
  -v /:/host:ro \
  -l prometheus-scrape.enabled=true \
  -l prometheus-scrape.port=9100 \
  quay.io/prometheus/node-exporter \
  --path.rootfs=/host
```
