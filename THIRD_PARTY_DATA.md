# 第三方数据与许可

AI Eyes 的代码以根目录 [LICENSE](LICENSE)（MIT）发布。页面展示的数据来自下列第三方来源，
各自保留原有许可；本项目不对这些数据再授权。完整许可文本见 [LICENSES/](LICENSES/)。

| 数据 | 来源 | 许可 | 本项目所做的处理 |
| --- | --- | --- | --- |
| 文本 / 代码 / Agent 竞技场榜 | [LMArena Leaderboard Dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 抓取三个 latest 分榜，按模型名去重、同模型多档位取最高分并重新排名；保留榜期、置信区间与票数；与 LiteLLM 价格按模型名匹配 |
| 单模型 API 价格、上下文、模态、工具能力 | [LiteLLM `model_prices_and_context_window.json`](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) | [MIT](https://github.com/BerriAI/litellm/blob/main/LICENSE) | 筛选聊天类模型，按模型名归一化去重，优先采用厂商直营条目；价格换算为 USD / 1M tokens |
| USD → CNY 汇率 | [Frankfurter](https://frankfurter.dev/)（数据源为欧洲央行 ECB 参考汇率） | [MIT](https://github.com/lineofflight/frankfurter/blob/main/LICENSE) | 仅取 USD/CNY 最新参考价，用于页面人民币换算 |
| 鹈鹕 SVG 样本与评分 | [sergiopaniego/pelican-svg-drawings](https://huggingface.co/datasets/sergiopaniego/pelican-svg-drawings) | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | 聚合 7 个模型的 139 个样本，计算平均 reward、结构分、语义分与盲评识别率 |
| Coding 套餐 | 各厂商官方定价页与公开横评 | 本项目人工整理 | 价格与权益为事实性信息，页面文案与结构化数据由本项目编写；购买前以厂商页面为准 |

## 署名与修改说明

### LMArena（CC BY 4.0）

> 数据来源：LMArena Leaderboard Dataset，作者 LMArena，许可 CC BY 4.0。
> 本项目对原始数据进行了去重、同模型多档位取最高分、重新排名、与价格数据匹配，并在页面上以不同视图展示。
> 许可全文：<https://creativecommons.org/licenses/by/4.0/>

原始数据未作商业背书；本项目与 LMArena 无隶属关系。

### LiteLLM（MIT）

> Copyright (c) 2023 Berri AI
> 本项目的价格目录来自 LiteLLM 的 `model_prices_and_context_window.json`，经筛选、去重与单位换算后展示。
> 许可全文：[LICENSES/MIT-LiteLLM.txt](LICENSES/MIT-LiteLLM.txt)

### Frankfurter（MIT）

> Copyright (c) Hakan Ensari
> 本项目仅使用 Frankfurter 提供的 USD/CNY 参考汇率。
> 许可全文：[LICENSES/MIT-Frankfurter.txt](LICENSES/MIT-Frankfurter.txt)

### Pelican SVG Drawings（Apache-2.0）

> 数据集：sergiopaniego/pelican-svg-drawings，许可 Apache-2.0。
> 许可全文：[LICENSES/Apache-2.0.txt](LICENSES/Apache-2.0.txt)

## 已移除的来源

2026-10-27 的换源版本不再抓取或展示 Artificial Analysis、OpenRouter、ExchangeRate-API 与 Jetty 的数据：

- Artificial Analysis、OpenRouter 的条款限制公开复制/再分发或竞争性使用；
- ExchangeRate-API 禁止再分发汇率数据；
- Jetty 仅保留为外链，页面不抓取其评分明细。

如果旧版本的数据文件或页面快照仍在本地或第三方缓存中，请勿重新公开分发。
