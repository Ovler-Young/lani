module.exports = [
  {
    name: "api-server",
    script: "npm",
    cwd: "./apps/api-server",
    args: "run start:prod",
    env: {
      PORT: 8082,
    },
    autorestart: true,
  },
  {
    name: "data-server",
    script: "npm",
    cwd: "./apps/data-server",
    args: "run start",
    env: {
      PORT: 8083,
    },
    autorestart: true,
  },
  {
    name: "gateway",
    script: "npm",
    cwd: "./apps/gateway",
    args: "run start",
    env: {
      PORT: 8081,
    },
    autorestart: true,
  },
];
