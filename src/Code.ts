/**
 * BOTのユーザーID - LINE Developers ConsoleのYour user IDから取得
 * スクリプトプロパティから取得するように改善
 */
const BOT_USER_ID = PropertiesService.getScriptProperties().getProperty('LINE_BOT_USER_ID') || 'UDEADBEEFDEADBEEFDEADBEEFDEADBEEF';

// LINE Messaging API関連の型定義
interface LineWebhookEvent {
  type: string;
  message?: LineMessage;
  replyToken?: string;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
}

interface LineMessage {
  type: string;
  id: string;
  text?: string;
  mention?: {
    mentionees?: Array<{
      index: number;
      length: number;
      userId?: string;
    }>;
  };
}

interface LineWebhookRequest {
  destination: string;
  events: LineWebhookEvent[];
}

interface LineReplyMessage {
  type: string;
  text?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
  // 他のメッセージタイプのプロパティも必要に応じて追加
}

interface LineReplyRequest {
  replyToken: string;
  messages: LineReplyMessage[];
}

/**
 * メッセージにBOTへのメンションが含まれているかチェックする
 * @param message - LINEのメッセージオブジェクト
 * @returns メンションが含まれているかどうか
 */
function checkIfBotIsMentioned(message: LineMessage): boolean {
  // 1. mentionオブジェクトを使ったチェック（新しいLINE API形式）
  if (message.mention && message.mention.mentionees) {
    for (const mentionee of message.mention.mentionees) {
      if (mentionee.userId === BOT_USER_ID) {
        return true;
      }
    }
  }

  // 2. テキスト内の@メンションを使ったチェック（古い形式やユーザー入力用）
  if (message.text) {
    // @ボット名 または 特定のキーワードでの呼びかけ
    const botNames = ['@linebot', '@line-bot', '@bot', '@ボット'];
    for (const name of botNames) {
      if (message.text.toLowerCase().includes(name.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * メッセージからメンション部分を取り除いたテキストを返す
 * @param text - メッセージテキスト
 * @returns メンション部分を除いたテキスト
 */
function removeAllMentions(text: string): string {
  // 一般的なLINEでのメンション形式 "@名前 "を削除
  const mentionRegex = /\s*@\S+\s*/g;
  return text.replace(mentionRegex, ' ').trim();
}

/**
 * doGet - Handle GET requests
 * @param e - Event object from Google Apps Script
 * @returns {GoogleAppsScript.Content.TextOutput} Response with Hello World text
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput('LINE Bot is running!');
}

/**
 * doPost - Handle POST requests from LINE platform
 * @param e - Event object from Google Apps Script
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  // リクエストデータの詳細をログに記録
  console.log('Received webhook data:', JSON.stringify(e.postData));
  
  // すべてのケースで200 OKを返す（空のreturnで302を防ぐ）
  
  // リクエストデータがない場合
  if (!e.postData) {
    console.log('No post data');
    return;
  }

  try {
    // LINE Webhookからのリクエストをパース
    const requestData: LineWebhookRequest = JSON.parse(e.postData.contents);
    
    // パースしたデータをログに記録
    console.log('Parsed webhook data:', JSON.stringify(requestData));
    
    // イベントがない場合は終了（LINEの接続確認など）
    if (!requestData.events || requestData.events.length === 0) {
      console.log('No events in request');
      return;
    }

    // 各イベントを処理
    for (const event of requestData.events) {
      // メッセージイベントのみ処理
      if (event.type === 'message' && event.message && event.replyToken) {
        // テキストメッセージのみ応答
        if (event.message.type === 'text' && event.message.text) {
          // メンションが含まれているかチェック
          const isMentionedToBot = checkIfBotIsMentioned(event.message);
          
          if (isMentionedToBot) {
            // メンションされた場合のみ返信
            console.log(`Bot was mentioned in message: ${event.message.text}`);
            
            // メンション部分を除いたテキストを抽出
            const cleanedText = removeAllMentions(event.message.text);
            
            // 受信したテキスト（メンション部分を除く）をそのまま返信
            console.log(`Sending reply for message: ${cleanedText} with token: ${event.replyToken}`);
            replyMessage(event.replyToken, [{
              type: 'text',
              text: cleanedText.trim() || 'どうしましたか？' // 空文字列の場合のデフォルトメッセージ
            }]);
          } else {
            console.log(`Bot was not mentioned in message, ignoring: ${event.message.text}`);
          }
        }
      }
    }
    
    // 正常終了
    
  } catch (error: any) {
    // エラーが発生した場合はログに記録
    console.error('Error processing request:', error);
  }
}

/**
 * LINE Messaging APIを使ってメッセージを返信する
 * @param replyToken - 返信用トークン
 * @param messages - 送信するメッセージの配列
 */
function replyMessage(replyToken: string, messages: LineReplyMessage[]): void {
  // チャンネルアクセストークンをプロジェクトプロパティから取得
  const channelAccessToken = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  
  console.log(`Channel access token available: ${channelAccessToken ? 'Yes' : 'No'}`);
  
  if (!channelAccessToken) {
    console.error('Channel access token is not set in project properties');
    return;
  }
  
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload: LineReplyRequest = {
    replyToken: replyToken,
    messages: messages
  };
  
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${channelAccessToken}`
    },
    payload: JSON.stringify(payload)
  };
  
  // ペイロードとオプションをログに記録
  console.log('Reply payload:', JSON.stringify(payload));
  console.log('Reply options:', JSON.stringify({
    method: options.method,
    contentType: options.contentType,
    headers: { Authorization: 'Bearer ***' } // トークンを隠す
  }));
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log(`Reply API response: code=${responseCode}, body=${responseText}`);
    
    if (responseCode < 200 || responseCode >= 300) {
      console.error(`Error sending reply: ${responseText}`);
    }
  } catch (error: any) {
    console.error('Error sending reply:', error);
  }
}
