import { ServiceEndpointDefinition } from "@apollo/gateway";
import { loadConfigSync, mergeConfig } from "@lani/framework";
import Joi from "joi";

type WithEnabled<T> =
  | {
      enabled: false;
    }
  | ({
      enabled: true;
    } & T);

interface AuthorizationConfig {
  query: string;
  result: any;
}

interface AuthConfig {
  authority: string;
  clientId: string;
  authz?: WithEnabled<AuthorizationConfig>;
  clientConfig?: Record<string, any>;
}

export interface ConfigType {
  subgraphs: ServiceEndpointDefinition[];
  pollIntervalInMs?: number;
  auth: WithEnabled<AuthConfig>;
}

export default loadConfigSync<ConfigType>({
  schema: Joi.object({
    subgraphs: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          url: Joi.string().required(),
        })
      )
      .required(),
    pollIntervalInMs: Joi.number(),
    auth: Joi.alternatives()
      .try(
        Joi.object({
          enabled: Joi.boolean().falsy().required(),
        }),
        Joi.object({
          enabled: Joi.boolean().truthy().required(),
          authority: Joi.string().required(),
          clientId: Joi.string().required(),
          authz: Joi.alternatives().try(
            Joi.object({
              enabled: Joi.boolean().falsy().required(),
            }),
            Joi.object({
              enabled: Joi.boolean().truthy().required(),
              query: Joi.string().required(),
              result: Joi.any().required(),
            })
          ),
          clientConfig: Joi.object(),
        })
      )
      .required(),
  }),
});
