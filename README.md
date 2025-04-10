# My LINE Bot

LINE BOT for my family

## 概要

Google Apps Script を利用した LINE Bot です。家族向けの便利な機能を提供します。

## 技術スタック

- Node.js (TypeScript)
- Google Apps Script
- clasp (Google Apps Script CLI)

## セットアップ

1. 依存関係のインストール

```bash
npm install
```

2. claspでログイン

```bash
npm run login
```

3. Google Apps Scriptプロジェクトの作成

```bash
npm run create
```

4. 開発用デプロイ

```bash
npm run deploy:dev
```

5. 本番用デプロイ

```bash
npm run deploy:prod
```

## ローカル開発

ファイルの変更を監視する：

```bash
npm run watch
```

## デプロイ後の設定

1. Google Apps Scriptのデプロイ後に表示されるURLをコピー
2. LINE Developers ConsoleでWebhook URLとして設定

## ライセンス

ISC
