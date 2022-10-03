-- CreateEnum
CREATE TYPE "download_status" AS ENUM ('UNAVAILABLE', 'DOWNLOADING', 'RENAMING', 'WRITING_METADATA', 'PLAYER_WAITING', 'AVAILABLE', 'DOWNLOAD_SUBMITTING', 'IMPORTING', 'DOWNLOAD_COMPLETED');

-- CreateEnum
CREATE TYPE "image_type" AS ENUM ('POSTER', 'BANNER', 'FANART');

-- CreateEnum
CREATE TYPE "metadata_source" AS ENUM ('MANUAL', 'BGM_CN', 'SKYHOOK', 'INHERIT');

-- CreateEnum
CREATE TYPE "season_status" AS ENUM ('SCHEDULED', 'AIRING', 'ENDED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "torrent_source_type" AS ENUM ('WEBDL', 'WEBRIP', 'BDRIP', 'DONGHUA', 'BD');

-- CreateEnum
CREATE TYPE "torrent_platform" AS ENUM ('BAHA', 'B_GLOBAL', 'B_THM', 'BILIBILI', 'VIUTV');

-- CreateTable
CREATE TABLE "download_sources" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "group_id" TEXT NOT NULL DEFAULT E'',
    "pattern" TEXT NOT NULL DEFAULT E'',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "offset" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "download_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT E'',
    "description" TEXT NOT NULL DEFAULT E'',
    "index" INTEGER NOT NULL,
    "air_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jellyfin_episode_id" TEXT,
    "last_missing_notify_time" TIMESTAMPTZ(6),

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "source_url" TEXT NOT NULL,
    "cos_path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT E'',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bilibili_thm_id" TEXT NOT NULL DEFAULT E'',
    "bilibili_mainland_id" TEXT NOT NULL DEFAULT E'',
    "bangumi_id" TEXT NOT NULL DEFAULT E'',
    "mikan_anime_id" TEXT NOT NULL DEFAULT E'',
    "tvdb_id" TEXT NOT NULL DEFAULT E'',
    "tvdb_season" INTEGER,
    "jellyfin_folder_id" INTEGER NOT NULL,
    "jellyfin_id" TEXT NOT NULL DEFAULT E'',
    "info_source" "metadata_source" NOT NULL DEFAULT E'MANUAL',
    "description" TEXT NOT NULL DEFAULT E'',
    "tags" VARCHAR[],
    "year_and_semester" VARCHAR(16) NOT NULL DEFAULT E'',
    "weekday" INTEGER,
    "air_time" VARCHAR NOT NULL DEFAULT E'',
    "poster_image_id" INTEGER,
    "banner_image_id" INTEGER,
    "fanart_image_id" INTEGER,
    "last_write_to_disk" TIMESTAMPTZ(6),
    "last_write_title" TEXT,
    "is_monitoring" BOOLEAN NOT NULL DEFAULT true,
    "need_download_cc" BOOLEAN NOT NULL DEFAULT false,
    "notify_missing" BOOLEAN NOT NULL DEFAULT true,
    "notify_publish" BOOLEAN NOT NULL DEFAULT true,
    "episodes_source" "metadata_source" NOT NULL DEFAULT E'MANUAL',
    "episodes_last_sync" TIMESTAMPTZ(6),

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "torrents" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "torrent_link" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "publish_date" TIMESTAMPTZ(6) NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "episode_index" INTEGER,
    "organization_raw" TEXT,
    "organization_parts" TEXT[],
    "season_title_raw" TEXT,
    "season_title_aliases" TEXT[],
    "index" INTEGER,
    "index_from" INTEGER,
    "index_to" INTEGER,
    "source_type" "torrent_source_type",
    "source_platform" "torrent_platform",
    "format_resolution" TEXT,
    "format_video_encoding" TEXT,
    "format_audio_encoding" TEXT,
    "format_container" TEXT,
    "format_color_depth" TEXT,
    "subtitle_has_chs" BOOLEAN NOT NULL DEFAULT false,
    "subtitle_has_cht" BOOLEAN NOT NULL DEFAULT false,
    "subtitle_has_jp" BOOLEAN NOT NULL DEFAULT false,
    "subtitle_type" TEXT,

    CONSTRAINT "mikan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_jobs" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "qbt_torrent_hash" TEXT,
    "status" "download_status" NOT NULL,
    "download_path" TEXT,
    "file_path" TEXT,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_failed" BOOLEAN NOT NULL DEFAULT false,
    "failed_at" TIMESTAMPTZ(6),
    "failed_reason" TEXT NOT NULL DEFAULT E'',
    "qbt_last_sync" TIMESTAMPTZ(6),
    "import_path" TEXT,
    "torrent_link" TEXT,
    "nfo_path" TEXT,
    "jellyfin_episode_id" TEXT,

    CONSTRAINT "download_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jellyfin_folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "jellyfin_id" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "jellyfin_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "download_sources_pattern_key" ON "download_sources"("pattern");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_season_id_index_key" ON "episodes"("season_id", "index");

-- CreateIndex
CREATE UNIQUE INDEX "images_source_url_key" ON "images"("source_url");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_title_key" ON "seasons"("title");

-- CreateIndex
CREATE UNIQUE INDEX "torrents_hash_key" ON "torrents"("hash");

-- CreateIndex
CREATE INDEX "torrent_title_idx" ON "torrents"("title", "id", "torrent_link");

-- CreateIndex
CREATE UNIQUE INDEX "jellyfin_folders_jellyfin_id_key" ON "jellyfin_folders"("jellyfin_id");

-- AddForeignKey
ALTER TABLE "download_sources" ADD CONSTRAINT "download_sources_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_poster_image_id_fkey" FOREIGN KEY ("poster_image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_banner_image_id_fkey" FOREIGN KEY ("banner_image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_fanart_image_id_fkey" FOREIGN KEY ("fanart_image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_jellyfin_folder_id_fkey" FOREIGN KEY ("jellyfin_folder_id") REFERENCES "jellyfin_folders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "download_jobs" ADD CONSTRAINT "download_jobs_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prisma Unsupported Features --

COMMENT ON TABLE "download_jobs" IS E'@omit delete,create,update';

COMMENT ON TABLE "download_sources" IS E'@omit delete,create,update\n@unique pattern';

COMMENT ON TABLE "episodes" IS E'@omit delete,create\n@unique season_id,index';

COMMENT ON TABLE "jellyfin_folders" IS E'@omit create,update,delete\n@unique jellyfin_id';

COMMENT ON TABLE "seasons" IS E'@omit delete\n@unique title';

COMMENT ON TABLE "torrents" IS E'@omit delete,create,update\n@unique hash';

COMMENT ON TABLE "images" IS E'@unique source_url';
