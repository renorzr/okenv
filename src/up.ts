import { readFileSync, writeFileSync } from 'fs';
import { dump, load } from 'js-yaml';
import { DockerCompose, DockerComposeService, SourceCodeService, ServicesDescription } from './ServiceInfo';
import { simpleGit } from 'simple-git';
import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Docker, Options } from 'docker-cli-js';
import { execSync } from 'child_process';


const SOURCE_DIR = resolve('./source');


export async function up(servicesFile: string) {
  const content = replaceEnv(readFileSync(servicesFile, 'utf8'));
  const services = load(content) as ServicesDescription;

  if (!existsSync(SOURCE_DIR)) {
    mkdirSync(SOURCE_DIR);
  }

  if (services.init) {
    services.init.forEach(line => {
      console.log('init:', line);
      execSync(line, { encoding: 'utf8' });
    });
  }

  const repoServices = parseServices(services.repos);
  await Promise.all(repoServices.map(svc =>
    pullSource(svc).then(() => build(svc))
  ));

  createDockerCompose(services);

  const docker = new Docker();
  await docker.command('compose up');
}

async function pullSource(service: SourceCodeService) {
  const localPath = join(SOURCE_DIR, service.name);
  console.log('localPath=', localPath);
  if (existsSync(localPath)) {
    console.log('pull', service.name);
    const git = simpleGit(localPath);
    console.log('checkout', service.name, service.branch);
    await git.checkout(service.branch);
    git.pull();
  } else {
    console.log('clone', service.name);
    await simpleGit(SOURCE_DIR).clone(service.source, localPath);
    console.log('checkout', service.name, service.branch);
    await simpleGit(localPath).checkout(service.branch);
  }
}

function build(service: SourceCodeService) {
  const servicePath = join(SOURCE_DIR, service.name);
  const docker = new Docker(new Options(undefined, servicePath, true));
  return docker.command(`build -t ${service.name} .`)
}

function replaceEnv(str: string) {
  Object.entries(process.env).forEach(([key, val]) => {
    const regex = new RegExp(`\\$\{${key}\}`, 'g');
    str = str.replace(regex, val as string);
  });

  return str;
}

function createDockerCompose(services: ServicesDescription) {
  const result: DockerCompose = {
    version: '2',
    services: {}
  };

  const repoServices = parseServices(services.repos);
  repoServices.forEach(svc => {
    const dockerComposeService = {
      container_name: svc.name,
      restart: 'always',
      network_mode: 'bridge',
      image: svc.name,
      environment: svc.environment,
      volumes: svc.volumes,
      ports: svc.ports,
      depends_on: svc.depends_on,
    } as DockerComposeService;
    result.services[svc.name] = dockerComposeService;
  });

  Object.entries(services.images).forEach(([key, val]) => {
    result.services[key] = val as DockerComposeService;
  })

  const out = dump(result);
  writeFileSync('docker-compose.yml', out);
}

function parseServices(services: SourceCodeService[]) {
  return Object.entries(services).map(([name, service]) => {
    service.name = name;
    return service;
  });
}
