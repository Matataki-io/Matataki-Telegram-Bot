---
title: 机器人微服务 API
---

## 概述

Matataki Bot 提供了几个 API 用于读取饭票群的相关信息。

这部分适合针对饭票本身进行开发的开发者。

## Endpoint


🏭 生产环境：`http://fanpiao-bot-data-prod.web.app/`

🚧 测试环境：`http://fanpiao-bot-data.web.app/`

## 查询特定饭票的所有群
*GET* `/token/:tokenId`

### URL 参数

| 参数            | 类型    | 默认值            | 参数描述   |
| ---------------- | ------- | ------------------ | -------------------------------------- |
| tokenId          | `Number`  |  |  Matataki 的 饭票ID     |

### 返回参数

| 参数            | 类型    |  参数描述   |
| ---------------- | ------- | -------------------------------------- |
| status          | `Boolean`  |  该请求是否成功     |
| result     | `Array<Group>` |  群聊相关信息，只有当 `status` 为 `true` 时出现  |
| error     | `any` |  请求相关错误信息，只有当 `status` 为 `false` 时出现   |