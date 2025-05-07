// This code should be deployed as a Google Apps Script Web App
// It will receive tracking events and append them to the "export" sheet

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents)
    const events = data.events

    if (!events || !Array.isArray(events) || events.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: "No valid events provided",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    // Open the spreadsheet and get the export sheet
    const spreadsheetId = "1B0435uEbQa0LENR__kj_oE5aSwty6QDAxiCE7TI5Eoc" // Replace with your actual spreadsheet ID
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    const sheet = spreadsheet.getSheetByName("export")

    if (!sheet) {
      // Create the export sheet if it doesn't exist
      const newSheet = spreadsheet.insertSheet("export")
      newSheet.appendRow(["event", "userId", "postId", "postOwner", "timestamp", "duration", "value", "processedAt"])
      const sheet = newSheet
    }

    // Process each event and append to the sheet
    const rows = events.map((event) => {
      return [
        event.event,
        event.userId,
        event.postId,
        event.postOwner,
        new Date(event.timestamp), // Convert timestamp to date
        event.duration || "",
        JSON.stringify(event.value || ""),
        new Date(), // Add processing timestamp
      ]
    })

    // Append all rows at once for better performance
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows)

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${events.length} events`,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Error: " + error.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet() {
  // Simple response for GET requests
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: "The tracking API is running. Please use POST to submit events.",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}
