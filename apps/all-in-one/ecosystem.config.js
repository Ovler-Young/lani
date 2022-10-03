const fs = require('fs');
const dotenv = require('dotenv');

function readEnvFile(envName, defaultFile) {
  const envFile = process.env[envName] || defaultFile
  try {
    fs.statSync(envFile);
  } catch (error) {
    // file does not exist, ignore the error
    return {}
  }
  // this part will throw error if file is not
  // readable or not a valid .env file, this is
  // the expected behavior
  const content = fs.readFileSync(envFile);
  const config = dotenv.parse(content);
  return config;
}

const apps = [
  {
    name: "api-server",
    script: "npm",
    cwd: "/deploy/apps/api-server",
    args: "run start:prod",
    env: {
      PORT: 8082,
      ...readEnvFile('API_SERVER_ENV', '/deploy/apps/api-server/.env'),
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
      ...readEnvFile('DATA_SERVER_ENV', '/deploy/apps/data-server/.env'),
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
      ...readEnvFile('GATEWAY_ENV', '/deploy/apps/gateway/.env'),
    },
    autorestart: true,
  },
];

module.exports = apps;
