# 项目状态记录

更新于 2026-10-28。

## 结论

数据源已替换为许可明确、允许再分发的公开来源，原先导致下线的 AA / OpenRouter / ExchangeRate-API 依赖已全部移除。仓库已重新公开，GitHub Pages 已上线：<https://Ryan11111111.github.io/AIEyes/>。`main` 已重写为单条干净提交；旧历史仅保留在本地备份，不随远端分支发布。

## 换源结果

| 数据 | 当前来源 | 许可 | 状态 |
| --- | --- | --- | --- |
| 文本 / 代码 / Agent 排名 | LMArena Leaderboard Dataset | CC BY 4.0 | 已接入 |
| API 价格、上下文、模态、工具能力 | LiteLLM Model Prices | MIT | 已接入 |
| USD → CNY 汇率 | Frankfurter（ECB） | MIT | 已接入 |
| 鹈鹕测试 | sergiopaniego/pelican-svg-drawings | Apache-2.0 | 静态快照 |
| Coding 套餐 | 厂商官方定价页与公开横评 | 本项目人工整理 | 人工核对 |

已移除的数据源：

- Artificial Analysis：删除榜单 HTML 与内嵌数据解析；
- OpenRouter：删除 Rankings 与 Models API 抓取；
- ExchangeRate-API：删除主汇率接口，改用 Frankfurter；
- Jetty：删除 `results.json` 抓取，仅保留外链。

## 当前状态

| 项目 | 状态 |
| --- | --- |
| GitHub 仓库 | public：<https://github.com/Ryan11111111/AIEyes> |
| GitHub Pages | 已上线：<https://Ryan11111111.github.io/AIEyes/>，来源 `gh-pages` / 根目录 |
| 单文件分享版 | 可选备份：<https://artifacts.commandcode.ai/23da4fv0v5emp5sl>（7 天有效期） |
| GitHub Actions | `.github/workflows/daily-refresh.yml`：每天 UTC 22:37 定时刷新，推送代码/构建相关路径时也触发；构建后推送 `gh-pages` |
| 本机 cron | 未安装 |
| `public/data/` | 本地生成，已 `.gitignore`；构建后的快照发布在 `gh-pages` |
| `artifact/` | 本地生成，已 `.gitignore` |
| 第三方许可 | `LICENSE`、`THIRD_PARTY_DATA.md`、`LICENSES/` 已补齐 |
| Git 历史 | `main` 为单条干净提交 `6695f2a`；旧历史仅本地备份与 tag |

## 2026-10-28 执行的变更

- 新增 `.github/workflows/daily-refresh.yml`：每天 UTC 22:37（北京 06:37）刷新数据并发布 `gh-pages`。
- 支持 `workflow_dispatch` 手动触发，以及推送 `main` 的代码/构建相关路径时触发。
- 使用 `actions/cache` 复用 `data/.cache`，单源失败时回退最近缓存。
- 首次 push 触发与手动触发均验证成功：数据源全部 `ok`，`gh-pages` 正常更新。

## 2026-10-27 执行的变更

- `scripts/refresh-data.mjs`：移除 AA / OpenRouter / ExchangeRate-API / Jetty 抓取；接入 LMArena、LiteLLM、Frankfurter 与 Pelican。
- 新增 `.env.local` 读取与 GitHub token 支持：token 只发送给 GitHub 域名；文件已加入 `.gitignore`。
- 聚合榜改为 LMArena 文本 / 代码 / Agent 三个总榜；同一模型多档位取最高分并重新排名。
- API 目录改为 LiteLLM 去重目录，优先采用厂商直营价；新增 `provider` 字段。
- 页面文案、字段名与评分刻度改为竞技场口径；移除 AA / OpenRouter 链接和“每日自动刷新”表述。
- 新增 `LICENSE`（MIT）、`THIRD_PARTY_DATA.md` 与 `LICENSES/`（CC BY 4.0、Apache-2.0、两份 MIT）。
- 删除“国内最低月费”等绝对化表述，改为“国内入门档”。
- 仓库转为公开；`main` 重写为单条干净提交 `6695f2a`，旧 head `58e1f1a` 仅保留在本地 tag `archive/pre-public-20261027-164531` 与备份 bundle。
- 新增 `gh-pages` 分支（`dbbbe4f`），推送构建后的 `dist`；GitHub Pages 已启用并验证 200。
- 仓库描述与 homepage 已设置为公开站点地址。

## 重新公开前置条件

- [x] 替换 Artificial Analysis、OpenRouter 为允许再分发的数据源。
- [x] 汇率改用 Frankfurter / ECB，并保留许可说明。
- [x] 补 `LICENSE`、`THIRD_PARTY_DATA.md`、`LICENSES/`；CC BY 4.0 数据附许可链接和修改说明。
- [x] 删除“生态最完整”“IDE 覆盖最广”“模型最全”“国内免费首选”“最低月费”“国内最低”等绝对化用语。
- [ ] CI 恢复前加入数据缓存、schema/数量校验，并在关键来源失败时不部署。
- [x] 已恢复自动部署：GitHub Actions 每天刷新并推送 `gh-pages`；数据源缓存使用 `actions/cache`。
- [ ] 复核隐私、ICP、广告法等问题（GitHub Pages 托管条款已通过实际启用确认可用）。
- [x] 将仓库重新公开；`main` 已改写为单条干净提交，旧历史未推送。

## 仍然存在的副本

- 旧 commit（例如 `f237df1`、`58e1f1a`）仍包含旧数据；当前远端只保留 `main`（单条干净提交）与 `gh-pages`，旧历史仅存在于本地备份 bundle 和本地 tag。
- 本地备份：`/home/greatdb/zgh_ai_test/work/AIEyes-history-20261027-164531.bundle`；本地 tag：`archive/pre-public-20261027-164531`。不要把备份推到公开仓库。
- GitHub 可能短暂保留不可达的旧对象；仓库在重写前为私有，外部没有获取旧历史的途径。
- 本地仍有 `public/data/`、`artifact/AI-Eyes.html`、`data/.cache/`；如果机器、备份或共享目录会外流，需要另行清理或加密保存。
- 旧版本中的 AA / OpenRouter 缓存仍可能在 `data/.cache/` 中，仅本地存在；不要随仓库或页面发布。
- 搜索引擎、Wayback、第三方镜像可能滞后；如果发现旧快照，提交移除请求。

## 验证命令

```bash
# 仓库已公开，返回 200
curl -s -o /dev/null -w '%{http_code}\n' https://github.com/Ryan11111111/AIEyes

# Pages 首页与数据返回 200
curl -s -o /dev/null -w '%{http_code}\n' https://Ryan11111111.github.io/AIEyes/
curl -s -o /dev/null -w '%{http_code}\n' https://Ryan11111111.github.io/AIEyes/data/models.json

# 远端只应有 main 与 gh-pages
git ls-remote --heads origin

# 源仓库不应跟踪数据文件或 token
git ls-files | grep -E '^(public/data|artifact|\.env)' || echo 'no tracked data or env'
git check-ignore -v .env.local

# 数据源应全部为公开来源
node -e "const m=require('./public/data/meta.json'); console.log(m.sources.map(s=>s.id+':'+s.status).join(' '))"
```
