FROM node:12-alpine

ARG BUILD_DATE="1970-01-01T00:00:00Z"
ARG VCS_REF="local"
ARG VERSION="SNAPSHOT"

# Build-time metadata as defined at http://label-schema.org
LABEL org.label-schema.build-date=${BUILD_DATE} \
      org.label-schema.name="prometheus-docker-sd" \
      org.label-schema.description="Prometheus Service Discovery for Docker Container." \
      org.label-schema.vendor="Sebastian Stuckenbrock <sstuckenbrock@efhm.de>" \
      org.label-schema.url="https://hub.docker.com/r/stucky/prometheus-docker-sd" \
      org.label-schema.vcs-ref=${VCS_REF} \
      org.label-schema.vcs-url="https://github.com/stuckyhm/prometheus-docker-sd" \
      org.label-schema.usage="https://github.com/stuckyhm/prometheus-docker-sd/blob/master/README.md" \
      org.label-schema.version=${BUILD_DATE} \
      org.label-schema.schema-version="1.0" \
      org.label-schema.docker.cmd="docker run -d -v /var/run/docker.sock:/var/run/docker.sock stucky/prometheus-docker-sd:latest"

# Build-time metadata as defined at https://github.com/opencontainers/image-spec/blob/master/annotations.md
LABEL org.opencontainers.image.ref.name="stucky/prometheus-docker-sd" \
      org.opencontainers.image.created=$BUILD_RFC3339 \
      org.opencontainers.image.authors="Sebastian Stuckenbrock <sstuckenbrock@efhm.de>" \
      org.opencontainers.image.documentation="https://github.com/stuckyhm/prometheus-docker-sd/blob/master/README.md" \
      org.opencontainers.image.description="Prometheus Service Discovery for Docker Container." \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/stuckyhm/prometheus-docker-sd" \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.url="https://hub.docker.com/r/stucky/prometheus-docker-sd"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# RUN npm ci --only=production

COPY app/. .

VOLUME /prometheus-docker-sd

CMD [ "node", "server.js" ]
