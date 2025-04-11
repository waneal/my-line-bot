/**
 * BOTのユーザーID - LINE Developers ConsoleのYour user IDから取得
 * スクリプトプロパティから必須で設定
 */
const BOT_USER_ID = PropertiesService.getScriptProperties().getProperty('LINE_BOT_USER_ID');

/**
 * LINEチャンネルアクセストークン - LINE Developers Consoleから取得
 * スクリプトプロパティから必須で設定
 */
const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

/**
 * Claudeチャンネルアクセストークン - Anthropicから取得
 * スクリプトプロパティから必須で設定
 */
const CLAUDE_API_KEY = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');

/**
 * 使用するClaudeのモデル 
 */
const CLAUDE_MODEL = 'claude-3-haiku-20240307';

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

// Claude API関連の型定義
interface ClaudeMessage {
  role: string;
  content: string;
}

interface ClaudeRequestBody {
  model: string;
  max_tokens: number;
  system?: string;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: { type: string; text: string }[];
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
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
 * Claude APIに質問を送信し、回答を取得する
 * @param userQuery - ユーザーからの質問
 * @returns 子育てアドバイスを含むClaudeからの回答
 */
function askClaude(userQuery: string): string {
  if (!CLAUDE_API_KEY) {
    console.error('Error: CLAUDE_API_KEY is not set in project properties');
    return 'すみません、現在アドバイスを提供できません。しばらくしてからお試しください。';
  }
  
  // 保育・子育て専門家としてのプロンプト
  const systemPrompt = `あなたは保育や子育てに関する専門家です。アドラー心理学をベースとした子育てアドバイスを提供してください。
以下の原則に基づいた回答を心がけてください：

1. 子どもの自立と自己効力感を育むアドバイス
2. 勇気づけを重視し、叱責ではなく適切な指導
3. 横の関係（対等な関係）を大切にする
4. 共感と理解を示しながらも、過保護にならないバランス
5. 子どもの「目的」を理解する視点
6. 論理的帰結（自然な結果）を活用した学びの促進

回答は優しく、共感的でありながらも実践的なアドバイスを含めてください。専門用語を使う場合は、わかりやすく説明を加えてください。`;

  const url = 'https://api.anthropic.com/v1/messages';
  
  // リクエストボディを作成
  const requestBody: ClaudeRequestBody = {
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userQuery }
    ]
  };
  
  // API呼び出しのオプション
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  try {
    console.log('Calling Claude API...');
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode >= 200 && responseCode < 300) {
      const responseJson = JSON.parse(response.getContentText()) as ClaudeResponse;
      console.log('Claude API response received successfully');
      
      // 最初のコンテンツテキストを返す
      if (responseJson.content && responseJson.content.length > 0) {
        return responseJson.content[0].text;
      } else {
        return 'すみません、回答を生成できませんでした。';
      }
    } else {
      console.error(`Error from Claude API: ${response.getContentText()}`);
      return 'すみません、回答の取得中にエラーが発生しました。少し時間をおいてからお試しください。';
    }
  } catch (error: any) {
    console.error('Error calling Claude API:', error);
    return 'すみません、技術的な問題が発生しました。少し時間をおいてからお試しください。';
  }
}

/**
 * メッセージが長すぎる場合に分割する
 * @param message - 分割する元のメッセージ
 * @param maxLength - 1メッセージあたりの最大文字数
 * @returns 分割されたメッセージの配列
 */
function splitLongMessage(message: string, maxLength: number = 5000): string[] {
  const result: string[] = [];
  let remaining = message;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      result.push(remaining);
      break;
    }
    
    // できるだけ文の区切りで分割する
    let splitPoint = remaining.substring(0, maxLength).lastIndexOf('。') + 1;
    if (splitPoint <= 0) {
      // 「。」が見つからなければ、改行で分割を試みる
      splitPoint = remaining.substring(0, maxLength).lastIndexOf('\n') + 1;
    }
    if (splitPoint <= 0) {
      // 改行も見つからなければ、最大長で分割
      splitPoint = maxLength;
    }
    
    result.push(remaining.substring(0, splitPoint));
    remaining = remaining.substring(splitPoint);
  }
  
  return result;
}

/**
 * doPost - Handle POST requests from LINE platform
 * @param e - Event object from Google Apps Script
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  // リクエストデータの詳細をログに記録
  console.log('Received webhook data:', JSON.stringify(e.postData));
  
  // BOT_USER_IDが設定されているか確認
  if (!BOT_USER_ID) {
    console.error('Error: LINE_BOT_USER_ID is not set in project properties');
    return;
  }
  
  // CHANNEL_ACCESS_TOKENが設定されているか確認
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('Error: LINE_CHANNEL_ACCESS_TOKEN is not set in project properties');
    return;
  }
  
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
            
            if (cleanedText.trim().length === 0) {
              replyMessage(event.replyToken, [{
                type: 'text',
                text: 'こんにちは！子育てについて質問があればお気軽にどうぞ。'
              }]);
            } else {
              // Claudeから回答を取得
              const claudeResponse = askClaude(cleanedText);
              
              // メッセージが長い場合は分割して送信
              const messages = splitLongMessage(claudeResponse).map(text => ({
                type: 'text' as const,
                text
              }));
              
              // LINEの制限（1度に送信できるのは最大5メッセージ）に対応
              if (messages.length <= 5) {
                // replyMessageで直接全メッセージを送信
                replyMessage(event.replyToken, messages);
              } else {
                // 最初の5メッセージを送信し、残りがあることを通知
                replyMessage(event.replyToken, [
                  ...messages.slice(0, 4),
                  {
                    type: 'text',
                    text: '回答が長いため、一部のみ表示しています。詳細な回答をご希望の場合は、より具体的な質問をお願いします。'
                  }
                ]);
              }
            }
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

/**
 * LINE Messaging APIを使ってメッセージをプッシュ送信する
 * @param userId - 送信先のユーザーID
 * @param messages - 送信するメッセージの配列
 */
function sendMessage(userId: string, messages: LineReplyMessage[]): void {
  if (!userId) {
    console.error('Error: userId is required for sending messages');
    return;
  }
  
  // チャンネルアクセストークンをプロジェクトプロパティから取得
  const channelAccessToken = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  
  if (!channelAccessToken) {
    console.error('Channel access token is not set in project properties');
    return;
  }
  
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
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
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log(`Push message API response: code=${responseCode}, body=${responseText}`);
    
    if (responseCode < 200 || responseCode >= 300) {
      console.error(`Error sending push message: ${responseText}`);
    }
  } catch (error: any) {
    console.error('Error sending push message:', error);
  }
}
