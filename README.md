# @fengye0926/pi-code-review

ECC 的 code review 能力，迁移为 pi（[pi](https://github.com/earendil-works/pi)）可独立安装的本地包。

**来源**：[affaan-m/ECC](https://github.com/affaan-m/ECC) @ `c70874f`（MIT）。每个迁移文件头部有 `source:` 标注；正文以上游原文为准，只做宿主绑定、路径替换和上游专有资产的引用标注（见[改了什么](#改了什么)）。仓库不做模型 / 思考档位绑定：不出现任何 `model:`、`thinking:` 与具体型号/provider 名。

## 来源分层

| 层 | 内容 | 说明 |
|---|---|---|
| 上游原文 | 15 个 agent、6 个审查命令、31 个技能（laravel ×3、`mysql-patterns`、`postgres-patterns`、`database-migrations`、`security-review`、`coding-standards`、`frontend-patterns`、`backend-patterns`、`golang-*`、`python-*`、`tdd-workflow`、`vue-patterns`、`react-patterns`、`react-testing`、`accessibility`、`santa-method`、`verification-loop`、`springboot-*`、`quarkus-*`、`java-coding-standards`、`jpa-patterns`）、`rules/react` + `rules/vue` 全量规则、`reference/code-review-rule.md` | ECC 为准，只改宿主绑定与引用标注 |
| 本地撰写 / 改编 | `agents/webman-reviewer.md`、`skills/code-review-skill/`、`skills/orch-review/`、`skills/react-rules/`、`skills/vue-rules/`、`prompts/orch-review.md`、`prompts/santa-loop.md`、`prompts/verify.md` | 常驻 worker 审查、路由入口、orch-review / santa-loop / verify 的 pi 适配、规则包封装 |

## 技术栈覆盖（v1.3）

Vue、React、TypeScript/JavaScript、PHP（上游 `php-reviewer` 覆盖 Laravel / 通用 PHP；webman / workerman 由 `webman-reviewer` 覆盖）、MySQL（知识经 `mysql-patterns` 技能）、Go、Python、Java（Spring / Quarkus）、PostgreSQL / Supabase（`database-reviewer`）。安全、数据库迁移、通用规范、前端/后端模式的配套知识包已随包提供。

## 仓库结构

```text
agents/                     16 个 subagent（按调用加载，零常驻；不预设模型与思考档位，继承调用会话）
  code-reviewer.md            通用质量/安全 + 防噪音门（四问前置、证言门、否决清单、机械裁决）
  typescript-reviewer.md      TS/JS 路线：类型安全、async、惯用法
  vue-reviewer.md             Vue 路线：响应性、v-html、Composable、Props/Emits、Router/Store
  react-reviewer.md           React 路线：Hook 规则、RSC 边界、可访问性
  php-reviewer.md             PHP 路线（上游原文，Laravel / 通用 PHP）
  webman-reviewer.md          webman/workerman 常驻进程路线（本地撰写）
  go-reviewer.md              Go 路线：race、context、error wrap
  python-reviewer.md          Python 路线
  java-reviewer.md            Java 路线：支付/事件驱动状态机
  database-reviewer.md        PostgreSQL / Supabase 专用（上游原文）
  security-reviewer.md        安全路线：OWASP Top 10、密钥、注入、鉴权
  code-simplifier.md          简化（writer，需显式调用）
  comment-analyzer.md         注释准确性 / 腐化风险
  pr-test-analyzer.md         PR 测试覆盖质量
  silent-failure-hunter.md    静默失败 / 坏兜底
  type-design-analyzer.md     类型设计与不变量
prompts/                    9 个命令（pi prompt 模板）
  code-review.md              /code-review  — PRP 风格清单，本地 diff 或 GitHub PR
  review-pr.md                /review-pr    — 六 agent 并行 PR 审查
  orch-review.md              /orch-review  — 对抗验证审查（调用 orch-review skill 的 workflow 脚本）
  santa-loop.md               /santa-loop   — 双 reviewer 收敛循环（最多 3 轮）
  verify.md                   /verify       — 六阶段交付前验证
  vue-review.md               /vue-review   — Vue 专项（含 vue-tsc 等）
  react-review.md             /react-review — React 专项
  go-review.md                /go-review    — Go 专项
  python-review.md            /python-review — Python 专项
skills/                    35 个（按需加载）
  路由与流程
    code-review-skill/          审查车道路由 + 合并规则（本地撰写）
    orch-review/              对抗验证审查 + pi workflow 脚本（本地改编）
    santa-method/             双独立 reviewer 方法论（上游原文，Pattern A 已 pi 化）
    verification-loop/        六阶段验证（上游原文，措辞已 pi 化）
  语言 / 框架知识包
    laravel-patterns/ laravel-security/ laravel-tdd/
    mysql-patterns/ postgres-patterns/ database-migrations/
    security-review/（含 cloud-infrastructure-security.md 参考文件）
    coding-standards/ frontend-patterns/ backend-patterns/
    golang-patterns/ golang-testing/
    python-patterns/ python-testing/ tdd-workflow/
    vue-patterns/ react-patterns/ react-testing/ accessibility/
    springboot-patterns/ springboot-security/ springboot-tdd/ springboot-verification/
    quarkus-patterns/ quarkus-security/ quarkus-tdd/ quarkus-verification/
    java-coding-standards/ jpa-patterns/
  规则包
    react-rules/references/{coding-style,hooks,patterns,security,testing}.md
    vue-rules/references/{coding-style,hooks,patterns,security,testing}.md
reference/
  code-review-rule.md         上游 always-on 规则，存档未挂载
```

## 安装

需要 pi ≥ 0.99 与 pi-subagents 扩展（读取 `pi.subagents.agents` 的 agents 挂载声明）。

```bash
# npm（发布后）
pi install npm:@fengye0926/pi-code-review

# 或从 git 安装（GitHub 仓库建议同步改名为 pi-code-review）
pi install git:github.com/fengye0926/pi-code-review
```

安装后重启 pi，验证：`pi list` 可见；会话内 `/review-pr` 等命令存在；
"review my uncommitted changes" 会派发 `code-reviewer` 子代理。

## 审查强度分层

| 强度 | 入口 | 说明 |
|---|---|---|
| 清单 | `/code-review` | 单 agent 按阶段清单走查（本地 diff 或 GitHub PR） |
| 多 agent | `/review-pr` | 六个分析器并行 + 合并去重 |
| 对抗验证 | `/orch-review` | 维度并行 → 证据去重 → 每条 CRITICAL/HIGH 独立反证，fail-closed；pi 原生 workflow 实现，失败维度会拒绝给出批准 |
| 双 reviewer 收敛 | `/santa-loop` | 两个独立 reviewer 同一 rubric 双通过，最多 3 轮；失败升级人工 |
| 交付前验证 | `/verify` | build → typecheck → lint → test/coverage → security grep → diff review |

## 触发接线（可选）

pi 没有 always-on 规则注入；`code-review-skill` 路由技能靠 description 触发。若希望每个项目稳定地在改完代码后走审查，在项目 `AGENTS.md` 里加一段习惯约定：

```markdown
## Review habit
- 写完或改完代码后，先自己跑构建/类型检查/测试；失败先修再报。
- 然后派发独立审查：一般改动用 `/code-review`；PR 或多文件改动用 `/review-pr`；合并前用 `/orch-review`（对抗验证，需要背景子代理可用）。
- 安全敏感改动（鉴权、用户输入、支付、密钥、加密）额外跑 `security-reviewer`。
```

## 模型与思考档位

**本包不做任何模型 / 推理档位绑定（迁移目的之一）**：所有 agent 不写 `model:`、不写 `thinking:`，一律继承调用会话的模型与思考强度，不假定任何 provider、型号或档位。使用时自行切换到合适的模型与强度即可；需要逐次指定时在**调用侧**传 `model`（如 `provider/id:high`，后缀即思考档位），不要写回包内文件，保持仓库可移植。

## 未随包提供（有意排除）

- 其余 13 个上游 reviewer（cpp、csharp、django、fastapi、flutter、fsharp、healthcare、kotlin、mle、network-config、rag-pipeline、rust、swift）及其语言命令。
- `rules/<language>/*` 语言规则（react / vue 规则仅在 agent、prompt 中作为上游引用标注）。
- 其余栈外框架的知识包与命令未迁移（Kotlin / Perl / Rust / Dart-Flutter / .NET / NestJS / Rails 等的 pattern、security、tdd 技能，以及对应语言 reviewer）。
- 未迁移的上游命令：`/security-scan`（依赖 AgentShield 商业扫描器）、`/go-test`、`/go-build`、`/react-test`、`/react-build`、`/build-fix`、`/epic-review` 等。
- 上游 `.pi` 扩展与 hooks（always-on 规则注入、hook runtime）；本包以 `reference/` 存档加 `code-review-skill` 路由技能替代。

## 改了什么

- 不做模型 / 思考档位绑定：移除全部 `model:` 与 `thinking:` 预设及具体型号名（迁移目的之一），agent 继承调用会话，设置只在调用侧做
- 文档引用路径：`.claude/*` 等 → `AGENTS.md` / `CONTEXT.md` / `.scratch/`；上游专有资产统一标注"未随包提供"
- 触发用语：上游自动触发语义 → 显式触发语义（由调用方决定）
- `/orch-review`：上游 Claude Code Workflow（`agent()`/`parallel()`/`schema`）重写为 pi-subagents workflow 脚本（`runs.all` + `outputSchema`，纯 Promise 链，无嵌套 async），维度映射到本包 reviewer，并新增 database 条件维度与语言自动探测
- 伴侣知识包按栈随包提供：Go / Python / 前端（React / Vue）/ TDD / 可访问性 + `rules/react`、`rules/vue` 规则包；reviewer 的 Reference 全部改指本地技能
- `santa-method` 与 `verification-loop` 移植：Pattern A 改为 pi `subagent`，`/santa-loop`、`/verify` 命令适配（不做模型绑定、不自动 push）
- Java 伴侣知识包随包提供：`springboot-*`、`quarkus-*`、`java-coding-standards`、`jpa-patterns`，java-reviewer 的 Reference 全部改指本地技能
- 每个上游文件加入 `source:` 标注；本地撰写文件注明本地来源

## 开发校验

```bash
node scripts/check-package.mjs          # 静态检查 + 本地 pi 加载测试（有 pi 时）
node scripts/check-package.mjs --no-pi  # 仅静态检查（CI 用）
```

静态检查覆盖：frontmatter 完整性、资源数量、上游 `source:` 标注、包内不得出现
`model:` / `thinking:` 绑定、`orch-review` workflow 语法；本地有 `pi` 时会额外验证
9 个命令与 35 个技能确实被挂载。GitHub Actions（`.github/workflows/ci.yml`）跑
`--no-pi` 版本。
