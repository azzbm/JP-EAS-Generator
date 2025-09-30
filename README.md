# JP-EAS-Generator

> 日本「緊急警報信号」（Emergency Alert Signal, EAS）音频生成工具

---
> [!CAUTION]
> **请勿在公共场合播放此项目生成的任何音频！**

> [!WARNING]
> **本工具处于开发阶段，API 参数可能随时调整**
---

## 项目简介

JP-EAS-Generator 支持快速生成日本 EAS（緊急警報信号）标准格式的音频文件，适用于测试、研究和自动化脚本。

---

## 功能

- 🛠️ 提供API，一键生成日本 EAS 信号音频
- 📁 示例脚本位于 `./examples` 目录，方便快速上手
- ⚡ 近纯净 FSK 信号生成，减少大量杂音

---

## 安装与使用

### 通过 npm 安装

```bash
npm install jp-eas-generator
```

引用方式：（文档完善前，使用方法请参考示例脚本或源码）

```javascript
const { encode, decode } = require('jp-eas-generator');
// ...
```

---

### 源码安装（开发/调试）

1. 克隆仓库并安装依赖

   ```bash
   git clone https://github.com/azzbm/JP-EAS-Generator.git
   cd JP-EAS-Generator
   npm install
   ```
2. 运行示例脚本生成音频

   ```bash
   node ./examples/make_EAS_II_2024-Noto-tsunami.js
   ```

   生成的音频文件位于 `./examples/output` 目录。
3. 使用 API 生成音频（文档完善前，使用方法请参考示例脚本或源码）

   ```javascript
   const { encode, decode } = require("./src");
   // ...
   ```

### 依赖环境
- Node.js >= 14（建议>=20）

---

## 注意事项

- 生成的音频仅供测试和研究，不适用于实际广播，请勿在公共场合播放，使用此项目产生的任何后果与作者无关。

---
## 参考资料

- [無線設備規則第九条の三第五号の規定に基づく緊急警報信号の構成](https://www.tele.soumu.go.jp/horei/law_honbun/72103000.html#joubun-toc-span)
- [《緊急警報放送》](https://www.ite.or.jp/contents/keywords/FILE-20111231153726.pdf)
- [緊急警報放送 - Wikipedia](https://ja.wikipedia.org/wiki/%E7%B7%8A%E6%80%A5%E8%AD%A6%E5%A0%B1%E6%94%BE%E9%80%81)
- [緊急警報放送とはどのようなものか。受信する方法を知りたい | NHK よくある質問集（FAQ)](https://www.nhk.or.jp/faq-corner/3tr_jushin/01/03-01-15.html)

---

## 许可证 License

本项目基于 MIT License 开源。