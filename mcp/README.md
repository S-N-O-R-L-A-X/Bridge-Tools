# Bridge-Tools MCP server

把本 repo 的桥牌计算能力（四明手分析 DDS 引擎）暴露给任何支持 MCP 的"大模型客户端"。
模型无需自带桥牌知识 —— 回答关于某副牌"怎么打能拿几墩"时，通过工具拿到**确定性、可复现**的结果，而不是编造。

协议与模型无关：Claude Desktop / Cursor / VSCode / JetBrains / 各家 SDK 均可连接。

## 提供什么

| 工具 | 作用 |
| --- | --- |
| `analyze_double_dummy(pbn)` | 给定完整 52 张牌局（PBN），计算每一花色定约下每一家（N/S/E/W）全部明手的最佳可得墩数 —— 双明手最优解，精确而非估计。 |
| `next_plays(pbn, trump, plays)` | 首墩/某一墩的引牌分析：给定牌局+将牌+引牌方已出的牌（可空），返回该引牌方每张可能出牌的双明手得分。 |

引擎复用 web 版同一套 DDS 编译产物：`../public/out.js`（内联 wasm）+ `../public/dds.js`，在 Node 里用 `vm` 加载，不重复构建。

## 运行

```bash
# 依赖只需装一次
cd mcp
npm install

# 手动启动（stdio 模式）
node server.mjs
```

独立于 web 应用的 `npm run dev`，mcp 目录自带 `package.json`，但它依赖 `../public/out.js` 与 `../public/dds.js` 存在。

## 接入客户端

MCP 用 stdio 传输。以 Claude Desktop 为例，在客户端配置的 `mcpServers` 中加：

```json
{
  "mcpServers": {
    "bridge-tools": {
      "command": "node",
      "args": ["E:/Github/Bridge-Tools/mcp/server.mjs"]
    }
  }
}
```

其他客户端（Cursor / VSCode Copilot / JetBrains 等）的 MCP 配置写法类似，都是指向这条启动命令。重启客户端后，模型即可在对话中自动调用本工具。

## PBN 输入格式

`analyze_double_dummy` 接受标准 PBN 单副牌："座次:四家手牌"，形如

```
N:AKQJT98.AKQJ.32. 54.32.54.KQJT9 6.KQJT98.AKQJ. AKQ
```

- 首位字符（N/E/S/W）为引牌方
- 四家手牌以空格分隔，顺序 N、E、S、W
- 每手按 S.H.D.C 四门用 `.` 分隔，10 写作 `T`
- 每家必须恰好 13 张、52 张不重复，否则引擎返回 `-14` 等错误码（会被翻译成可读报错）

## 验证

服务器自检可用 MCP 协议标准握手：`initialize` → `tools/list` → `tools/call`。例如：

```json
{"name":"analyze_double_dummy","arguments":{"pbn":"N:KS..A..."}}
```

DDS 忙时单次求解在毫秒/十毫秒级；结果缓存由 `dds.js` 内部 cache 自动完成（同 PBN 只算一次）。

## TODO / 扩展思路

- [ ] `deal_hands`（按约束随机发牌，复用 `src/workers/deal.worker.ts` 逻辑）
- [ ] `suit_probability`（某分布/关键张位置的概率，复用 `src/Components/Probability/*` 的算法）
- [ ] `render_pbn`（把 PBN 渲染成 ASCII 桥牌竖排，供模型直观展示给用户）
- [ ] SSE / streamable HTTP 传输（供远程部署）