FROM node:10

LABEL org.label-schema.build-date=${BUILD_DATE} \
      org.label-schema.name="prometheus-docker-sd" \
      org.label-schema.description="Prometheus Service Discovery for Docker Container." \
      org.label-schema.url="https://hub.docker.com/r/stucky/prometheus-docker-sd" \
      org.label-schema.vcs-ref=${VCS_REF} \
      org.label-schema.vcs-url="https://github.com/stuckyhm/prometheus-docker-sd" \
      org.label-schema.version=${BUILD_DATE} \
      org.label-schema.schema-version="1.0"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# RUN npm ci --only=production

COPY app/. .

VOLUME /prometheus-docker-sd

CMD [ "node", "server.js" ]
