# 扫榜记录 JSON Schema

长篇和短篇扫榜都尽量向这个结构靠拢，便于后续写作 skill 读取。

```json
{
  "platform": "fanqie",
  "channel": "",
  "rankType": "",
  "rank": 1,
  "title": "",
  "author": "",
  "genre": "",
  "subGenre": "",
  "wordCount": "",
  "status": "",
  "metric": "",
  "intro": "",
  "tags": [],
  "url": "",
  "collectedAt": ""
}
```

## 输出目录

```text
扫榜结果/
├── raw/
├── reports/
└── debug/
```

## 安全要求

- 不写 token。
- debug 文件只保存页面可见文本或非敏感结构。