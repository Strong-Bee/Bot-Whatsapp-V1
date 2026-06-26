# 🤖 WhatsApp Bot Express

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-5.x-blue.svg" alt="Express">
  <img src="https://img.shields.io/badge/WhatsApp-Web.js-brightgreen.svg" alt="WhatsApp Web.js">
  <img src="https://img.shields.io/badge/License-ISC-yellow.svg" alt="License">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success.svg" alt="Status">
</p>

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Demo](#-demo)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Penggunaan](#-penggunaan)
- [Command List](#-command-list)
- [API Documentation](#-api-documentation)
- [Subscription System](#-subscription-system)
- [Payment Integration](#-payment-integration)
- [Google Sheets Integration](#-google-sheets-integration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Fitur

### ✨ Core Features

- ✅ **WhatsApp Bot** - Otomatis merespon pesan WhatsApp
- ✅ **Multi-User Support** - Mendukung banyak pengguna dengan role berbeda
- ✅ **Role-Based Access** - Owner, Admin, dan User dengan permission berbeda
- ✅ **JWT Authentication** - Keamanan API dengan JSON Web Token
- ✅ **Stealth Mode** - Menggunakan puppeteer-extra untuk menghindari deteksi

### 💳 Subscription System

- ✅ **Sistem Sewa** - Bot bisa disewakan ke banyak client
- ✅ **Custom Commands** - Client bisa menambah command sendiri
- ✅ **Built-in Commands** - Command bawaan yang tidak bisa dihapus client
- ✅ **Subscription Management** - Buat, perpanjang, dan kelola subscription
- ✅ **Auto-Expiry** - Subscription otomatis kadaluarsa

### 💰 Payment Integration

- ✅ **Midtrans Payment Gateway** - Mendukung berbagai metode pembayaran
- ✅ **Payment Link** - Generate link pembayaran otomatis
- ✅ **Payment Status** - Cek status pembayaran
- ✅ **Payment History** - Riwayat pembayaran client
- ✅ **Webhook Notification** - Auto-update status payment

### 📊 Google Sheets Integration

- ✅ **Auto Sync** - Data subscription otomatis tersimpan ke Google Sheets
- ✅ **Payment History** - Riwayat pembayaran tercatat
- ✅ **Custom Commands** - Command client tersimpan
- ✅ **Data Backup** - Backup data di cloud

### 🔧 Admin Features

- ✅ **User Management** - Lihat, tambah, edit, hapus user
- ✅ **Subscription Management** - Buat dan perpanjang subscription
- ✅ **Broadcast Message** - Kirim pesan ke semua user
- ✅ **Block/Unblock** - Blokir nomor spam
- ✅ **Bot Statistics** - Lihat statistik bot

---

## 🎥 Demo

### Commands Demo

```bash
/menu          # Menampilkan menu lengkap
/status-bot    # Cek status subscription
/os            # Info sistem operasi
/add salam Halo # Menambah custom command
/buy           # Mulai pembelian subscription
/pay           # Lanjut ke pembayaran
```

### Payment Flow

```mermaid
graph LR
    A[User: /buy] --> B[Bot: Tampilkan harga]
    B --> C[User: /pay]
    C --> D[Midtrans: Payment Link]
    D --> E[User: Bayar]
    E --> F[Midtrans: Webhook]
    F --> G[Bot: Aktifkan Subscription]
```

---

## 🛠️ Teknologi

### Backend

| Teknologi       | Versi  | Fungsi           |
| --------------- | ------ | ---------------- |
| Node.js         | 18.x+  | Runtime          |
| Express         | 5.x    | Web Framework    |
| WhatsApp Web.js | 1.34.x | WhatsApp API     |
| Puppeteer Extra | 3.3.x  | Headless Browser |
| JWT             | 9.0.x  | Authentication   |
| Bcryptjs        | 2.4.x  | Password Hashing |

### Integrasi

| Teknologi         | Fungsi          |
| ----------------- | --------------- |
| Google Sheets API | Data Storage    |
| Midtrans          | Payment Gateway |
| QRCode Terminal   | QR Code Display |

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-bot.git
cd whatsapp-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 4. Jalankan Bot

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Scan QR Code

Setelah bot berjalan, scan QR code yang muncul di terminal menggunakan WhatsApp.

---

## ⚙️ Konfigurasi

### .env Configuration

```env
# Server Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# WhatsApp Configuration
SESSION_PATH=./session
PUPPETEER_HEADLESS=new

# Owner Configuration
OWNER_NUMBER=6281234567890
OWNER_NAME=YourName

# Admin Numbers (pisahkan dengan koma)
ADMIN_NUMBERS=6281234567890,6289876543210

# Subscription Configuration
SUBSCRIPTION_DEFAULT_DAYS=30
SUBSCRIPTION_PRICE=100000

# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SUBSCRIPTION_SHEET=Subscriptions
GOOGLE_SHEETS_PAYMENT_SHEET=Payments

# Midtrans Configuration
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_PAYMENT_NOTIFICATION_URL=https://your-domain.com/api/payment/notification
```

### Google Sheets Setup

1. Buat Service Account di Google Cloud Console
2. Download JSON key file
3. Share Google Sheet dengan email service account
4. Copy Spreadsheet ID dari URL Google Sheets

### Midtrans Setup

1. Daftar akun di [Midtrans](https://midtrans.com)
2. Dapatkan Server Key dan Client Key
3. Setup Payment Notification URL
4. Test dengan sandbox mode terlebih dahulu

---

## 📱 Command List

### 📋 General Commands (Semua User)

| Command    | Deskripsi                |
| ---------- | ------------------------ |
| `/menu`    | Menampilkan menu lengkap |
| `/help`    | Bantuan                  |
| `/ping`    | Cek koneksi bot          |
| `/info`    | Informasi bot            |
| `/time`    | Waktu saat ini           |
| `/sticker` | Buat stiker dari gambar  |
| `/contact` | Kontak admin             |
| `/myrole`  | Cek role Anda            |

### 💳 Subscription Commands

| Command                     | Deskripsi                    |
| --------------------------- | ---------------------------- |
| `/status-bot`               | Cek status subscription      |
| `/os`                       | Info sistem operasi          |
| `/buy`                      | Mulai pembelian subscription |
| `/pay [days]`               | Lanjut ke pembayaran         |
| `/payment-status [orderId]` | Cek status pembayaran        |
| `/my-payments`              | Lihat riwayat pembayaran     |
| `/my-sub`                   | Lihat detail subscription    |

### 🔧 Custom Commands (Client)

| Command                  | Deskripsi             |
| ------------------------ | --------------------- |
| `/add [cmd] [response]`  | Tambah custom command |
| `/list`                  | Lihat custom commands |
| `/edit [cmd] [response]` | Edit custom command   |
| `/del [cmd]`             | Hapus custom command  |

### 🛡️ Admin Commands

| Command                            | Deskripsi                |
| ---------------------------------- | ------------------------ |
| `/users`                           | Lihat semua user         |
| `/stats`                           | Statistik bot            |
| `/subscribe [phone] [name] [days]` | Buat subscription        |
| `/extend [phone] [days]`           | Perpanjang subscription  |
| `/subs`                            | Lihat semua subscription |
| `/broadcast [message]`             | Kirim broadcast          |

### 👑 Owner Commands

| Command                                      | Deskripsi             |
| -------------------------------------------- | --------------------- |
| `/register [phone] [name] [password] [role]` | Register user         |
| `/block [phone]`                             | Block nomor           |
| `/unblock [phone]`                           | Unblock nomor         |
| `/blocked`                                   | Daftar nomor diblokir |

---

## 📚 API Documentation

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "6281234567890",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_123",
      "phone": "6281234567890",
      "name": "John Doe",
      "role": "owner"
    }
  }
}
```

#### Register (Owner Only)

```http
POST /api/auth/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "6281234567890",
  "name": "John Doe",
  "password": "password123",
  "role": "admin"
}
```

### Bot Endpoints

#### Send Message

```http
POST /api/bot/send-message
Authorization: Bearer <token>
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Hello World!"
}
```

#### Send Media

```http
POST /api/bot/send-media
Authorization: Bearer <token>
Content-Type: application/json

{
  "number": "6281234567890",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Gambar bot"
}
```

#### Broadcast

```http
POST /api/bot/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "numbers": ["6281234567890", "6289876543210"],
  "message": "Pesan broadcast!"
}
```

### Payment Endpoints

#### Create Payment

```http
POST /api/payment/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "6281234567890",
  "name": "John Doe",
  "durationDays": 30
}
```

#### Check Payment Status

```http
GET /api/payment/status/:orderId
Authorization: Bearer <token>
```

#### Payment History

```http
GET /api/payment/history/:phone
Authorization: Bearer <token>
```

### Payment Webhook (Midtrans)

```http
POST /api/payment/notification
Content-Type: application/json

