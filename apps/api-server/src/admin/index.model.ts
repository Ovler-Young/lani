import { InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class DownloadSourcesInput {
  id: number;
  pattern: string;
  offset: number;
}

@InputType()
export class UpdateSeasonDownloadSourcesInput {
  seasonId: number;
  sources: DownloadSourcesInput[];
}

@ObjectType()
export class SearchBangumiSeason {
  id: string;
  name: string;
  airDate?: string;
  image?: string;
  added: boolean;
}

@ObjectType()
export class JellyfinConfig {
  publicHost: string;
}

@ObjectType()
export class AdminConfig {
  jellyfin?: JellyfinConfig;
}
