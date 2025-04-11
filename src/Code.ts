/**
 * Google Apps Script entry point for HTTP requests
 */

/**
 * doGet - Handle GET requests
 * @param e - Event object from Google Apps Script
 * @returns {GoogleAppsScript.Content.TextOutput} Response with Hello World text
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput('Hello World');
}

/**
 * doPost - Handle POST requests
 * @param e - Event object from Google Apps Script
 * @returns {GoogleAppsScript.Content.TextOutput} Response with Hello World text
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput('Hello World');
}

// Note: In Google Apps Script, functions defined at the top level
// are automatically exposed globally. No need to explicitly assign them.