{
  "order_id": "SUB-123456",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "gross_amount": "100000"
}
```

---

## 💳 Subscription System

### Subscription Flow

```mermaid
sequenceDiagram
    participant User
    participant Bot
    participant Midtrans
    participant GoogleSheets

    User->>Bot: /buy
    Bot->>User: Tampilkan harga
    User->>Bot: /pay
    Bot->>Midtrans: Create Transaction
    Midtrans->>Bot: Payment Link
    Bot->>User: Kirim link pembayaran
    User->>Midtrans: Bayar
    Midtrans->>Bot: Webhook Notification
    Bot->>GoogleSheets: Save payment
    Bot->>GoogleSheets: Save/Update subscription
    Bot->>User: Subscription aktif!
```

### Subscription Status

- 🟢 **Active** - Subscription aktif
- 🔴 **Expired** - Subscription kadaluarsa
- ⏳ **Pending** - Menunggu pembayaran

### Pricing

- Default: 30 hari
- Harga: Rp100.000
- Custom: Bisa disesuaikan di `.env`

---

## 📊 Google Sheets Integration

### Sheets Structure

#### Subscriptions Sheet

| Column | Description     |
| ------ | --------------- |
| A      | ID              |
| B      | Phone           |
| C      | Name            |
| D      | Start Date      |
| E      | Expiry Date     |
| F      | Duration (Days) |
| G      | Active          |
| H      | Custom Commands |
| I      | Total Commands  |
| J      | Last Used       |
| K      | Created At      |
| L      | Updated At      |

#### Payments Sheet

| Column | Description      |
| ------ | ---------------- |
| A      | Payment ID       |
| B      | Order ID         |
| C      | Phone            |
| D      | Name             |
| E      | Amount           |
| F      | Payment Type     |
| G      | Status           |
| H      | Transaction Time |
| I      | Payment URL      |
| J      | Created At       |
| K      | Updated At       |

---

## 🔧 Troubleshooting

### Common Issues

#### 1. QR Code Tidak Muncul

```bash
# Hapus session
rm -rf session/

