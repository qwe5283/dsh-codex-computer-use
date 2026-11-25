# 验证记录

## 新版适配（2026-11-25）

环境：Windows、Node.js 24.14.0、DSH 内置 Node.js 24.21.0、DSH 0.2.2-rc.5、Codex Desktop 26.1120.5083.0、`@oai/sky 0.7.26`、`codex-cli 0.171.0-alpha.13.2`。

- 32 项自动测试、JavaScript 语法检查和浏览器菜单构建通过；新增安装包运行时优先、提取目录回退和配套 CLI 选择测试。
- 普通 `doctor` 自动选择当前安装包的 Sky 与 CLI，原生窗口枚举通过，不再使用旧提取版 Sky 0.7.18 / CLI 0.167。
- 使用 DSH 桌面端 Electron 清除 Codex 环境变量、插件显式路径覆盖和 Codex PATH 条目后，仍自动找到当前安装包并完成 10 个窗口的只读枚举；未截图、点击、输入或请求模型。记录见 [启动验证](startup-validation.json)。
- 在独立临时 DSH 0.2.2-rc.5 Web profile 中成功安装并启动插件。实际“＋”菜单出现 `Computer Use computer 使用 Codex 操作电脑`，点击后只向草稿插入提示，未发送消息；浏览器控制台没有警告或错误。该检查未修改当前 desktop profile。
- 本轮没有重新执行真实应用授权、截图、点击或输入测试；这些能力仅有下列旧版记录，不能据此声明新版完整交互已经验证。

## desktop profile 故障修复（2026-11-25）

- 在真实 desktop profile 复现 `agents.roots is not a function`：DSH 0.2.2 已删除该 API，现改用 `session.header.origin !== 'subagent'`，并保留 `agents.get(id)` 的实例校验；子代理拒绝测试通过。
- 授权等待原先会暂停工具超时，导致授权窗口未处理时无限阻塞。现在授权 UI 与工具调用共用 `timeoutMs`，超时传播到窗口/问答取消、工作进程退出和调用失败；实测超时后无相关残留进程。
- 用户明确选择完全权限下自动允许应用访问，新增可选 `autoApproveApps`。测试覆盖完全权限自动允许、其他模式仍需确认，以及 `autoApproveApps` 不会跳过敏感操作 `confirm`。
- `status` 新增 `approval_ui`，用于核对工作进程实际收到的授权模式；当前 desktop profile 已重载修复，并按用户选择设置 `approvalUi: dsh`、`autoApproveApps: true`。
- 35 项自动测试和语法检查通过。修复后 `get_window_state` 已越过 DSH 授权层，最终到达 Codex 原生错误：`browser URL policy enforcement is not yet supported for the current Windows browser`。这是 Firefox 的原生浏览器策略限制，本轮未重试、未绕过，也未把它记作 B 站操作成功。

## 早期验证（2026-10-01）

环境：Windows、Node.js 24.19.0、DSH 0.2.0-rc.2、Codex 本机 `@oai/sky 0.7.5`。

**早期验证通过内容：**

### 0.1.4 独立授权窗口与任务结束清理

- 真实 DSH SDK 宿主中完成窗口观察、激活窗口、点击、输入和按钮验证，6 张截图成功回传。权限保持 `danger-full-access` / `never`。
- 在模型输出结束前记录本次插件工作进程及其原生辅助进程；收到本轮结束后保持 DSH 宿主打开，核验这些进程全部退出。插件工作进程退出码为 0，剩余进程数为 0，证明清理来自任务生命周期，而非关闭 DSH 后的附带结果。没有另行截取整个桌面作为状态条消失的视觉证据。
- 首次运行中输入未出现在目标文本框，测试停止且未重发输入。新建测试窗口后，先明确激活窗口，再执行输入与验证，结果通过。
- 真实 Windows 授权窗口成功显示；取消任务后窗口进程退出。独立窗体测试核验允许、拒绝按钮及默认拒绝焦点，并检查中文渲染；该窗体测试不连接真实应用授权。原生操作测试继续使用此前获用户授权的测试窗口专用响应器。
- 自动测试覆盖进程正常关闭、会话切换、其他会话结束不影响当前会话、取消、无效或重复授权结果，以及原生停止后同一轮不能重建连接继续操作。
- 30 项自动测试、JavaScript 语法检查和菜单构建通过。
- 顶部原生状态条品牌文字未更改；独立授权窗口使用 DeepSeek Harness 名称。浏览器 URL 核验限制仍然存在。

记录见 [任务结束清理](host-validation.json) 和 [独立窗口验证](window-consent-validation.json)。

### 0.1.3 完全权限下的授权与原生操作

- 真实 DSH SDK 宿主保持 `danger-full-access`，审批策略保持 `never`。测试响应器检查这两个实际值，未改变权限设置。
- 原生调用完成窗口枚举、测试窗口截图、点击输入框、输入文字、重新观察、点击验证按钮。应用实际写出 `DSH Codex native input 2026`，5 张图片经 DSH 附件服务回传。
- 此次测试沿用用户对自建测试窗口的授权，测试专用响应器只接受该窗口对应的应用标识，不包含在安装包中。
- 第一次检查发现输入后立即返回的快照尚未包含文字；测试增加一次观察，未重发输入，最终通过按钮写出的文件验证。原生输入返回与应用处理完输入队列是两个时刻。
- 另启动真实 DSH Web 宿主，通过界面操作模拟应用的授权框，验证拒绝、允许、同一会话复用、单次操作确认、同一次工具调用内连续确认。四次工具结果均保持 `danger-full-access` / `never`。此界面测试不授予任何真实应用权限。
- 23 项针对性测试、JavaScript 语法检查和菜单构建通过。取消后的迟到回答、跳过、自由文本、错误问题标识和重复回答均不会授予应用访问许可。

