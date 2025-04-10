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

// Make functions available globally for Google Apps Script
global.doGet = doGet;
global.doPost = doPost;