# Restart bot
npm run dev
```

#### 2. Bot Tidak Merespon

```bash
# Cek log
tail -f logs/$(date +%Y-%m-%d).log

# Restart bot
npm run dev
```

#### 3. Google Sheets Error

- Pastikan service account memiliki akses ke spreadsheet
- Cek format private key di .env
- Pastikan spreadsheet ID benar

#### 4. Midtrans Payment Error

- Cek server key dan client key
- Pastikan URL webhook accessible
- Cek status sandbox/production

### Logs

Logs tersimpan di folder `logs/` dengan format `YYYY-MM-DD.log`

---

## 🤝 Contributing

### Cara Berkontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

### Code Style

- Gunakan ESLint
- Ikuti gaya penulisan yang konsisten
- Tambahkan komentar untuk kode yang kompleks

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---

## 🙏 Support

### Contact

- **Email**: admin@example.com
- **WhatsApp**: +6281234567890
- **Website**: https://example.com

### Donation

Support project ini dengan:

- ⭐ Star repository
- 🐛 Report issues
- 💰 Donasi via [Saweria](https://saweria.co/yourusername)

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/whatsapp-bot?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/whatsapp-bot?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/whatsapp-bot)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/whatsapp-bot)

---

## 🚀 Roadmap

- [ ] Web Dashboard
- [ ] Multiple Bot Support
- [ ] AI Integration (ChatGPT)
- [ ] Analytics Dashboard
- [ ] Mobile App
- [ ] API Rate Limiting
- [ ] Webhook Customization
- [ ] Multi-Language Support

---

## ⚠️ Disclaimer

Bot ini dibuat untuk tujuan edukasi. Penggunaan bot ini sepenuhnya tanggung jawab pengguna. Pastikan mematuhi ketentuan WhatsApp dan regulasi yang berlaku.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/yourusername">Your Name</a>
</p>
#
