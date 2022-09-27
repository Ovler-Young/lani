# `@lani/all-in-one`

将 lani 用到的各个服务打包到一个 image 中，便于测试和部署。

部署时，应当使用 [`ghcr.io/std4453/lani-all-in-one`](https://github.com/std4453/lani/pkgs/container/lani-all-in-one)，具体的部署步骤请参考 [部署文档](https://std4453.github.io/lani/docs/category/%E9%83%A8%E7%BD%B2)。

## 实现细节

`@lani/all-in-one` 不包含任何代码，主要提供构建 image 用的 Dockerfile。

运行时，使用 `nginx` 部署静态前端文件，并反代后端接口。后端各服务通过 `pm2` 运行并 daemonize，崩溃时自动重启。由于 `@lani/gateway` 启动时需要 introspect 各微服务，在其他服务尚未完成启动时会崩溃重启，这是预期行为。

image 启动时，会运行 [`start.sh`](/start.sh)。其同时启动 `nginx` 和 `pm2-runtime`，并在收到 `SIGINT` 或 `SIGTERM` 时停止已启动的服务，因此可在 `docker run` 的时候使用 `ctrl+c` 退出。

`@lani/all-in-one` 将所依赖的各服务设置为自身的 `devDependencies`，因此在 `rush build` 时会自动构建其他服务，而 `deploy` 时不会创建 `node_modules`。在 [`deploy.json`](../../common/config/rush/deploy.json) 中，将其他服务设置为 [`additionalProjectsToInclude`](https://rushjs.io/pages/maintainer/deploying/#including-additional-projects)。新增微服务时，需要将新服务加进去。

在 `rush deploy` 后，目录结构如下：

```
common/deploy/
├── apps
│   ├── admin
│   │   ├── dist
│   │   ├── nginx.conf
│   │   ├── node_modules
│   │   └── package.json
│   ├── all-in-one
│   │   ├── ecosystem.config.js
│   │   ├── nginx.conf
│   │   ├── package.json
│   │   └── start.sh
│   ├── api-server
│   │   ├── dist
│   │   ├── node_modules
│   │   └── package.json
│   ├── data-server
│   │   ├── dist
│   │   ├── node_modules
│   │   └── package.json
│   └── gateway
│       ├── dist
│       ├── node_modules
│       └── package.json
├── common
│   └── temp
│       └── node_modules
└── libs
```

`docker build` 时会将该目录复制到 `/deploy`。

`COPY_CONFIG` 环境变量为 `true` 时，会将 `/config` 下各服务的配置文件软链到各服务的目录下，添加新服务时需要新增复制代码。
