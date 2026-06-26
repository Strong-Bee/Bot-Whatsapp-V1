const { google } = require("googleapis");
const logger = require("../utils/logger");

class GoogleSheetsService {
  constructor() {
    this.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    this.clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.subscriptionSheet =
      process.env.GOOGLE_SHEETS_SUBSCRIPTION_SHEET || "Subscriptions";
    this.paymentSheet = process.env.GOOGLE_SHEETS_PAYMENT_SHEET || "Payments";

    this.auth = null;
    this.sheets = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!this.privateKey || !this.clientEmail || !this.spreadsheetId) {
        logger.warn(
          "⚠️ Google Sheets credentials not configured. Using local storage fallback.",
        );
        return;
      }

      const key = this.privateKey.replace(/\\n/g, "\n");

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          private_key: key,
          client_email: this.clientEmail,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth: this.auth });
      logger.success("✅ Google Sheets initialized");
      this.initializeSheets();
    } catch (error) {
      logger.error(`❌ Google Sheets initialization failed: ${error.message}`);
    }
  }

  async initializeSheets() {
    try {
      // Create Subscription sheet if not exists
      await this.createSheetIfNotExists(this.subscriptionSheet, [
        [
          "ID",
          "Phone",
          "Name",
          "Start Date",
          "Expiry Date",
          "Duration (Days)",
          "Active",
          "Custom Commands",
          "Total Commands",
          "Last Used",
          "Created At",
          "Updated At",
        ],
      ]);

      // Create Payment sheet if not exists
      await this.createSheetIfNotExists(this.paymentSheet, [
        [
          "Payment ID",
          "Order ID",
          "Phone",
          "Name",
          "Amount",
          "Payment Type",
          "Status",
          "Transaction Time",
          "Payment URL",
          "Created At",
          "Updated At",
        ],
      ]);

      logger.success("✅ Google Sheets initialized successfully");
    } catch (error) {
      logger.error(`❌ Failed to initialize sheets: ${error.message}`);
    }
  }

  async createSheetIfNotExists(sheetName, headerRow) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetExists = response.data.sheets.some(
        (sheet) => sheet.properties.title === sheetName,
      );

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });

        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: "RAW",
          requestBody: {
            values: headerRow,
          },
        });

        logger.info(`✅ Sheet "${sheetName}" created`);
      }
    } catch (error) {
      logger.error(
        `❌ Failed to create sheet "${sheetName}": ${error.message}`,
      );
    }
  }

  async appendToSheet(sheetName, values) {
    try {
      if (!this.sheets) {
        logger.warn("⚠️ Google Sheets not available. Using local storage.");
        return null;
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [values],
        },
      });

      return response.data;
    } catch (error) {
      logger.error(
        `❌ Failed to append to sheet "${sheetName}": ${error.message}`,
      );
      return null;
    }
  }

  async updateSheet(sheetName, rowIndex, values) {
    try {
      if (!this.sheets) {
        logger.warn("⚠️ Google Sheets not available. Using local storage.");
        return null;
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [values],
        },
      });

      return response.data;
    } catch (error) {
      logger.error(
        `❌ Failed to update sheet "${sheetName}": ${error.message}`,
      );
      return null;
    }
  }

  async getSheetData(sheetName, range = "A:Z") {
    try {
      if (!this.sheets) {
        logger.warn("⚠️ Google Sheets not available.");
        return [];
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
      });

      return response.data.values || [];
    } catch (error) {
      logger.error(
        `❌ Failed to get sheet data "${sheetName}": ${error.message}`,
      );
      return [];
    }
  }

  // Subscription methods
  async saveSubscription(subscription) {
    const values = [
      subscription.id,
      subscription.clientPhone,
      subscription.clientName,
      subscription.startDate,
      subscription.expiryDate,
      subscription.durationDays,
      subscription.isActive ? "Yes" : "No",
      JSON.stringify(subscription.customCommands || []),
      subscription.stats?.totalCommands || 0,
      subscription.stats?.lastUsed || "",
      subscription.createdAt,
      subscription.updatedAt,
    ];

    return this.appendToSheet(this.subscriptionSheet, values);
  }

  async updateSubscriptionInSheet(phone, subscription) {
    const data = await this.getSheetData(this.subscriptionSheet);
    if (data.length === 0) return null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === phone) {
        const values = [
          subscription.id,
          subscription.clientPhone,
          subscription.clientName,
          subscription.startDate,
          subscription.expiryDate,
          subscription.durationDays,
          subscription.isActive ? "Yes" : "No",
          JSON.stringify(subscription.customCommands || []),
          subscription.stats?.totalCommands || 0,
          subscription.stats?.lastUsed || "",
          subscription.createdAt,
          subscription.updatedAt,
        ];
        return this.updateSheet(this.subscriptionSheet, i + 1, values);
      }
    }
    return null;
  }

  async getSubscriptionFromSheet(phone) {
    const data = await this.getSheetData(this.subscriptionSheet);
    if (data.length === 0) return null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === phone) {
        return {
          id: data[i][0],
          clientPhone: data[i][1],
          clientName: data[i][2],
          startDate: data[i][3],
          expiryDate: data[i][4],
          durationDays: parseInt(data[i][5]),
          isActive: data[i][6] === "Yes",
          customCommands: JSON.parse(data[i][7] || "[]"),
          stats: {
            totalCommands: parseInt(data[i][8] || 0),
            lastUsed: data[i][9] || "",
          },
          createdAt: data[i][10],
          updatedAt: data[i][11],
        };
      }
    }
    return null;
  }

  async getAllSubscriptionsFromSheet() {
    const data = await this.getSheetData(this.subscriptionSheet);
    if (data.length <= 1) return [];

    const subscriptions = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        subscriptions.push({
          id: data[i][0],
          clientPhone: data[i][1],
          clientName: data[i][2],
          startDate: data[i][3],
          expiryDate: data[i][4],
          durationDays: parseInt(data[i][5]),
          isActive: data[i][6] === "Yes",
          customCommands: JSON.parse(data[i][7] || "[]"),
          stats: {
            totalCommands: parseInt(data[i][8] || 0),
            lastUsed: data[i][9] || "",
          },
          createdAt: data[i][10],
          updatedAt: data[i][11],
        });
      }
    }
    return subscriptions;
  }

  // Payment methods
  async savePayment(payment) {
    const values = [
      payment.paymentId,
      payment.orderId,
      payment.phone,
      payment.name,
      payment.amount,
      payment.paymentType || "midtrans",
      payment.status,
      payment.transactionTime || new Date().toISOString(),
      payment.paymentUrl || "",
      payment.createdAt || new Date().toISOString(),
      payment.updatedAt || new Date().toISOString(),
    ];

    return this.appendToSheet(this.paymentSheet, values);
  }

  async updatePaymentInSheet(orderId, payment) {
    const data = await this.getSheetData(this.paymentSheet);
    if (data.length === 0) return null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === orderId) {
        const values = [
          payment.paymentId,
          payment.orderId,
          payment.phone,
          payment.name,
          payment.amount,
          payment.paymentType || "midtrans",
          payment.status,
          payment.transactionTime || new Date().toISOString(),
          payment.paymentUrl || "",
          payment.createdAt || new Date().toISOString(),
          payment.updatedAt || new Date().toISOString(),
        ];
        return this.updateSheet(this.paymentSheet, i + 1, values);
      }
    }
    return null;
  }

  async getPaymentFromSheet(orderId) {
    const data = await this.getSheetData(this.paymentSheet);
    if (data.length === 0) return null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === orderId) {
        return {
          paymentId: data[i][0],
          orderId: data[i][1],
          phone: data[i][2],
          name: data[i][3],
          amount: parseInt(data[i][4]),
          paymentType: data[i][5] || "midtrans",
          status: data[i][6],
          transactionTime: data[i][7],
          paymentUrl: data[i][8] || "",
          createdAt: data[i][9],
          updatedAt: data[i][10],
        };
      }
    }
    return null;
  }

  async getPaymentsByPhone(phone) {
    const data = await this.getSheetData(this.paymentSheet);
    if (data.length <= 1) return [];

    const payments = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === phone) {
        payments.push({
          paymentId: data[i][0],
          orderId: data[i][1],
          phone: data[i][2],
          name: data[i][3],
          amount: parseInt(data[i][4]),
          paymentType: data[i][5] || "midtrans",
          status: data[i][6],
          transactionTime: data[i][7],
          paymentUrl: data[i][8] || "",
          createdAt: data[i][9],
          updatedAt: data[i][10],
        });
      }
    }
    return payments;
  }

  async getAllPaymentsFromSheet() {
    const data = await this.getSheetData(this.paymentSheet);
    if (data.length <= 1) return [];

    const payments = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        payments.push({
          paymentId: data[i][0],
          orderId: data[i][1],
          phone: data[i][2],
          name: data[i][3],
          amount: parseInt(data[i][4]),
          paymentType: data[i][5] || "midtrans",
          status: data[i][6],
          transactionTime: data[i][7],
          paymentUrl: data[i][8] || "",
          createdAt: data[i][9],
          updatedAt: data[i][10],
        });
      }
    }
    return payments;
  }
}

module.exports = new GoogleSheetsService();