记录见 [原生操作结果](host-validation.json) 和 [真实界面结果](consent-ui-validation.json)。两项使用本地 HTTP 模型测试程序，没有付费模型请求。

### Windows 浏览器限制

用户实测的浏览器错误为 `could not determine the current browser URL on Windows with enough confidence to enforce policy`。已核对 [OpenAI 上游问题 #25271](https://github.com/openai/codex/issues/25271)，2026-10-01 查阅时仍为 Open，记录了相同错误及普通桌面应用可以工作的情况。

0.1.3 识别这一停止错误，保留原始错误并明确要求停止本轮操作，不再附加「重新观察」的通用恢复建议。插件未修改 OpenAI 的 URL 校验，未绕过停止条件，也未把普通窗口测试通过记作浏览器测试通过。

### 0.1.2 独立启动 DSH

实际 DSH 会话中，原生工具返回 `failed to launch codex app-server: program not found`。错误来自 Codex 原生辅助程序内部；0.1.0 的测试继承了 Codex 提供的 CLI 路径，因此没有覆盖独立启动环境。

- 修复前，清除 `CODEX_*` 环境变量和 Codex 的 PATH 条目后稳定复现相同错误。
- 修复后，自动查找 CLI，并仅为插件工作进程设置 `CODEX_CLI_PATH`。
- 使用真实 DSH 桌面端 Electron 可执行程序启动子进程，清除 `CODEX_*`、`SKY_*`、请求元数据和 Codex 的 PATH 条目，成功完成原生窗口枚举。
- 20 项测试和 JavaScript 语法检查通过，包含缺少环境变量、不完整安装、失效继承路径、显式配置和 Windows Path 大小写处理。
- `status` 明确报告 `runtime_loaded` 和 `native_call_verified`，不再把接口加载等同于原生进程可用。

结果见 [startup-validation.json](startup-validation.json)。本轮没有截图、点击或输入，也没有模型请求；没有退出当前 Codex 桌面应用，因此该记录证明不依赖继承环境，不声称做过退出 Codex 主窗口后的实测。

### 0.1.1 菜单入口

- 使用 DSH 0.2.0-rc.2 的真实 Web 宿主和独立临时 profile，加载实际构建的客户端模块。
- 输入框“＋”列表显示 `Computer Use computer 使用 Codex 操作电脑`。
- 点击入口后，在已有草稿前填入提示；用实际按键输入 `Keep draft 123` 后验证保留完整文字。
- 输入 `/computer` 可筛选该项，回车后填入提示并消费命令，不提交聊天消息。
- 修正键盘选项在 Lexical 更新中执行时的时序：等待原生命令消费完成后再插入。
- 检查浏览器构建与 JavaScript 语法。本次只修改菜单和说明，没有重复执行原生鼠标输入测试。

原生菜单会消费选中的文本范围；需要保留草稿时，将光标放到末尾再打开菜单。测试未发送模型请求。

### 0.1.0 电脑操作链路

- 18 项针对性测试：会话隔离、过期观察、操作失败后的状态、坐标与截图对应、应用限制、图片附件转换、权限拒绝、原生授权转发、进程串行执行和取消后退出。
- JavaScript 语法检查。
- `doctor`：从安装目录找到 SDK，实际枚举 Windows 窗口。
- 真实 DSH SDK 宿主：注册两个工具，依次运行 `status`、`list_windows`、`get_window_state`、点击文本框、输入文字、点击验证按钮。
- 真实原生操作：自建 WinForms 应用最终收到 `DSH Codex native input 2026`，通过按钮事件写出的文件和最终控件树交叉确认。
- 4 张真实截图经过 DSH 附件服务保存，返回值含有效图片附件标识。

用户已明确批准本次自建测试窗口的截图、输入和点击。验证在独立临时 DSH_HOME 中运行；测试专用审批响应器仅用于本次授权的测试应用，不包含在安装包中。

完整工具顺序和最终控件树见 [host-validation.json](host-validation.json)。模型接口使用本地 HTTP 测试程序，未调用付费模型。

## 实现中处理的问题

Codex 不返回 PowerShell 承载的测试窗体，因此原生验证使用单独编译的 WinForms 应用。SDK 在独立进程中缺少应用授权入口的问题，通过已有 elicitation 回调接入真实 DSH 审批服务解决；未修改 OpenAI 文件或原生授权判断。

## 验证边界

真实输入验证覆盖控件点击、文字输入、自动刷新和截图保存。滚动、拖动、启动应用、快捷键和辅助操作已接入相应 SDK 方法，但未逐一对真实应用执行。没有验证任意第三方应用，也没有测试生产模型自动选择操作的准确性。

应用授权使用的宿主回调不是稳定公开的第三方扩展规范。Codex 更新后应先运行 `doctor`，再对指定测试窗口验证一次授权与截图；`doctor` 通过本身不代表截图和输入授权已完成。

安装到已有 DSH profile 与当前运行中的桌面进程已经加载，是两种状态。完成安装后应重新启动 DSH；本任务不会为了加载插件强制结束用户正在运行的桌面会话。
