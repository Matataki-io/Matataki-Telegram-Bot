---
title: 指南
---
# Matataki Bot - Telegram 群管机器人🤖️

## Matataki Bot 是什么

Matataki Bot 是为 Telegram 和 Token 而生的群管机器人的功能。

与其它群管机器人不同的是，Matataki Bot 为 Token 而生，致力于用 Token 打造你的 Telegream 私密圈子，即**Token 是在群的通证**。

## 技术细节

为了机器人工作稳定，提升~~降低~~开发和 Debug 效率，我们使用 TypeScript 开发并尽可能开启**最严格语法检查**。

为了简化开发工作，我们使用了 Telegraf 框架了处理机器人接受的请求。

为了架构的清晰，我们使用了 [Inversify IoC](http://inversify.io/) 框架做依赖注入实现对象之间的解耦，也仿照一些 MVC 框架的路由设计来处理机器人命令。

因为用了 web3，涉及到 node-gyp, 如果安装依赖出现了错误，建议检查 node 版本，我们开发团队目前用的是 Node v12.13.0


## 开发模块
- [x] 群管理模块
    - [x] 邀请入群
    - [x] 按条件踢人
- [ ] 与以太坊沟通的 Web3 模块
    - [ ] 查询Token相关信息
    - [ ] 绑定用户以太坊钱包 (以太坊钱包 对应用户的 Telegram 帐户)



## 相关链接
- [项目 Repo](https://andoromeda.coding.net/p/MatatakiBot/d/TokenBot/git)
- [Telegraf 框架文档](https://telegraf.js.org/)
- [史诗任务和需求拆分](https://andoromeda.coding.net/p/smart-signature-future/epics/issues/2608?filter=f82e70d63e9c9662a8b5056ba36466de)


### 要点
- Matataki 的兄弟产品，为饭票的社群提供了新的方向。
- 以 Token 发行者为中心，**不与 Matataki 产品本身产生强关联强耦合** （应可以脱离 Matataki 独立运行）
- 目前仅支持以太坊，后续应该兼容 EOS 、TRON 等其他区块链
- 应该是做成一个 Service
- BaaS（Bot as a service)？Docker 化？Serverless 化？

### 情景描述

Alice 是一个网红，创建了自己的 Fan票 ACC（AliceCoin）, 她想用这个币来打造一个她和金主的私密圈子。Alice 想要规定只有持有 100 个 ACC 才有入群资格。Alice 要做到这一点，她需要：
- AliceCoin 代币合约（如果她不会发，那来瞬发币）
- 一个 Telegram 群组
- 粉丝小助手（Telegram 机器人）

Alice 首先在 瞬 Matataki 中绑定了自己的 Telegram 账号，然后在 Telegram 中新建了一个名字叫做 “Alice粉丝群” 的群组并邀请了“粉丝小助手”（Telegram 机器人）进群。

Alice通过与粉丝小助手私聊查询到了自己刚才建立的 “Alice 粉丝群” ，通过对话她选择为这个群组创建了一条规则：“只有持有 100 个或更多 ACC 的人才有资格进入群内”。设定完毕之后，在 AliceCoin 的详情页中即可看到这个群组的加群入口，金主们看到这条消息和加群规则后后纷纷都去购买 AliceCoin入群了。

但是 Alice 的人气逐渐变的低迷，有些群内的粉丝们准备脱粉了，于是他们卖掉了自己持有的 ACC 。群里的粉丝小助手自动检测到了这个状况，并自动将这些用户踢出了群组。

> 岛娘案：目前国内社区所有的流量几乎都在微信 Group 里聚集，但是微信最大的问题就是她几乎无法进行任何有效的管理、沉淀和群租间的连接。以管理举例，踢人这个动作是个不得不周期性进行，但是大多数管理员不愿意面对（以免得罪人）的事情，结果导致 Group 陷入沉寂的怪圈，最终导向分叉。

## 技术方向和选型
### TelegramBot 与 Matataki 的关系

这个机器人应该**与 Matataki饭票 独立开来**，但允许相互之间的互利推广及其优惠政策（类似于淘宝与支付宝的关系）

Matataki饭票负责给这个机器人产品导流，快速获得瞬的流量，使得产品有人在用。

而机器人本身，可以为不了解瞬、不了解区块链的用户，提供一个快速发币的通道（又引流回到了Matataki）

这个机器人应该有对基于 ERC20 token 的泛用性（如PDD等其他电商也可以用支付宝付款一样）

Matataki的饭票之所以可以用，是因为它是ERC20 Token，所以才可以用


### 技术细节

为了机器人工作稳定，提升~~降低~~开发和 Debug 效率，我们使用 TypeScript 开发并尽可能开启**最严格语法检查**。

为了简化开发工作，我们使用了 Telegraf 框架了处理机器人接受的请求。

为了架构的清晰，我们使用了 [Inversify IoC](http://inversify.io/) 框架做依赖注入实现对象之间的解耦，也仿照一些 MVC 框架的路由设计来处理机器人命令。

因为用了 web3，涉及到 node-gyp, 如果安装依赖出现了错误，建议检查 node 版本，我用的是 Node v12.13.0


### 开发模块
- [x] 群管理模块 (High priority)
    - [x] 邀请入群
    - [x] 按条件踢人
- [ ] 与以太坊沟通的 Web3 模块
    - [ ] 查询Token相关信息
    - [ ] 绑定用户以太坊钱包 (以太坊钱包 对应用户的 Telegram 帐户)

## 规则和操作流程
### 基本规则
1. Fan票的创始人可以利用 粉丝小助手（Telegram 机器人），为自己的Fan票创建多个具有准入门槛和自动踢群功能的Fan票粉丝群，只有符合规则的粉丝可以加入其中
3. 创建群组的Fan票创始人不会受群规则限制而导致被踢群

### 操作总流程
- 【创建者建群】-->
    - 1.绑定Telegram账号-->
    - 2.创建Telegram群组并引入瞬Bot-->
    - 3.设置群规则-->
    - 4.自动同步入群规则到Fan票后台-->
    - 5.在Fan票后台开关前端加群入口

- 【用户加群】-->
    - 1.绑定Telegram账号-->
    - 2.点击Fan票前台的加群入口-->
    - 3.与瞬Bot对话后进入准入的群组

- 【群机器人建群】-->
    - 1.获取群主的Fan票信息并判断是否可以建群-->
    - 2.引导群主输入群规则信息-->
    - 3.确认群规则并同步至瞬matataki-->
    - 4.判断入群者是否符合入群规则

### 建群操作细流程
👉**我应该如何建立Fan票群？**
❗此功能仅向已经发行过Fan票的用户开放，其他用户暂不支持建立Fan票群
❗如果希望发行Fan票，请先填写并提交[表单](https://wj.qq.com/s2/5208015/8e5d/)

操作步骤：
1️⃣ 在瞬matataki上登录后绑定Telegram账号
2️⃣ 在Telegram中搜索瞬 Matataki.io 机器人并添加为好友
3️⃣ 在Telegram中新建一个Group，并将瞬 Matataki.io 机器人邀请入群
4️⃣ 在群组中将瞬 Matataki.io 机器人设置为群管理员（操作此步骤之后群组将会自动升级为超级群）
5️⃣ 与瞬 Matataki.io 机器人私聊，输入 /mygroups 查询自己创建的群组并记录下刚才群组的ID信息
6️⃣ 与瞬 Matataki.io 机器人私聊，输入 /set [群组ID] [参数]即可设置群规则（参数代表至少持有您的Fan票数量）

👨‍👩‍👦‍👦完成以上6步操作即可完成Fan票群建立,已经建立过的Fan票群组将会显示在Fan票的详情页中
如有其他问题请在瞬Matataki的[官方Telegram群](https://t.me/smartsignature_io)询问

## 功能清单

### 机器人功能和逻辑（已完成）-p0

#### 面向群创建者的功能（私聊）
- 输入指令 获取建群帮助
- 输入指令 查询建立Fan票群资格
- 输入指令 设置群规则（判定）-p0
    - 持币量 >= 设定值（-1~∞）
    &/or
    - 持流动金量 >= 设定值（-1~∞）
- 输入指令 开启或关闭用户查询功能-p1
- 输入指令 获取用户反馈-p2
- 输入指令 获取一段时间内的群状态报表-p2
    - 人数增减情况
    - 主动退群和被动踢群的数量
    - …

![](https://i.imgur.com/N1RtKJJ.png)


#### 面向用户的功能（群内）（未完成）
- [ ] - 输入指令 查询当前群规则 -p0
- [ ] - 输入指令 查询自己当前拥有的当前群对应的Fan票数量
- [ ] - 输入指令 查询Fan票的当前数据（群主可开关）-p1
- [ ] - 输入指令 查询个人持Fan票情况（群主可开关）-p1

#### 面向用户的功能（私聊）（基本完成）
- [ ] - 输入指令 查询当前状态
    - [x] - 是否绑定matataki
    - [x] - 用户名和主页链接
    - [x] - Fan票名和主页链接
    - [x] - 已加入的群列表和超链接
    - [x] - 已创建的群列表和超链接
        - [ ] - 入群具体的规则
    - [ ] - 当前持有Fan票情况

#### 自动化功能（基本完成）
- [x] - 验证设置人是否为Fan票的发布者-p0
- [x] - 获取设置人的Fan票Symbol-p0
- [x] - 当条件不满足时自动踢群-p0
- [x] - 检测当前准备加入xx群的用户是否符合入群条件并给出对应的反馈-p0
- [ ] - 当用户被机器人踢出Fan票群后，自动私聊用户发送被踢群的消息提示-p0
- [x] - 当用户主动退出Fan票群后，自动同步群数据给瞬matataki-p0
- [ ] - 当建群完成后，群规则的设置信息会自动同步到对应的Fan票设置后台-p1
- [x] - 当用户在瞬matataki每操作一笔交易后，系统均会去自动检测一次当前用户是否还满足所加入的群组规则，如果不满足则发送消息给粉丝小助手-p1
- [ ] - ==当创建者在瞬matataki后台修改群规则后，等待10分钟后==，粉丝小助手会自动同步当前设置并遍历所有群员检测是否符合规则，踢出不合规的用户-p1（depends on Fan票后台功能）
- [ ] - 当用户主动退出Fan票群后，瞬Bot私聊用户询问群体验反馈和对Fan票群组功能的反馈-p2
- [x] - 当请求入群的用户之前因为被踢所以遭到禁封，机器人会自动将符合规则的用户解封后允许入群-p0

### Fan票详情页群入口功能(已完成)-P1
在没有Fan票群管理后台的情况下，默认展示所有开启的群组
- [x] 1. 点击“入群指南”可以查看弹出的帮助信息，在帮助中引导用户去绑定Telegram账号。-p1
- [x]     1.1如果已经绑定Telegram则提供用户跳转至账号管理页面功能-p2
- [x] 2. 展示当前开放的群组、群规则、群员数量-p1
- [x] 3. 自动检测是否符合入群规则，以区分显示是否可以加群的入口样式-p2
- [ ] 4. 在入群指南中可以切换Telegram和微信两种类型的指南-p2

**Fan票详情页**
![](https://i.imgur.com/fl83gMk.png)

**加群入口和功能演示**
![](https://i.imgur.com/sO73Hpr.png)


### Fan票后台群管理功能（未开始）-p2
Fan票群管理后台不是MVP的内容，但是在完善的时候需要有
- 查看群设置帮助-p0
- 查看当前已关联的群组信息：
    - 群ID-p1
    - 群名称-p1
    - 群规则信息-p1
    - 群成员数量-p1
        - 群成员表格
        - 群成员动态
- 设置群规则-p2
- 设置群简介-p1
- 设置是否在详情页展示加群入口-p2

**后台页面**
![](https://i.imgur.com/DBT9Ksc.png)


## 开发手札

### 调研笔记

* Telegram 有两类群——小群（group）和大群（supergroup），小群相对大群会缺少一些功能，以下是和 bot 相关的影响：
  * 小群**非管理员** bot 无法接受群员消息（可能包括一些群相关动态）
  * 小群无法获得群员离群消息
  * 小群里移走机器人后可能无法获知自己已被移出（API 返回自己还是属于群员）
  * 小群无法临时限制个别群员行为
* 默认（可能仅拉少于 200 人）建群得到的是小群，通过一些操作可以升级到大群。包括但不限于以下操作：
  * 公开并设置群链接
  * 赋予群员管理员权限并限制部分操作权限
  * 临时限制个别群员任意行为（非群设置）
* 对于大群，机器人踢人操作附带永久封禁操作，会使得被踢群员无法通过群邀请链接进群。因此需要先解封才能拉回（可以让机器人检查 Fan 票条件再解封[已完成]）



### 如何部署

#### Setup 前你需要?
1. 去 Telegram 找 @botfather 拿到你的 bot token
2. 准备一个 PosTelegramreSQL 数据库
3. Clone Git 仓库
4. 安装依赖包（npm install/yarn）
5. 设置环境变量
6. 设置数据库连接
7. 运行（npm/yarn start）

#### 环境变量
运行该机器人需要有以下的环境变量：
* BOT_TOKEN——最核心
参见：https://telegraf.js.org/#/?id=telegram-token
* INFURA_ID——用于访问以太坊
参见：https://infura.io/
* MATATAKI_APIURLPREFIX——用于查询和 Matataki 帐号相关的信息以及 Fan 票对应的合约地址、Matataki 帐号的钱包
* MATATAKI_ACCESS_TOKEN——访问 Matataki 后端 API 的凭证
* MATATAKI_URLPREFIX——用于访问 Matataki 页面的链接

推荐把 `.env.example` 改名为 `.env` 然后填上相关信息

##### 可选

* LOGS_DIR——日志文件的目录

#### 数据库

把 `ormconfig.js.example` 改名为 `ormconfig.js`，然后填上自己服务器具体的信息

> 注意：为了避免和源数据库和其它同数据库开发者的冲突，请**自定义自己的 schema**

设置好数据库信息后，请运行以下代码建立属于自己的数据库表

```
npm run migrations
```

具体配置项可参考[这篇文档](https://typeorm.io/#/using-ormconfig)和[这篇](https://typeorm.io/#/connection-options/posTelegramres--cockroachdb-connection-options)。

### 如何运行

以上步骤操作完成后，请通过 npm 或者 yarn 安装依赖
```bash
npm start
# or 
yarn start
```

### 异常情况
不排除用户会有各种骚操作的可能性，因此我们需要提前预想到各种可能会发生的情况。即便可能不会去改，但是也要尽力去避免这些情况发生。

1. 群主未先和机器人互动就把机器人拉进群里

2. 群主退出自己的Fan票群
    测试结果：群主退出后群内没有群主，但是再次加入之后还是群主。

3. 在已有 Fan 票群的情况下群主解绑 Matataki 帐号，并将其绑定到另一个 Matataki 帐号。
    解决思路：基于饭票的群规已经设定，群主退群也不能改变他创群的事实，所以🤖️继续沿着老规矩治理就完事了
    其它问题：

4. 在没有绑定Matataki账号的前提下，在自己的群组中拉入机器人
    解决思路：机器人会自动退出

5. private群的邀请链接有时效性
    解决思路：所以或许我们需要在邀请消息里提醒用户有有效期）/ 或者由机器人定期更换邀请地址

6. 不翻墙的话在Matataki无法获得群信息
7. 如果有用户将机器人拉入群中后不做其他处理，所有人在使用/join和/status指令的时候都会出现400错误
8. 目前Fan票群助手只要入群，就会将当前的群作为Fan票群处理并显示在Matataki上，但是这可能只是我不小心的误操作。这导致我如果作为群主我退群了，这个Telegram群根据Telegram的规则依然会存在，那么就会导致在Matataki上存在这个群的信息，但是群主无法入群对群进行管理了。
    解决思路：
    - [x] 1. 首先如果要激活一个群成为Fan票群，一定需要作者进行启动操作，比如作者只有给群设置过群规则之后群才可以生效（哪怕将规则设置为0），只有生效的群才可以被显示在Matataki里。
    - [x] 2. 其次如果群主从一个已经激活的Fan票粉丝群中退出了，那么在Matataki里就不应该再显示这个群组的先关信息，视作群主自己主动放弃了此群。
    - [x] 3. 如果群主还在群中，但是将机器人是踢出了群组，那么该群也会立即解除Fan票粉丝群激活，变成普通Telegram群。
    - [ ] 4. 如果群主还在群中，但是取消了机器人的管理员权限，那么该群也会立即解除Fan票粉丝群激活，变成普通Telegram群。此时如果想要设置群规则，机器人会提示“请先将机器人添加为管理员并开启邀请权限”
    - [ ] 5. 如果群主退出已经激活的群后，再次又返回了群中，此时如果机器人还在群内，即可以立即让此群生效。

10. 即便是在Telegram的上的/status
### 其它问题
大家在群内都可以与机器人交互，并且信息是对所有群员公开的


### 标准设定

#### 用户的3个级别
未绑定Matataki账号的Telegram用户
已绑定Matataki账号的Telegram用户
已绑定Matataki账号且符合入群规则的Telegram用户

#### 群员的4个身份
创始人-创建粉丝群的群主
联合创始人-在机器人入群之前就已经在群内的成员
管理员-由群主指派的管理人员，不受机器人控制
普通成员-符合入群条件并正常入群的成员
关系户-不符合入群条件但是由群主拉入的（目前已禁止此身份存在）

创始人和联合创始人都不受机器人管理员的管束
除了创始人和管理员其它所有群员都受普通管理员的管束（创始人可以手动设置管理员的权限）


----
# 阶段二
[一期发布说明](https://www.matataki.io/p/1638)
[一期优化任务](https://andoromeda.coding.net/p/smart-signature-future/iterations/2818/issues/2792)

## 优化任务

### 标准回复文案

PS: Telegram Bot 所用的 MD 语法有[少许区别](https://core.telegram.org/bots/api#markdownv2-style)（不是客户端文本框输入的那种语法）

#### 用到的文本占位符：

* username：机器人 id（不带 @）
* username_escaped：机器人 id（不带 @），但`_`会替换成`\_`以避免被当作斜体文本的划分符号
* url_prefix：Matataki 页面 URL 前缀 

**/start 信息**

```
感谢您使用 Matataki 粉丝群助手，输入 /help 查看更多功能列表
👉🏻[介绍文档](https://www.matataki.io/p/1638)
```

**/help 信息**

先发送目录
```
您想了解什么？
👉*你是谁*
👉*Fan票粉丝群是什么*
👉*操作指令说明*
👉*如何加入Fan票群*
👉*如何创建Fan票群*
👉*如何删除Fan票群*
👉*视频教程(更新中)*
👉*我有别的问题*

```

然后根据用户点击返回结果
```
👉*你是谁*

我是Fan票粉丝群助手，您也可以叫我小Fan~
我会帮助您创建或加入Fan票粉丝群
有什么不明白的问题就请输入/help查看帮助吧
如有其他问题请在 瞬Matataki 的[官方 Telegram 群](https://t.me/smartsignature_io)询问

================

👉*Fan票粉丝群是什么*

是以持有特定Fan票数量为判断依据，并且自动审核入群+自动踢群的telegram群组。
想要了解更多信息请阅读[介绍文档](https://www.matataki.io/p/1638)

================


👉*操作指令说明*

您在与 Matataki 粉丝群助手对话时可以使用以下指令
您也可以点击输入框边的"/"按钮查看全部指令

/start： 开始引导
/help： 查看帮助
/status： 查询您的所有状态信息（创建的 Fan票、创建的群组、已加入的群组）
/join：查询您还未加入的Fan票群信息
/mygroups： 查询您建立的 Fan票 粉丝群组信息（群 ID、群名称、Fan票 名、群规则）
/set： 设置群规则，输入 `/set [群组ID] [参数]` 即可设置群规则（参数代表至少持有您的Fan票数量），例如 `/set -1234565 100` 就是设置 123456 这个群的入群条件为 ≥100
/rule：查询当前群组的群规则

[如何调戏Fan票粉丝群助手视频教程](https://www.bilibili.com/video/av82477411)

================

👉*如何加入Fan票群*

您可以在Fan票的详情中查看到全部群组的加群入口。

具体的操作方式为：
1️⃣ 进入Fan票页面：https://www.matataki.io/token
2️⃣ 进入其中一个Fan票的详情页
3️⃣ 查看侧边栏中有没有显示群组信息。如果有群组请根据引导提示操作入群。

你也可以与我对话输入/join，即可看到全部可以加入的群组

[视频教程](https://www.bilibili.com/video/av82487218)

================

👉*如何创建Fan票群*

❗此功能仅向已经发行过 Fan票 的用户开放，其他用户暂不支持建立 Fan票 群
❗如果希望发行 Fan票，请先填写并提交[表单](https://wj.qq.com/s2/5208015/8e5d/)

操作步骤：
1️⃣ 在 瞬Matataki 上登录后[绑定 Telegram 账号](${url_prefix}/setting/account)
2️⃣ 在 Telegram 中搜索 @${username_escaped} 并添加为好友，或点击此[链接](https://t.me/${username}?start)
3️⃣ 在 Telegram 中新建一个 Group，并将 @${username_escaped} 邀请入群
4️⃣ 在群组中将 @${username_escaped} 设置为群管理员
5️⃣ 设置 @${username_escaped} 的管理员权限：先关闭邀请权限并保存，然后再打开邀请权限（操作此步骤之后群组将会自动升级为超级群）
6️⃣ 与 @${username_escaped} 私聊，输入 `/mygroups` 查询自己创建的群组并记录下刚才群组的 ID 信息
7️⃣ 与 @${username_escaped} 私聊，输入 `/set [群组ID] [参数]` 即可设置群规则（参数代表至少持有您的 Fan票 数量），例如 `/set 1234565 100` 就是设置 123456 这个群的入群条件为 ≥100

👨‍👩‍👦‍👦完成以上 7 步操作即可完成 Fan票 群建立
已经建立的 Fan票 群组将会显示在 Fan票 详情页中
如有其他问题请在 瞬Matataki 的[官方 Telegram 群](https://t.me/smartsignature_io)询问

[视频教程](https://www.bilibili.com/video/av82492702)

==============

👉*如何删除Fan票群*

❗Fan票群一旦删除之后将不会在Matataki中继续展示
❗在任何情况下，群主都请勿直接退群

操作步骤
1️⃣ 进入需要删除的Fan票群
2️⃣ 取消 @${username_escaped} 的管理员权限

完成上述的操作后此群会成为普通Telegram群组

[视频教程](https://www.bilibili.com/video/av82585384)

==============

👉*视频教程*

教程会跟随新功能发布会不定期更新
[如何加入Fan票粉丝群](https://www.bilibili.com/video/av82487218)
[如何创建Fan票粉丝群](https://www.bilibili.com/video/av82492702)
[如何删除Fan票粉丝群](https://www.bilibili.com/video/av82585384)
[如何调戏Fan票粉丝群助手](https://www.bilibili.com/video/av82477411)



=============

👉*我有别的问题*

如有其他问题请在 瞬Matataki 的[官方 Telegram 群](https://t.me/smartsignature_io)询问

============

```

**/status 信息**
```
瞬Matataki 昵称：林可 
Fan票 名称：LINK（林可票）

**您已建立 1 个 Fan票群**
/ 林可票友群（催更、提bug、小道消息）（LINK ≥ 20）

**您已加入 2 个 Fan票群**
/ FWC 协会 （FWC ≥ 100）
/ F50 协会（F50 ≥ 100）

输入/join 查看更多可以加入的Fan票群

```

**/join 信息**
```
**您现在还可以加入 1 个 Fan票群**
/ F50幻想世界群（F50 ≥ 200）

**您几乎快可以加入 2 个 Fan票群**
/ F50镜花水月群（F50 ≥ 250，还差20）购买
/ Link精英中的精英群（Link ≥ 200，还差52.22）购买

输入/status查看已经加入的Fan票群
```


**指令列表**
/help： 查看帮助
/start： 开始
/status： 查询您的所有状态信息
/join：查询您还未加入的Fan票群信息
/mygroups： 查询您建立的 Fan票 粉丝群组信息
/set： 设置群规则
/rule：查询当前群组的群规则
/ping：ping





## 资金操作
### 当用户在和Bot私聊时可以查询到自己全部的持币情况
当用户在Fan票粉丝群询问Bot时可以查询到自己持有当前Fan票群对应Fan票的情况

文字格式为：
>瞬Matataki 昵称：[小田大大](https://www.matataki.io//user/587)
>Fan票 名称：[Hi嗨币](https://www.matataki.io//token/18)
>
> 您当前持有 3 种Fan票
> [Hi嗨币](https://www.matataki.io//token/18)：12.45
> [LINK林可币](https://www.matataki.io//token/18)：30
> [DAO岛岛币](https://www.matataki.io//token/18)：120.3

### 用户可以通过指令给特定的群员发送Fan票 


### 用户可以通过指令让机器人在群里发送红包
需要预想好假设机器人和接口被攻击了，我们应该如何处理。
建议的安全措施有2条：1.增加支付密码设置 2.用户可以设置免密支付额度

send LINK to @guanchao71S2W



# 任何疑问？

请不要犹豫在Telegram上联系我们
[林可-产品经理](https://t.me/guanchao71) 
[神樹桜乃-攻城狮1号](https://t.me/kodamasakuno)
[Frank-攻城狮2号](https://t.me/frankwei) 

或在[官方 Telegram 群](https://t.me/smartsignature_io)询问