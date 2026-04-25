# WhatToEatTodayApp

「What To Eat Today / 三餐有意思」项目仓库，包含：
- **小程序端（Taro + React）**：`miniprogram/`
- **云函数（aiService）**：`miniprogram/cloudfunctions/aiService/`
- （可选）Web 端原型：`src/`（非小程序主入口）

## 目录结构

- `miniprogram/`: 微信小程序（Taro 4.x + React）
  - `src/services/qwen.ts`: 前端统一调用云函数 `aiService`（对话/视觉/生图）
  - `src/pages/discovery/`: AI 图片识别导入菜谱
  - `src/pages/recipe-detail/`: 菜谱详情与 AI 生成封面
  - `cloudfunctions/aiService/index.js`: 云函数入口（对接 DashScope/百炼）
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

需要配置环境变量（在云开发控制台配置，**不要写进代码/仓库**）：

- `DASHSCOPE_API_KEY`: 阿里百炼（DashScope）API Key

部署云函数后，小程序端会通过 `Taro.cloud.callFunction({ name: 'aiService' })` 调用。

## 本地云函数调试（可选）

如果你在开发者工具里开启了“调用本地云函数/本地调试”，本地进程不会自动拿到云端环境变量，需要在本地终端设置：

```powershell
$env:DASHSCOPE_API_KEY="你的Key"
```

并重启本地云函数调试进程/重启开发者工具。

## 常见问题

### 1. `Cloud API isn't enabled, please call wx.cloud.init first`
说明云开发未初始化。项目已在小程序入口做了 `Taro.cloud.init()`，若仍出现，请确认开发者工具已开启云开发并选择云环境。

### 2. 云函数超时（`-504003 Invoking task timed out after 3 seconds`）
把云函数 `aiService` 的超时时间调大（视觉/生图建议 ≥ 60s）。

### 3. 生图报 `url error, please check url`
通常是模型与接口不匹配或 endpoint 配置不正确。建议先用本地脚本验证：

```powershell
$env:DASHSCOPE_API_KEY="你的Key"
node miniprogram/scripts/test-dashscope-imggen.mjs
```
