# 机器人用到的 API

## 概述

Matataki.io 为 Matataki Bot 提供了几个 API 用于机器人基于 Matataki 饭票的群管功能

大部分 API 都以 `_internal_bot/` 为开头 prefix


## 查询所有的粉丝币

*GET* `_internal_bot/minetokens`
- 需要权限：请求 `headers` 需要带有专用的 `x-access-token`
- 结果：
结果
```json
{
    "code": 0,
    "message": "成功",
    "data": [
        {
            "id": 14,
            "uid": 1046,
            "name": "小田的空气币",
            "symbol": "XTB",
            "decimals": 4,
            "total_supply": 1000000000000,
            "create_time": "2019-09-27T13:49:56.000Z",
            "status": 1,
            "logo": "/image/2019/10/25/f905fe7c16d40c21668aef5d7b3c4dc0.png",
            "brief": "空气币",
            "introduction": "...",
            "contract_address": "0x7418f57C6659Ae60588F228c436283B7c25992E8"
        },
        // ......省略......
        {
            "id": 15,
            "uid": 1048,
            "name": "chen token",
            "symbol": "CHT",
            "decimals": 4,
            "total_supply": 10000000000,
            "create_time": "2019-09-27T13:54:47.000Z",
            "status": 1,
            "logo": "/avatar.png",
            "brief": "我是一个金币",
            "introduction": "我是一个金币，买到就是赚到！",
            "contract_address": "0x2013a0378ECE28039142adce3973c8402427F6D3"
        }
    ]
}
```




## 查询某人的饭票余额
*GET* `_internal_bot/minetoken/:uId/:symbol/balance`
- URL 参数: 
    - `uId`: Matataki 的 用户ID
    - `symbol`: Matataki 的 Token 符号
- 需要权限：请求 `headers` 需要带有专用的 `x-access-token`
- 结果：
在测试网时
    - `uId` 为 1001
    - `symbol`: 为 DAO

结果
```json
{
    "code": 0,
    "message": "成功",
    "data": {
        "balance": 2090000,
        "decimals": 4
    }
}
```


## （面向机器人的）转账指令
*POST* `_internal_bot/minetoken/:token_id/transferFrom`
- 需要权限：请求 `headers` 需要带有 **特殊专用与转账等敏感权限** 的 `x-access-token`
- URL 参数: `token_id`: Matataki 的 Token ID
- request body 参数有: 
```json
{
	"from": "1247", // 发送者的 Matataki UID
	"to": "1109", // 接收者的 Matataki UID
	"value": "1000" // 带有decimal的金额
}
```
- 结果：
```json
{
    "code": 0, // 0 为成功 1 为失败
    "message": "成功"
}
```