import { rootConfig, RootConfig } from '@/config/types';
import { loadConfigSync } from '@lani/framework';

export default loadConfigSync<RootConfig>({
  schema: rootConfig,
});
