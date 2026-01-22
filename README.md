# @ssolstice/bark-sdk

基于 TypeScript 的 Bark API SDK，用于发送 iOS 推送通知。

## 安装

```bash
pnpm add @ssolstice/bark-sdk
```

## 快速开始

```ts
import { BarkClient } from "@ssolstice/bark-sdk";

const client = new BarkClient({
  deviceKey: "YOUR_DEVICE_KEY",
});

await client.push({
  title: "Hello",
  body: "Bark from SDK",
  group: "demo",
});
```

更多细节请阅读 `docs/TECHNICAL_DOC.md`。
