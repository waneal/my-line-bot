# My LINE Bot

LINE BOT for my family

## 概要

Google Apps Script を利用した LINE Bot です。家族向けの便利な機能を提供します。アドラー心理学に基づいた子育てアドバイスを提供する機能を搭載しています。

## 技術スタック

- Node.js (TypeScript)
- Google Apps Script
- clasp (Google Apps Script CLI)
- Claude API (Anthropic)

## セットアップ

### 環境準備

1. 依存関係のインストール

```bash
npm install
```

2. claspでGoogleアカウントにログイン

```bash
npm run login
```

※ブラウザが開き、Googleアカウントでの認証が求められます

### Google Apps Scriptプロジェクトの作成と初期設定

3. Google Apps Scriptプロジェクトの作成

```bash
npx @google/clasp create --title 'My LINE Bot'
```

4. claspの設定ファイル（.clasp.json）を編集

```bash
# .clasp.jsonの"rootDir"を"dist"に変更
{
  "scriptId": "YOUR_SCRIPT_ID",  // 自動生成されたIDがここに入ります
  "rootDir": "dist"
}
```

5. TypeScriptのコンパイル

```bash
npm run build
```

6. 初回デプロイ

```bash
npx @google/clasp push --force
```

### ウェブアプリとしての公開（初回は手動操作が必要）

7. ブラウザでGoogle Apps Scriptエディタを開く

```bash
npx @google/clasp open
```

8. ブラウザでの操作手順：
   - 「デプロイ」ボタン > 「新しいデプロイ」を選択
   - デプロイタイプで「ウェブアプリ」を選択
   - 「次のユーザーとして実行」 > 「自分（メールアドレス）」を選択
   - 「アクセスできるユーザー」 > 「全員（匿名を含む）」を選択
   - 「デプロイ」ボタンをクリック
   - アクセス許可を求められたら「許可」をクリック
   - 生成されたウェブアプリのURLをコピー（LINE BotのWebhook URLとして使用します）

### コードの更新とデプロイ

9. コード修正後のデプロイ

```bash
# コードをビルドしてプッシュ
npm run deploy:dev

# または本番用に新しいバージョンをデプロイ
npm run deploy:prod
```

## ローカル開発

ファイルの変更を監視する：

```bash
npm run watch
```

## LINE Botの設定

1. [LINE Developers Console](https://developers.line.biz/console/)でチャネルを作成
2. 「Messaging API設定」タブでWebhook URLを設定（上記で取得したGoogle Apps ScriptのウェブアプリURL）
3. チャネルアクセストークン（長期）を発行
4. 応答設定で「webhook」をオンに設定
5. Google Apps Scriptでスクリプトプロパティの設定（**必須**）:
   - ブラウザでGoogle Apps Scriptエディタを開く (`npx @google/clasp open`)
   - 「プロジェクトの設定」 > 「スクリプトプロパティ」を選択
   - 「スクリプトプロパティを追加」をクリック
   - 以下のプロパティを設定します：
     - `LINE_CHANNEL_ACCESS_TOKEN`: LINE Developers Consoleで発行したチャネルアクセストークン
     - `LINE_BOT_USER_ID`: LINE Developers ConsoleのYour user ID
     - `CLAUDE_API_KEY`: Anthropicから取得したClaude APIキー
   - 「保存」をクリック

## Claude APIの設定

このLINE Botはアドラー心理学に基づいた子育てアドバイスを提供するため、Claude APIを使用しています。以下の手順でAPIキーを取得してください：

1. [Anthropic](https://www.anthropic.com/)のアカウントを作成
2. APIキーを取得する（[Anthropic Console](https://console.anthropic.com/)から）
3. 取得したAPIキーをGoogle Apps Scriptのスクリプトプロパティに`CLAUDE_API_KEY`として設定

## 機能

### 子育てアドバイス

このBotは、アドラー心理学に基づいた子育てアドバイスを提供します。以下の原則に基づいてアドバイスを生成します：

1. 子どもの自立と自己効力感を育むアドバイス
2. 勇気づけを重視し、叱責ではなく適切な指導
3. 横の関係（対等な関係）を大切にする
4. 共感と理解を示しながらも、過保護にならないバランス
5. 子どもの「目的」を理解する視点
6. 論理的帰結（自然な結果）を活用した学びの促進

### 使い方

LINE上でボットをメンションして質問をすると、Claude APIを通じてアドラー心理学に基づいた子育てアドバイスが返信されます。

例：
```
@ボット 子どもが宿題をやりたがらないときはどうすればいいですか？
```

## トラブルシューティング

- **「global is not defined」エラー**: Google Apps Scriptでは、関数はトップレベルで定義するだけで自動的にグローバルスコープになります。明示的な`global.function`割り当ては不要です。
- **デプロイやpushが成功しない場合**: `--force`オプションを試す（例: `npx @google/clasp push --force`）
- **アクセス権限のエラー**: Google Apps Scriptのプロジェクト設定やデプロイ設定でアクセス権限を確認してください。
- **「LINE_BOT_USER_ID is not set in project properties」エラー**: スクリプトプロパティに`LINE_BOT_USER_ID`を設定してください。
- **「CLAUDE_API_KEY is not set in project properties」エラー**: スクリプトプロパティに`CLAUDE_API_KEY`を設定してください。
- **Claude APIのレスポンスが遅い場合**: Google Apps Scriptの実行時間制限（約6分）に注意してください。非常に長い質問や複雑な質問の場合、タイムアウトする可能性があります。

## ライセンス

ISC
