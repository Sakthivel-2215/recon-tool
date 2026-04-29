# ReconX — Website Intelligence & Reconnaissance Tool

A real, production-grade website recon tool. No dummy data — everything is live.

## 🔍 Features

| Module | What it does |
|--------|-------------|
| **DNS Records** | A, AAAA, MX, NS, TXT, SOA, CAA, CNAME records |
| **WHOIS Lookup** | Registrar, creation/expiry dates, registrant info |
| **HTTP Analysis** | Status codes, headers, response time, redirects, page title |
| **SSL Certificate** | Issuer, validity dates, days left, fingerprint, SANs |
| **IP Geolocation** | Country, city, ISP, ASN, coordinates |
| **Port Scanning** | 20+ common ports (FTP, SSH, HTTP, MySQL, Redis...) |
| **Technology Detection** | Web servers, frameworks, CDNs, CMS, JS libraries |
| **Security Headers** | HSTS, CSP, X-Frame-Options, Referrer-Policy and more |
| **Subdomains** | Checks 20 common subdomains via DNS resolution |
| **Robots.txt** | Fetches and displays content |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Start the Backend

```bash
cd backend
npm install
node server.js
# → Running on http://localhost:3001
```

### 2. Start the Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

### 3. Open browser
Go to **http://localhost:3000** and start scanning!

## 📁 Project Structure

```
recon-tool/
├── backend/
│   ├── server.js          # Express API server
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main React component
    │   ├── App.module.css # Styles
    │   ├── index.css      # Global styles
    │   └── main.jsx       # Entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🔧 API

### POST /api/recon
```json
{ "domain": "example.com" }
```

Returns full recon data including DNS, WHOIS, HTTP, SSL, geo, ports, technologies, security headers, and subdomains.

### GET /health
Returns `{ "status": "ok" }`

## ⚙️ Configuration

Backend runs on **port 3001** by default. Change with `PORT=3002 node server.js`.

Frontend proxies `/api/*` to `localhost:3001` (configured in `vite.config.js`).

## ⚠️ Legal Notice

This tool is for **educational and security research purposes only**.  
Only scan domains you own or have explicit permission to scan.

---

Built with: Node.js • Express • React • Vite
