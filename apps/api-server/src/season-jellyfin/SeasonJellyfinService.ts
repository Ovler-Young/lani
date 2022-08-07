import { MetadataRefreshMode } from '@/api/jellyfin';
import { PrismaService } from '@/common/prisma.service';
import config from '@/config';
import { SeasonWithJellyfinFolder } from '@/types/entities';
import { JellyfinHelp } from '@/utils/JellyfinHelp';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SeasonJellyfinService {
  constructor(private prisma: PrismaService) {}

  async refreshAfterFolderRename({ jellyfinFolder }: SeasonWithJellyfinFolder) {
    await JellyfinHelp.refreshItem({
      itemId: jellyfinFolder.jellyfinId,
      recursive: true,
    });
  }

  async refreshAfterWriteToDisk({
    jellyfinId,
    jellyfinFolder,
  }: SeasonWithJellyfinFolder) {
    if (jellyfinId) {
      await JellyfinHelp.refreshItem({
        itemId: jellyfinId,
        metadataRefreshMode: MetadataRefreshMode.DEFAULT,
        imageRefreshMode: MetadataRefreshMode.DEFAULT,
      });
    } else {
      await JellyfinHelp.refreshItem({
        itemId: jellyfinFolder.jellyfinId,
        recursive: true,
      });
    }
  }

  async refreshAfterDelete({ jellyfinFolder }: SeasonWithJellyfinFolder) {
    await JellyfinHelp.refreshItem({
      itemId: jellyfinFolder.jellyfinId,
      metadataRefreshMode: MetadataRefreshMode.DEFAULT,
    });
  }

  async syncJellyfinSeriesId({
    id: seasonId,
    jellyfinId,
    title,
    jellyfinFolder,
  }: SeasonWithJellyfinFolder) {
    const items = await JellyfinHelp.getItemsByUserId({
      userId: config.jellyfin.dummyUserId,
      searchTerm: title,
      limit: 10,
      parentId: jellyfinFolder.jellyfinId,
      recursive: true,
      includeItemTypes: ['Series'],
    });
    const id = (items.Items ?? []).find((item) => item.Name === title)?.Id;
    if (!id) {
      return false;
    }
    if (id === jellyfinId) {
      return true;
    }
    console.log(`jellyfin season id for season '${title}' is ${id}`);
    await this.prisma.season.update({
      where: { id: seasonId },
      data: {
        jellyfinId: id,
      },
    });
    return true;
  }

  @Cron('*/5 * * * * *') // 每 5 秒
  async syncAllSeasonsJellyfinSeriesId() {
    const seasons = await this.prisma.season.findMany({
      where: {
        jellyfinId: '',
        lastWriteToDisk: {
          not: null,
        },
      },
      include: { jellyfinFolder: true },
    });
    const result = await Promise.all(
      seasons.map(async (season) => {
        try {
          return this.syncJellyfinSeriesId(season);
        } catch (_error) {
          return false;
        }
      }),
    );
    return result.filter((b) => b).length;
  }
}
