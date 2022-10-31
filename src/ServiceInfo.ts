export interface SourceCodeService {
  name: string;
  source: string;
  branch: string;
  environment?: string[];
  volumes?: string[];
  ports?: string[];
  depends_on?: string[];
}

export interface ServicesDescription {
  init?: string[];
  repos: Array<SourceCodeService>;
  images?: any
}

export interface DockerCompose {
  version: '2';
  services: {
    [key: string]: DockerComposeService
  }
}

export interface DockerComposeService {
  container_name?: string;
  restart?: string;
  network_mode?: string;
  image: string;
  environment?: { [key: string]: string };
  volumes?: string[];
  ports?: string[];
  depends_on?: string[];
}
