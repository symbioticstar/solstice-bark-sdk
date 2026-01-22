# @ssolstice/bark-sdk 技术文档

## 1. 概述

Bark 是一个基于 APNs 的 iOS 推送通知服务。@ssolstice/bark-sdk 提供 TypeScript 友好的接口，支持单设备推送、批量推送、加密推送、通知更新/删除和健康检查。SDK 默认使用 JSON 方式请求，并提供明确的类型定义与错误处理。

## 2. 基础配置

### 2.1 服务端点

- 官方服务：`https://api.day.app`
- 自部署服务：使用你自己的 Bark Server 域名或 IP

### 2.2 认证

使用设备密钥（`device_key`）进行认证。每个设备都有唯一的密钥。

## 3. API 端点

### 3.1 路径式推送

- `GET/POST /:key/:body`
- `GET/POST /:key/:title/:body`
- `GET/POST /:key/:title/:subtitle/:body`

### 3.2 统一推送端点

- `POST /push`（请求体中必须包含 `device_key` 或 `device_keys`）
- `POST /:key`（同样支持 JSON）

### 3.3 特殊端点

- `GET /ping` 健康检查，返回 `pong`
- `GET /mcp/{key}` MCP (Model Context Protocol) 支持

## 4. 请求方式

### 4.1 GET 请求

参数通过 URL 查询字符串传递：

```text
https://api.day.app/{device_key}/{body}?group=test&badge=1
```

### 4.2 POST 表单

`Content-Type: application/x-www-form-urlencoded`

### 4.3 POST JSON（SDK 默认）

`Content-Type: application/json; charset=utf-8`

```json
{
  "device_key": "your_key",
  "title": "Hello",
  "body": "Bark from SDK"
}
```

## 5. 参数说明

说明：直接调用 HTTP API 时，布尔型参数一般用 `"1"`/`"0"` 表示；SDK 中使用 `boolean` 并自动转换。

### 5.1 基础内容参数

| 参数     | 类型   | 必填 | 说明                                 |
| -------- | ------ | ---- | ------------------------------------ |
| title    | string | 否   | 推送标题                             |
| subtitle | string | 否   | 推送副标题                           |
| body     | string | 否   | 推送内容主体                         |
| markdown | string | 否   | Markdown 推送内容，提供后将忽略 body |

### 5.2 设备标识参数

| 参数        | 类型     | 必填     | 说明                                        |
| ----------- | -------- | -------- | ------------------------------------------- |
| device_key  | string   | 条件必填 | 单设备密钥，使用 `/push` 端点时必需         |
| device_keys | string[] | 否       | 批量推送设备密钥数组（bark-server v2.1.9+） |

### 5.3 通知级别与行为

| 参数     | 类型   | 必填 | 说明                                          |
| -------- | ------ | ---- | --------------------------------------------- |
| level    | string | 否   | `critical`/`active`/`timeSensitive`/`passive` |
| volume   | number | 否   | 重要警告音量 0-10，仅 `critical` 时生效       |
| call     | string | 否   | 传 `"1"` 时铃声重复播放 30 秒                 |
| autoCopy | string | 否   | 传 `"1"` 时自动复制内容                       |
| copy     | string | 否   | 自定义复制内容                                |
| action   | string | 否   | 传 `"none"` 时点击推送不弹窗                  |

### 5.4 视觉与音频

| 参数  | 类型   | 必填 | 说明                 |
| ----- | ------ | ---- | -------------------- |
| badge | number | 否   | 角标数字             |
| sound | string | 否   | 自定义铃声           |
| icon  | string | 否   | 图标 URL，会自动缓存 |
| image | string | 否   | 推送图片 URL         |

### 5.5 分组与存储

| 参数      | 类型   | 必填 | 说明                          |
| --------- | ------ | ---- | ----------------------------- |
| group     | string | 否   | 消息分组标识                  |
| isArchive | number | 否   | 传 `1` 保存推送，其他值不保存 |

### 5.6 交互与导航

| 参数 | 类型   | 必填 | 说明             |
| ---- | ------ | ---- | ---------------- |
| url  | string | 否   | 点击后跳转的 URL |

### 5.7 高级功能

| 参数       | 类型   | 必填 | 说明                           |
| ---------- | ------ | ---- | ------------------------------ |
| id         | string | 否   | 通知 ID，用于更新推送          |
| delete     | string | 否   | 传 `"1"` 删除通知（需配合 id） |
| ciphertext | string | 否   | 加密推送密文                   |

## 6. 请求示例

### 6.1 GET

```bash
curl "https://api.day.app/your_key/Test%20Body"
curl "https://api.day.app/your_key/Test%20Title/Test%20Body?group=test&badge=1&sound=minuet"
```

### 6.2 POST 表单

```bash
curl -X POST https://api.day.app/your_key \\
  -d "body=Test Body&title=Test Title&group=test&badge=1"
```

### 6.3 POST JSON

```bash
curl -X POST "https://api.day.app/push" \\
  -H "Content-Type: application/json" \\
  -d '{
    "body": "Test Body",
    "title": "Test Title",
    "device_key": "your_key"
  }'
```

### 6.4 批量推送

```bash
curl -X POST "https://your-own-server/push" \\
  -H "Content-Type: application/json" \\
  -d '{
    "body": "Batch Message",
    "title": "Batch Title",
    "device_keys": ["key1", "key2", "key3"]
  }'
```

