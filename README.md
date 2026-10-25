# dsh-plugin-guide-zh

给 **DeepSeek Harness** 用的中文说明插件：把插件列表和技能（skills）翻译成中文，并在输入框旁边放一个可以直接使用的技能入口。

> 界面里那一堆 `dsh-plugin-xxx`、`Use when writing or changing a model-facing tool definition…` 看不懂？装这个。

## 功能

- **中文说明页**：设置 → 插件 →「中文说明」标签，列出所有已装插件与技能的中文名、作用，以及「在哪看」。
- **技能按钮**：输入框左下角的「技能」，点开是中文浮层；点「使用这个技能」会把 `/技能名 ` 追加到你正在写的草稿里（不动已有内容）。
- **自动翻译**：没有内置中文词条的条目，交给当前默认模型翻译一次，写进本地缓存，之后 0 秒返回；新装的插件/技能下次打开即同步。
- **只读**：不会启用、停用、卸载任何插件；唯一的写操作是把你点的技能追加进输入框。

## 安装

从 GitHub 装（不需要 npm 发布）：

```bash
dsh plugin add github:xiaoxiangzima/dsh-plugin-guide-zh
```

npm 发布后（等价）：

```bash
dsh plugin add dsh-plugin-guide-zh
```

或在界面里：设置 → 插件 →「已装管理」→ 安装上面的 spec，然后刷新页面。

## 使用

| 位置 | 作用 |
| --- | --- |
| 设置 → 插件 →「中文说明」 | 插件 + 技能的中文清单，可搜索、可刷新 |
| 输入框左下「技能」 | 中文浮层，点「使用这个技能」插入 `/名字` |

## 数据与隐私

- 翻译时，会把**插件/技能的名称和描述**发送给你自己配置的模型；不发送会话内容、不发送文件内容。
- 译文缓存在插件目录的 `.zh-cache.json`，删掉它 + 刷新会重新翻译。
- 插件本身不联网收集任何数据。

## 已知限制

- 输入框里按 `/` 弹出的那个菜单**仍然是英文**：它的文案来自每个技能自己的 `SKILL.md`（随 Harness 版本发布、只读，模型也读同一段）。第三方插件无法逐行替换它，只能整页接管，风险过高，所以本插件提供等价的中文入口而不是改写它。
- 一次最多补翻 30 条；一次装 40+ 个插件时，剩下的会在下次打开时继续。

## 兼容性

- DeepSeek Harness `>=0.2.1-rc.3 <0.3.0`（Web / 桌面 profile）
- Node.js `>=20`

## English

A Chinese guide for the DeepSeek Harness plugin list: explains every installed plugin and skill in Chinese, adds a 「技能」button next to the composer that inserts `/skill-name`, and machine-translates anything without a hand-written entry (cached locally). Read-only apart from appending the chosen skill to your draft.

## License

MIT
