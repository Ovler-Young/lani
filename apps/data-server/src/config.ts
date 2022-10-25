import { loadConfigSync, root, str, T, use } from "@lani/framework";
import { PostGraphileOptions } from "postgraphile";

const postgresUrl = str();

const postgraphile = use<PostGraphileOptions>();

const schema = root({
  postgresUrl,
  postgraphile,
});

export default loadConfigSync<T<typeof schema>>({
  schema,
});
