import config from "@/config";
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import { getPort } from "@lani/framework";
import { getIntrospectionQuery, parse, print } from "graphql";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Issuer } from "openid-client";

import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
  ContextFunction,
  AuthenticationError,
} from "apollo-server-core";
import express from "express";
import http from "http";

(async () => {
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: config.subgraphs,
      pollIntervalInMs: config.pollIntervalInMs,
    }),
  });

  let context: ContextFunction | undefined = undefined;

  if (config.auth.enabled) {
    const { issuer: issuerUrl } = config.auth;

    const issuer = await Issuer.discover(issuerUrl);
    if (!issuer.metadata.jwks_uri) {
      throw new Error("jwk_uri not found in issuer metadata");
    }
    const JWKS = createRemoteJWKSet(new URL(issuer.metadata.jwks_uri));

    const introspectionQuery = print(parse(getIntrospectionQuery()));

    context = async ({ req }) => {
      const auth = (req.headers.authorization ?? "").replace("Bearer ", "");
      try {
        const query = print(parse(req.body.query));
        if (query === introspectionQuery) {
          return {};
        }

        const { payload } = await jwtVerify(auth, JWKS, {
          issuer: issuer.metadata.issuer,
          audience:
            config.auth.enabled && config.auth.type === "audience"
              ? config.auth.audience
              : undefined,
        });
        if (config.auth.enabled) {
          const { type } = config.auth;
          if (type === "role") {
            const roles =
              (
                payload.realm_access as {
                  roles: string[];
                }
              )?.roles ?? [];
            if (!roles.includes(config.auth.role)) {
              throw new AuthenticationError("Not Authorized");
            }
          } else if (type === "group") {
            const groups = payload.groups as string[];
            if (!groups.includes(config.auth.group)) {
              throw new AuthenticationError("Not Authorized");
            }
          }
        }
      } catch (error) {
        throw new AuthenticationError("Not Authenticated");
      }
    };
  }

  const app = express();
  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    gateway,
    context,
    cache: "bounded",
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });
  await server.start();
  server.applyMiddleware({ app });

  app.get("/auth_config", (_req, res) => {
    res.send({
      enabled: config.auth.enabled,
      ...(config.auth.enabled
        ? {
            config: {
              authority: config.auth.issuer,
              client_id: config.auth.clientId,
            },
            authorization: {
              enabled: true,
              type: config.auth.type,
              ...(config.auth.type === "group"
                ? {
                    group: config.auth.group,
                  }
                : config.auth.type === "role"
                ? {
                    role: config.auth.role,
                  }
                : config.auth.type === "audience"
                ? {
                    audience: config.auth.audience,
                  }
                : undefined),
            },
          }
        : undefined),
    });
  });

  const port = getPort(8080);
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  );
})();
