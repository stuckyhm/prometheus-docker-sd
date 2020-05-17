const log4js = require('log4js');
const logger = log4js.getLogger();

const Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});
var targetFile = '/prometheus-docker-sd/docker-targets.json';

const fs = require('fs');
logger.level = 'debug';

const ONLY_USE_IP = (process.env.ONLY_USE_IP === 'true');

function convertDockerJson2Prometheus(data){
  var containerName = data.Name.substring(1);
  var container = {
    'labels': {
      'job': containerName,
      'container_name': containerName,
      'container_id': data.Config.Hostname
    },
    'targets': []
  };

  if("Labels" in data.Config) {
    if("prometheus-scrape.enabled" in data.Config.Labels) {
      if(data.Config.Labels["prometheus-scrape.enabled"] == "true") {
        logger.info('');
        logger.info('Container "' + containerName + '" is enabled for prometheus.');

        if("prometheus-scrape.job_name" in data.Config.Labels) {
          container.labels["job"] = data.Config.Labels["prometheus-scrape.job_name"]; 
          logger.info('Set job name to "' + container.labels["job"] + '".');
        }

        var port = "9090";

        if("prometheus-scrape.port" in data.Config.Labels) {
          port = data.Config.Labels["prometheus-scrape.port"];
          logger.info('Port is set to "' + port + '".');
        }else{
          logger.info('Using default port "' + port + '".');
        }

        var hostname = containerName;
        if("prometheus-scrape.hostname" in data.Config.Labels) {
          hostname = data.Config.Labels["prometheus-scrape.hostname"];
        }
        if("prometheus-scrape.ip_as_hostname" in data.Config.Labels) {
          hostname = data.NetworkSettings.IPAddress;
        }
        if(ONLY_USE_IP == true){
          hostname = data.NetworkSettings.IPAddress;
        }
        var target = hostname + ':' + port;
        container.targets.push(target);
        logger.info('Add scrape target "' + target + '".');

        if("prometheus-scrape.scheme" in data.Config.Labels) {
          container.labels["__scheme__"] = data.Config.Labels["prometheus-scrape.scheme"]; 
          logger.info('Set scheme to "' + container.labels["__scheme__"] + '".');
        }

        //if("prometheus-scrape.scrape_interval" in data.Config.Labels) {
        //  container.scrape_interval = data.Config.Labels["prometheus-scrape.scrape_interval"]; 
        //  logger.info('Set scrape interval to "' + container.scrape_interval + '".');
        //}

        if("prometheus-scrape.metrics_path" in data.Config.Labels) {
          container.labels["__metrics_path__"] = data.Config.Labels["prometheus-scrape.metrics_path"];
          logger.info('Set metrics path to "' + container.labels["__metrics_path__"] + '".');
        }

        if("com.docker.compose.service" in data.Config.Labels) {
          container.labels["com_docker_compose_service"] = data.Config.Labels["com.docker.compose.service"];
          logger.info('Set compose service name to "' + container.labels["com_docker_compose_service"] + '".');
        }

        logger.info('');
      }else{
        logger.info('Container "' + containerName + '" has the "prometheus-scrape.enabled" label, but it isn\'t set to true, so ignoring it.');
      }
    }else{
      logger.info('Container "' + containerName +  '" has no "prometheus-scrape.enabled" label and is ignored.');
    }
  }else{
    logger.info('Container "' + containerName + '" has no labels and is ignored.');
  }

  if(container.targets.length){
    return container;
  }else{
    return null;
  }
}


function loop() {
  let promises = [];
  docker.listContainers().then(data => {
    data.forEach(element => {
      promises.push(docker.getContainer(element.Id).inspect());
    });

    Promise.all(promises).then((data) => {
      var promConfig = [];

      data.forEach(element => {
        var result = convertDockerJson2Prometheus(element);
        if(result) {
          promConfig.push(result);
        }
      });

      //console.log(promConfig);
      logger.info('Write to file "' + targetFile + '".');
      fs.writeFileSync(targetFile, JSON.stringify(promConfig));
    });
  });
}

loop();
setInterval(loop, 30000);
