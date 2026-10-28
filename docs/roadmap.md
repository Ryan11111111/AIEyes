# 下一步计划

更新于 2026-10-28。

> 当前状态：数据源已完成换源，仓库已公开，GitHub Pages 已上线：<https://Ryan11111111.github.io/AIEyes/>。静态站点由 `gh-pages` 分支发布，每天由 GitHub Actions 自动刷新；状态详见 [status.md](status.md)。

## 0. 重新公开前置条件

- [x] 用允许再分发的数据源替换 Artificial Analysis、OpenRouter：LMArena（CC BY 4.0）与 LiteLLM（MIT）。
- [x] 汇率改用 Frankfurter / ECB，并保留许可说明。
- [x] 补 `LICENSE`、`THIRD_PARTY_DATA.md`、`LICENSES/`；CC BY 4.0 数据附许可链接和修改说明；不得给第三方数据再授权。
- [x] 删除“生态最完整”“IDE 覆盖最广”“模型最全”“国内免费首选”“最低月费”“国内最低”等绝对化用语。
- [x] 把 `main` 重写为单条干净提交；旧历史仅保留在本地备份，不推到公开仓库。
- [x] 仓库转公开并启用 GitHub Pages（`gh-pages` / 根目录）。
- [ ] CI 恢复前加入数据缓存、schema/数量校验，并在关键来源失败时不部署。
- [ ] 复核隐私、ICP、广告法等问题。
- [x] 恢复自动刷新/自动部署：GitHub Actions 每天 UTC 22:37 刷新并推送 `gh-pages`。

## 1. 解决页面打开慢

现状：首屏会并行请求 `public/data/*.json`，其中 `lmarena.json` 约 1.9 MB（包含 29 个分类的全量模型），`models.json` 约 0.8 MB；JSON 未压缩、未拆分，是打开慢的主要嫌疑。

待办：

- [ ] 测量首屏耗时，确认瓶颈在传输、JSON 解析还是首屏渲染。
- [ ] 拆分 LMArena 数据：默认只加载当前榜的总榜，切换分类时按需加载。
- [ ] 为静态 JSON 开启 gzip / brotli 压缩，并设置长缓存与版本化文件名。
- [ ] 精简榜单字段，只保留页面实际展示所需的数据。
- [ ] 优化后复测首屏时间，记录优化前后的对比。

## 2. 是否租服务器公开网址

项目是纯静态站点，优先使用静态托管，暂不需要租 VPS。

初步结论（2026-10-27）：

- 国内访问：GitHub Pages 与 Cloudflare Pages 免费版都走境外节点，稳定性都无法保证；Cloudflare Pages 通常略好，但 `pages.dev` 也可能被阻断。
- 当前交付：GitHub Pages 已上线 <https://Ryan11111111.github.io/AIEyes/>，由 `gh-pages` 分支发布；本地仍可用 `npm run serve` 或单文件 `artifact/AI-Eyes.html`。
- 长期面向国内：注册域名并完成 ICP 备案，使用阿里云 OSS / 腾讯云 COS + CDN 或 EdgeOne，不需要租服务器。

待办：

- [ ] 若主要面向国内访问，测试各托管平台的访问速度；国内对象存储 + CDN 需要自定义域名备案。
- [ ] 只有当需要服务端能力（鉴权、私有数据、脱离本机的定时任务）时，再考虑 VPS。
- [x] 已用 GitHub Actions 恢复自动刷新：`GITHUB_TOKEN` 仅用于 Git 操作，数据源抓取不需要 token；已加入数据源缓存与失败回退。

## 3. 是否注册域名

- [ ] 先确定长期站点名称与品牌（当前为 AI Eyes）。
- [ ] 若公开访问，优先注册 `.com`；也可考虑 `.dev` / `.app` / `.ai`，注意价格与实名要求。
- [ ] 域名只解析到静态托管，不绑定服务器 IP，后续迁移成本更低。
