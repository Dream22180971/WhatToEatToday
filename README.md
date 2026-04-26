# WhatToEatTodayApp

「What To Eat Today / 三餐有意思」项目仓库，包含：
- **小程序端（Taro + React）**：`miniprogram/`
- **云函数（aiService）**：`miniprogram/cloudfunctions/aiService/`
- （可选）Web 端原型：`src/`（非小程序主入口）
<img width="2560" height="922" alt="image" src="https://github.com/user-attachments/assets/5bcb3c7a-6939-4720-bb56-9a1640f97e43" />


## 目录结构

- `miniprogram/`: 微信小程序（Taro 4.x + React）
  - `src/services/qwen.ts`: 前端统一调用云函数 `aiService`（对话/视觉/生图）
  - `src/pages/discovery/`: AI 图片识别导入菜谱
  - `src/pages/recipe-detail/`: 菜谱详情与 AI 生成封面
  - `cloudfunctions/aiService/index.js`: AI 云函数入口（CloudBase AI / 自定义 OpenAI 兼容模型）
- `scripts/`: 本地调试脚本
  - `miniprogram/scripts/test-dashscope-imggen.mjs`: 本地验证 DashScope 生图接口（不依赖小程序/云函数）

## 环境要求

- Node.js（建议 LTS）
- 微信开发者工具（开启云开发）
- 云开发环境（用于部署云函数、云存储）

## 快速开始（小程序）

在 `miniprogram/` 目录执行：

```bash
npm install
npm run dev:weapp
```

然后用微信开发者工具导入 `miniprogram/` 目录。

## 云函数部署与环境变量

云函数：`miniprogram/cloudfunctions/aiService`

当前 AI 调用统一由小程序端调用 `aiService` 云函数，云函数内部再通过 CloudBase AI 能力调用模型：

- 文本生成：CloudBase `hunyuan-exp`，默认模型 `hunyuan-2.0-instruct-20251111`
- 图片识别/图生文：优先使用 CloudBase 自定义模型厂商 `dashscope-custom`，模型 `qwen3.5-omni-flash`
- AI 生成封面：CloudBase 生图模型 `hunyuan-image`

> 注意：`aiService` 依赖 `@cloudbase/node-sdk`。部署时需要上传整个 `miniprogram/cloudfunctions/aiService/` 目录，包括 `package.json`、`package-lock.json` 和依赖安装结果，不能只替换 `index.js`。

### CloudBase 控制台模型配置

在 CloudBase 控制台的 `AI` 模块中确认以下能力：

1. `生文模型`
   - 启用 `hunyuan-exp`
   - 可用模型包含 `hunyuan-2.0-instruct-20251111` / `hunyuan-turbos-latest`
2. `生图模型`
   - 启用 `hunyuan-image`
   - 生图尺寸使用 `1024x1024` 这类 `x` 格式，不使用 `1024*1024`
3. `全模态/图生文`
   - 新增自定义模型厂商，模型分组名为 `dashscope-custom`
   - Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`
   - 模型名：`qwen3.5-omni-flash`
   - API Key 只配置在 CloudBase 控制台，**不要写进代码或提交到仓库**

部署云函数后，小程序端会通过 `Taro.cloud.callFunction({ name: 'aiService' })` 调用。

## 本地云函数调试（可选）

如果你在开发者工具里开启了“调用本地云函数/本地调试”，请确认本地 `cloudfunctions/aiService` 已执行依赖安装：

```powershell
cd miniprogram/cloudfunctions/aiService
npm install
```

并重启本地云函数调试进程/重启开发者工具。

## 常见问题

### 1. `Cloud API isn't enabled, please call wx.cloud.init first`
说明云开发未初始化。项目已在小程序入口显式初始化环境 `cloud1-d5g1waohpc2fbf6bf`，若仍出现，请确认开发者工具已开启云开发并选择同一云环境。

### 2. 云函数超时（`-504003 Invoking task timed out after 3 seconds`）
把云函数 `aiService` 的超时时间调大（视觉/生图建议 ≥ 60s）。

### 3. `ai.createModel is not a function`
通常是云函数仍在使用旧版本代码或旧依赖。确认 `aiService` 已安装并部署 `@cloudbase/node-sdk@3.x`，服务端需要先调用 `app.ai()` 后再使用 `createModel()`。

### 4. 图生文报 `model验证失败`
通常是把文本模型（如 `hunyuan-turbos-latest`）用于图片输入。图生文需要全模态模型，当前项目优先使用 `dashscope-custom / qwen3.5-omni-flash`。

### 5. 生图报 `size not match`
CloudBase `hunyuan-image` 的尺寸格式为 `1024x1024`、`768x1024` 等。项目已在前端和云函数侧做格式归一化，会把旧格式 `1024*1024` 转为 `1024x1024`。

## AI 接入复盘

本轮 AI 接入最终结论：

- 前端不再直连模型网关，所有 AI 能力统一走 `aiService` 云函数，避免小程序端 token/环境权限不一致导致 401。
- `wx-server-sdk@3.0.4` 不包含 `cloud.extend.AI` 服务端能力，云函数必须使用 `@cloudbase/node-sdk@3.x` 的 `app.ai()`。
- 服务端 `streamText` 入参是 `{ model, messages }`，不是小程序端示例里的 `{ data: { model, messages } }`。
- CloudBase 内置 `hunyuan-exp` 文本生成已跑通。
- 腾讯侧 `hunyuan-vision` 当前环境未授权，图片识别改为 CloudBase 自定义 OpenAI 兼容模型 `dashscope-custom / qwen3.5-omni-flash`。
- 生图使用 `hunyuan-image`，云函数通过 `ai.createImageModel('hunyuan-exp').generateImage()` 调用。
