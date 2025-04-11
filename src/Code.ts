/**
 * LINE Bot for my family
 * Google Apps Script entry point for HTTP requests
 */

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
 * @returns {GoogleAppsScript.Content.TextOutput} Response with status
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  // リクエストデータの詳細をログに記録
  console.log('Received webhook data:', JSON.stringify(e.postData));
  
  // 検証で200を返すための取り組み
  if (typeof e.parameter?.replyToken === 'undefined') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // リクエストデータがない場合は400エラー
  if (!e.postData) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No post data' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // LINE Webhookからのリクエストをパース
    const requestData: LineWebhookRequest = JSON.parse(e.postData.contents);
    
    // パースしたデータをログに記録
    console.log('Parsed webhook data:', JSON.stringify(requestData));
    
    // イベントがない場合は200で終了（LINEの接続確認など）
    if (!requestData.events || requestData.events.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'No events' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 各イベントを処理
    for (const event of requestData.events) {
      // メッセージイベントのみ処理
      if (event.type === 'message' && event.message && event.replyToken) {
        // テキストメッセージのみ応答
        if (event.message.type === 'text' && event.message.text) {
          // 受信したテキストをそのまま返信
          console.log(`Sending reply for message: ${event.message.text} with token: ${event.replyToken}`);
          replyMessage(event.replyToken, [{
            type: 'text',
            text: event.message.text
          }]);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error: any) {
    // エラーが発生した場合はログに記録
    console.error('Error processing request:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error?.message || 'Unknown error occurred'
    }))
      .setMimeType(ContentService.MimeType.JSON);
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
