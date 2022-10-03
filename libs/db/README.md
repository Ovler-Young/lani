# `@lani/db`

包含 prisma schema，用于执行 prisma 脚本，使用时等同于 `@prisma/client`。

## 使用

### 作为 `@prisma/client` 使用

直接将 `@lani/db` 添加为依赖即可。

`@lani/db` 会在 `rush build` 时在 `dist/` 下生成代码，解决原版 `@prisma/client` 在 `node_modules` 下生成代码、在 `rush deploy` 时不被包含的问题。

使用上 `@lani/db` 与 `@prisma/client` 等同，除了 `@prisma/runtime` 需要使用 `@lani/db/dist/runtime` 导入。

### 直接使用 prisma schema

将 `@lani/db` 添加为依赖后，通过 `node_modules/@lani/db/prisma/schema.prisma` 引用 prisma schema。

### 数据库 migration

`@lani/db` 也可以直接通过 `rush deploy` 部署，部署之后在包目录下运行 `npm run migrate:deploy` 会在 `DATABASE_URL` 指向的数据库中执行 migration。

> ⚠️ 警告
>
> 数据库相关操作均存在潜在的数据丢失风险，如果你是用户，请参考 [用户手册](https://std4453.github.io/lani/docs/category/%E9%83%A8%E7%BD%B2) 。如果你在开发 lani 项目，请在明确后果的前提下操作。

## 开发

开始开发前，你需要搭建一台 [PostgreSQL](https://www.postgresql.org/) 数据库，接着在包目录下创建 `.env` 文件，内容是：

```env
DATABASE_URL=postgres://{user}:{password}@{hostname}:{port}/{database-name}
```

你需要将数据库的用户名、密码等填入文件，可以参考 [StackOverflow](https://stackoverflow.com/questions/3582552/what-is-the-format-for-the-postgresql-connection-string-url)。这个文件不会被提交到 git。

在开发过程中，会在数据库中创建、修改表，需要授予上述用户对应的权限。此外，开发 migration 的时候，会创建 shadow database，需要授予创建数据库权限，具体请参考 [prisma 文档](https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database#shadow-database-user-permissions)。

数据库 schema 位于 [`prisma/schema.prisma`](prisma/schema.prisma)，推荐的方式是直接在 schema 上修改，然后 `rushx prisma:push` 将变更 push 到开发用的数据库。

另一种方法是直接在数据库上变更，然后运行 `rushx prisma:pull` 将更改同步到 schema 文件。这种方法有时会破坏 schema 文件的格式，建议在同步后将受影响的部分恢复原状。

修改时，你需要注意命名。在 lani 项目中，我们要求数据库类型、表和字段使用 `snake_case` 命名，而 prisma 中的名称会直接转换为 TypeScript 类型，因此应当使用 `PascalCase` （表和类型）或 `camelCase` （字段）。枚举值总是使用 `MACRO_CASE`。

> ⚠️ 警告
>
> 除非必要，**请勿删除现有字段**。如果某个字段再也不会用到了，将它设置为 Nullable，或提供一个默认值。

> ℹ️ 提示
>
> prisma 支持多种数据库，对 PostgreSQL 的功能支持**不是很好**，如果需要使用
> prisma 不支持的数据库功能，请务必确认版本兼容性和对插件的需求，并在创建 migration
> 时小心地加入对应的 SQL 语句。

修改后，构建 `@lani/db`，即可完成 prisma client 生成。

---

完成开发和测试后，版本发布 / 提交 PR 之前，需要创建 migration。

根据 prisma 的设计，开发阶段使用的数据库和 migration 开发阶段用的不同，migration 中用的数据库只能使用 migration 进行变更，否则需要重置整个数据库。

尽管 [也有方法可以绕过](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)，推荐的方法是创建第二个数据库用于开发 migration。

运行 `rushx migrate:create` 创建一个新的 migration（请根据变更内容命名，如 `add_users_table`）。

创建之后，请人工审阅 migration 代码，必要时做出修改。由于 prisma migrate 功能限制，有部分常用功能需要手动修改，这包括：

- 数据库注释：`postgraphile` 使用 [Smart Comment](https://www.graphile.org/postgraphile/smart-comments/) 机制控制其功能，但 [prisma 并不支持数据库注释](https://github.com/prisma/prisma/issues/8896)。因此，一切用到 Smart Comment 的功能（如 `@omit`）都需要手动加入 migration 中。
- unique：`postgraphile` 基于 unique constraint 识别 unique，影响 query 和 mutation 的创建，然而 prisma migrate 只创建 unique index，不创建 unique contraint。因此，需要在用到 unique 的表上添加 [`@unique` Smart Comment](https://www.graphile.org/postgraphile/smart-tags/#unique)。

最后，运行 `rushx migrate:apply` 将完成的 migration 提交到数据库，之后再次创建 migration 时均会以这次提交的为准。