## 7. SDK 类型定义与接口设计

### 7.1 核心类型

```ts
export type BarkLevel = "critical" | "active" | "timeSensitive" | "passive";

export interface BarkNotification {
  title?: string;
  subtitle?: string;
  body?: string;
  markdown?: string;
  level?: BarkLevel;
  volume?: number;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  group?: string;
  url?: string;
  copy?: string;
  autoCopy?: boolean;
  call?: boolean;
  isArchive?: boolean;
  action?: "none";
  id?: string;
  delete?: boolean;
  ciphertext?: string;
}
```

### 7.2 主要接口

```ts
class BarkClient {
  constructor(options?: BarkClientOptions);

  push(options: BarkPushOptions): Promise<BarkApiResponse>;
  batchPush(options: BarkBatchPushOptions): Promise<BarkApiResponse>;
  encryptedPush(options: BarkEncryptedPushOptions): Promise<BarkApiResponse>;
  updateNotification(id: string, options: BarkPushOptions): Promise<BarkApiResponse>;
  deleteNotification(id: string, deviceKey?: string): Promise<BarkApiResponse>;
  ping(): Promise<boolean>;
}
```

### 7.3 SDK 参数命名策略

SDK 使用更符合 TypeScript 习惯的命名（camelCase），并在请求时自动转换为 API 所需字段：

- `deviceKey` -> `device_key`
- `deviceKeys` -> `device_keys`
- `autoCopy`/`call`/`isArchive`/`delete` -> `"1"`/`"0"`

## 8. SDK 使用示例

### 8.1 单设备推送

```ts
import { BarkClient } from "@ssolstice/bark-sdk";

const client = new BarkClient({ deviceKey: "your_key" });

await client.push({
  title: "Test Title",
  body: "Test Body",
  group: "test",
  badge: 1,
  sound: "minuet",
});
```

### 8.2 批量推送

```ts
await client.batchPush({
  title: "Batch Title",
  body: "Batch Body",
  deviceKeys: ["key1", "key2"],
});
```

### 8.3 加密推送

```ts
import { BarkClient } from "@ssolstice/bark-sdk";

const client = new BarkClient({ deviceKey: "your_key" });

await client.encryptedPush({
  deviceKey: "your_key",
  payload: {
    body: "Encrypted message",
    sound: "birdsong",
  },
  encryption: {
    algorithm: "aes-128-cbc",
    key: "1234567890123456",
    iv: "1111111111111111",
  },
});
```

### 8.4 更新与删除通知

```ts
await client.updateNotification("notice-id", {
  title: "Update",
  body: "Updated content",
});

await client.deleteNotification("notice-id");
```

### 8.5 健康检查

```ts
const ok = await client.ping();
```

## 9. 响应格式

### 9.1 成功响应

```ts
interface SuccessResponse {
  code: 200;
  message: string;
  timestamp?: number;
}
```

### 9.2 错误响应

```ts
interface ErrorResponse {
  code: 400 | 404 | 500;
  message: string;
  timestamp?: number;
}
```

## 10. 错误处理

### 10.1 HTTP 状态码

- `200` 请求成功
- `400` 参数格式错误或缺少必需参数
- `404` URL 路径不匹配或参数未正确编码
- `500` 服务器内部错误

### 10.2 SDK 错误

SDK 会抛出 `BarkClientError`，并携带错误码：

- `E_MISSING_DEVICE_KEY` 缺少 `deviceKey`
- `E_MISSING_DEVICE_KEYS` 缺少 `deviceKeys`
- `E_FETCH_UNAVAILABLE` 当前运行环境无 Fetch API
- `E_ENCRYPTION_UNAVAILABLE` 无 Web Crypto API
- `E_ENCRYPTION_INVALID_KEY` 加密密钥长度不匹配
- `E_ENCRYPTION_INVALID_IV` iv 长度不正确
- `E_API_ERROR` 服务器响应错误或非 200 code

## 11. 限制与配额

- 有效请求（HTTP 200）不限速
- 错误请求（400/404/500）：5 分钟内超过 1000 次将封禁 24 小时
- QPS 建议：
  - <= 200：可使用官方服务
  - > 200：建议自部署
  - > 3000：建议自部署并优化配置

## 12. URL 编码注意事项

手动构造 URL 时必须进行 URL 编码：

- 正确：`https://api.day.app/key/a%2Fb%2Fc%2F`
- 错误：`https://api.day.app/key/a/b/c/`（会导致 404）

## 13. 加密推送流程

1. 在 Bark APP 中设置加密密钥和算法
2. 将推送参数转换为 JSON 字符串
3. 使用密钥和算法加密
4. 将密文作为 `ciphertext` 发送

SDK 提供 `encryptPayload` 方法用于生成密文，需保证运行环境支持 Web Crypto API。

## 14. 质量保证与工程化

- `oxlint`：静态检查
- `oxfmt`：代码格式化
- `husky`：提交前自动执行 `pnpm lint` 与 `pnpm format`

## 15. CI/CD 建议

推荐使用 GitHub Actions 实现 CI：

- 安装依赖（pnpm）
- 运行 `pnpm lint`
- 运行 `pnpm build`

## 16. npm 发布流程

1. 登录 npm 账号：

```bash
pnpm login
```

2. 更新版本号（示例为 patch）：

```bash
pnpm version patch
```

3. 发布（作用域包需要 `--access public`）：

```bash
pnpm publish --access public
```
