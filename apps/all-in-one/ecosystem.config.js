function getEnvironment(prefix) {
  const envs = {};
  for (const key in process.env) {
    if (key.startsWith(prefix)) {
      envs[key.replace(prefix, '')] = process.env[key];
    }
  }
  return envs;
}

const apps = [
  {
    name: "api-server",
    script: "npm",
    cwd: "/deploy/apps/api-server",
    args: "run start:prod",
    env: {
      PORT: 8082,
      ...getEnvironment('API_SERVER_'),
    },
    autorestart: true,
  },
  {
    name: "data-server",
    script: "npm",
    cwd: "/deploy/apps/data-server",
    args: "run start",
    env: {
      PORT: 8083,
      ...getEnvironment('DATA_SERVER_'),
    },
    autorestart: true,
  },
  {
    name: "gateway",
    script: "npm",
    cwd: "/deploy/apps/gateway",
    args: "run start",
    env: {
      PORT: 8081,
      ...getEnvironment('GATEWAY_'),
    },
    autorestart: true,
  },
  {
    name: "minio",
    script: "minio",
    cwd: "/storage",
    args: "server /storage --console-address 0.0.0.0:9001",
    env: {
      ...getEnvironment('MINIO_'),
    },
    autorestart: true,
  },
  {
    name: "nginx",
    script: "nginx",
    args: '-g "daemon off;"',
    env: {
      ...getEnvironment('NGINX_')
    },
    autorestart: true,
  }
];

module.exports = apps;
