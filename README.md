# AI Eyes

全球 AI 大模型排名、单模型 API 价格与国内外 AI Coding 套餐雷达。

![Status](https://img.shields.io/badge/status-live-5bd6a2) ![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite-79c8ff) ![Data](https://img.shields.io/badge/data-open%20licenses-5bd6a2)

> **当前状态（2026-10-28）**：数据源已替换为许可明确、允许再分发的公开来源：LMArena（CC BY 4.0）、LiteLLM（MIT）、Frankfurter / ECB 与 HuggingFace Pelican（Apache-2.0）。仓库已重新公开，公开站点：<https://Ryan11111111.github.io/AIEyes/>。每日 UTC 22:37（北京 06:37）由 GitHub Actions 自动刷新数据并发布 `gh-pages`。
>
> 数据许可与修改说明见 [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md)，页面操作见 [docs/usage.md](docs/usage.md)，状态记录见 [docs/status.md](docs/status.md)。
>
> 公开站点由 `gh-pages` 分支发布；单文件离线版仍可用 `npm run artifact` 生成。

## 换源记录

2026-10-27 起，项目不再抓取或展示 Artificial Analysis、OpenRouter、ExchangeRate-API 与 Jetty 的数据：

- 删除 AA 榜单与 OpenRouter Rankings 的 HTML 解析，删除 OpenRouter Models API 抓取；
- 排名改用 **LMArena** 文本 / 代码 / Agent 三个竞技场榜（CC BY 4.0）；
- API 价格、上下文、模态与工具能力改用 **LiteLLM** 开放价格库（MIT）；
- 汇率改用 **Frankfurter**（MIT，数据源为 ECB 参考汇率）；
- Jetty 仅保留外链，不再抓取其评分明细；
- 新增 `.env.local` 读取与 GitHub token 支持，token 只发送给 GitHub 域名；
- 2026-10-27 重新公开：`main` 重写为单条干净提交，静态站点发布到 `gh-pages`。

## 功能

- **三套 LMArena 榜**：文本、代码、Agent 三个社区盲测榜，支持地区、厂商、关键词筛选。
- **LMArena 分类榜**：文本榜保留 29 个分类，展示榜期、95% 置信区间与票数。
- **鹈鹕测试专项**：7 个前沿模型 × 约 20 次 SVG 绘制（共 139 样本），展示结构检查、视觉裁判和盲评识别率；Jetty、TeamoRouter 仅提供外链。
- **竞技场 × 价格象限**：用混合价格与所选竞技场分数定位性价比前沿。
- **40 个 Coding 套餐**：Claude Code、ChatGPT/Codex、Copilot、Cursor、Windsurf/Devin、Google AI、Qoder、OpenCode、Command Code、Kiro、Augment、Amp、Cerebras、Factory、Zed、Warp、GLM、Kimi、MiniMax、CodeBuddy、Trae、火山方舟、百炼、千帆、Comate、Qwen Code、StepFun 等，国内/海外分列，支持卡片与表格视图。
- **约 1000 个 API 报价**：输入、输出、缓存读/写价格，支持 USD/CNY 切换、排序、筛选与 CSV 导出。
- **本地数据快照**：`npm run refresh` 抓取并生成 JSON；抓取失败时回退到最近一次成功缓存。
- **单文件分享版**：`npm run artifact` 生成可离线打开、内嵌数据的 HTML。
- **深色/浅色主题**、响应式布局、键盘可操作性与无障碍适配。

## 快速开始

```bash
npm install
npm run refresh      # 抓取最新数据到 public/data/
npm run dev          # 开发预览 http://localhost:5173
```

生产构建与本地静态服务：

```bash
npm run build
npm run serve        # http://127.0.0.1:4173
```

生成单文件分享版：

```bash
npm run artifact     # artifact/AI-Eyes.html
```

> `public/data/` 与 `artifact/` 已加入 `.gitignore`，源仓库不跟踪；公开站点由 `gh-pages` 分支发布构建后的 JSON 快照。

### 部署到 GitHub Pages

- 公开站点：<https://Ryan11111111.github.io/AIEyes/>
- Pages 来源：`gh-pages` 分支 / 根目录
- 自动部署：`.github/workflows/daily-refresh.yml`
  - 每天 UTC 22:37（北京 06:37）定时运行
  - 推送 `main` 的代码/构建相关路径时也会触发
  - 流程：`npm ci` → `npm run refresh` → `npm run build` → 推送 `dist/` 到 `gh-pages`
  - 可在 Actions 页面手动 Run workflow
- 手动更新：运行 `npm run refresh`、`npm run build`，再把 `dist/` 内容提交到 `gh-pages` 并推送。

### 可选：GitHub token

公开仓库的原始文件可以匿名读取；token 只是把 GitHub 请求限额从约 60 次/小时提高到 5000 次/小时。需要时在项目根目录创建 `.env.local`：

```bash
GITHUB_TOKEN=github_pat_xxx
```

- `.env.local` 已被 `.gitignore` 忽略，不会提交；
- 脚本只对 `raw.githubusercontent.com`、`github.com`、`api.github.com` 发送 `Authorization` 头；
- 没有 token 也能正常运行，只是更容易遇到限额；
- 不要把 token 写进 `data/*.json`、页面或命令行参数。

## 数据来源

| 数据 | 来源 | 许可 | 更新方式 |
| --- | --- | --- | --- |
| 文本 / 代码 / Agent 排名 | [LMArena Leaderboard Dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset)，经 `hf-mirror.com` 镜像获取 | CC BY 4.0 | `npm run refresh` |
| API 价格、上下文、模态、工具能力 | [LiteLLM `model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) | MIT | `npm run refresh` |
| USD → CNY 汇率 | [Frankfurter](https://frankfurter.dev/)（ECB 参考汇率），失败时回退到 `frankfurter.app` | MIT | `npm run refresh` |
| 鹈鹕测试样本与评分 | [sergiopaniego/pelican-svg-drawings](https://huggingface.co/datasets/sergiopaniego/pelican-svg-drawings) | Apache-2.0 | 静态快照 |
| Coding 套餐 | 各厂商官方定价页与公开横评 | 本项目人工整理 | 人工核对 |

> 第三方数据的许可、署名与修改说明见 [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md)；完整许可文本见 [LICENSES/](LICENSES/)。

### 排名口径

- 文本、代码、Agent 三个维度分别取 LMArena 对应竞技场总榜，不做二次加权。
- 同一模型存在多个推理档位时，各维度取最高分；去重后按分数重新排名。
- LMArena 分类榜保留原始榜期、95% 置信区间与票数，不与聚合榜混排。
- 编程 / Agent 测试未覆盖的模型显示 `—`，不参与该维度排名。
- 排名为全站排名，筛选地区或厂商不会改变名次。
- 鹈鹕测试只做专项观察：`reward = 0.35 × structure + 0.65 × semantic`，不进入综合排名。

### 价格口径

- API 价格单位为 **USD / 1M tokens**，来自 LiteLLM 收录的厂商直营或托管渠道标价。
- 同一模型有多个渠道报价时，按模型名归一化去重，优先采用厂商直营条目；托管渠道价可能不同。
- 混合价格 = `(输入 × 3 + 输出) / 4`，用于跨模型横向比较。
- 人民币价格按 Frankfurter / ECB 的 USD/CNY 参考汇率换算。
- Coding 套餐为个人月付标准价，促销价、首月价在备注中单独说明；人民币与美元不做隐性换算。

## 数据刷新与容错

- 每个数据源最多重试 3 次，单次超时 60 秒。
- 成功抓取的内容缓存在 `data/.cache/`；GitHub Actions 通过 `actions/cache` 在运行之间复用缓存。
- 抓取失败时自动读取最近成功缓存，`meta.json` 中对应来源状态标记为 `cached`。
- 汇率接口失败时依次回退 `frankfurter.app` 与内置兜底汇率。
- 页面顶部和“数据源”区展示本次生成时间、建议刷新时间与 LMArena 榜期。

> 线上数据每天由 GitHub Actions 自动刷新（UTC 22:37 / 北京 06:37）并发布到 `gh-pages`。`meta.json` 中的 `nextRefreshAt` 只是建议节奏，实际执行以 workflow 定时为准。

## 项目结构

```text
AIEyes/
├── .github/workflows/
│   └── daily-refresh.yml    # 每日自动刷新并发布 gh-pages
├── src/
│   ├── components/          # Hero、模型榜、LMArena、鹈鹕、象限图、套餐、API 表等
│   ├── lib/                 # 类型、数据加载、格式化
│   ├── App.tsx
│   └── styles.css
├── scripts/
│   ├── refresh-data.mjs     # LMArena / LiteLLM / 汇率 / 鹈鹕抓取与数据合并
│   ├── build-artifact.mjs   # 生成内嵌数据的单文件 HTML
│   ├── serve.mjs            # 静态预览服务器
│   ├── daily-refresh.sh     # 本机手动刷新脚本（可选，线上由 Actions 执行）
│   └── install-cron.sh      # 本机 cron 安装脚本（可选，当前未使用）
├── docs/
│   ├── usage.md             # 页面使用说明
│   ├── roadmap.md           # 后续计划
│   └── status.md            # 换源与公开状态记录
├── data/
│   ├── coding-plans.json    # 人工维护的套餐数据源
│   └── .cache/              # 抓取缓存（不入库）
├── public/data/             # 本地数据快照（已 gitignore，不入库）
├── artifact/AI-Eyes.html    # 本地单文件分享版（已 gitignore，不入库）
├── LICENSES/                # 第三方许可全文
├── LICENSE                  # 本项目代码许可（MIT）
├── THIRD_PARTY_DATA.md      # 第三方数据署名与修改说明
└── README.md
```

## 数据文件

> 以下文件在源仓库的 `main` 分支中不跟踪，已加入 `.gitignore`；公开站点通过 `gh-pages` 分支发布构建后的快照。

- `public/data/models.json`：LMArena 聚合榜模型 + LiteLLM API 价格目录
- `public/data/lmarena.json`：LMArena 文本 / 代码 / Agent 三个榜单及分类
- `public/data/pelican.json`：鹈鹕测试聚合统计与外部链接
- `public/data/plans.json`：Coding 套餐
- `public/data/meta.json`：刷新时间、汇率、统计、来源状态、许可与免责声明

## 已知限制

- LiteLLM 的价格目录覆盖有限或存在时滞；部分新模型暂时没有报价，页面显示 `—`。
- LiteLLM 收录的是厂商或渠道公开标价，可能不含批处理价、区域价或企业折扣。
- LMArena 通过 HuggingFace 镜像获取，镜像可能比官方晚 1–3 天；分数、票数与榜期会随社区投票变化。
- 鹈鹕主表为 2026-07-29 的 HuggingFace 静态数据集，上游至今未更新；Jetty 独立榜只提供外链。
- Coding 套餐价格与额度变化频繁，人工核对存在时滞；重要采购决策请以官方页面为准。
- 国内部分云厂商套餐价格为限时活动价或首月价，页面已在备注与 `data/coding-plans.json` 中区分。

## 许可

- 本项目代码以 [MIT](LICENSE) 发布。
- LMArena 数据遵循 CC BY 4.0，LiteLLM 与 Frankfurter 遵循 MIT，鹈鹕数据集遵循 Apache-2.0。
- 不得给第三方数据再授权；再分发时请保留 [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md) 中的署名与修改说明。
- 2026-10-27 之前的旧数据包含受限来源，请勿重新公开分发。

## 说明

本项目为独立数据整理与可视化项目，与所列厂商、LMArena、LiteLLM、Frankfurter 均无隶属关系。数据仅供研究与选型参考。
