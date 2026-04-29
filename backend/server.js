const express = require('express');
const cors = require('cors');
const dns = require('dns').promises;
const tls = require('tls');
const net = require('net');
const axios = require('axios');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DNS ─────────────────────────────────────────
async function getDNSRecords(domain) {
  const results = {};
  try { results.A = await dns.resolve4(domain); } catch { results.A = [] }
  try { results.MX = await dns.resolveMx(domain); } catch { results.MX = [] }
  try { results.NS = await dns.resolveNs(domain); } catch { results.NS = [] }
  return results;
}

// ─── WHOIS ───────────────────────────────────────
function getWhois(domain) {
  return new Promise((resolve) => {
    exec(`whois ${domain}`, (error, stdout) => {
      if (error) return resolve({ error: error.message });
      resolve({ raw: stdout.substring(0, 3000) });
    });
  });
}

// ─── HTTP ────────────────────────────────────────
async function getHTTPInfo(domain) {
  const start = Date.now();
  try {
    const res = await axios.get(`https://${domain}`, {
      timeout: 8000,
      validateStatus: () => true
    });

    return {
      statusCode: res.status,
      protocol: "HTTPS",
      responseTime: Date.now() - start,
      headers: res.headers,
      finalUrl: res.request?.res?.responseUrl
    };

  } catch {
    return { error: 'HTTP failed' };
  }
}

// ─── SSL ─────────────────────────────────────────
function getSSLCert(domain) {
  return new Promise((resolve) => {
    const socket = tls.connect(443, domain, { servername: domain }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();

      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysLeft = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

      resolve({
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysLeft,
        isExpired: daysLeft < 0
      });
    });

    socket.on('error', () => resolve({ error: 'SSL error' }));
  });
}

// ─── GEO ─────────────────────────────────────────
async function getGeo(ip) {
  try {
    const r = await axios.get(`http://ip-api.com/json/${ip}`);
    return r.data;
  } catch {
    return null;
  }
}

// ─── PORT SCAN ───────────────────────────────────
function scanPort(ip, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(1000);

    s.connect(port, ip, () => {
      s.destroy();
      resolve({ port });
    });

    s.on('error', () => resolve(null));
    s.on('timeout', () => resolve(null));
  });
}

async function scanPorts(ip) {
  const ports = [80, 443, 22, 21];
  const res = await Promise.all(ports.map(p => scanPort(ip, p)));
  return res.filter(Boolean);
}

// ─── SECURITY HEADERS ─────────────────────────────
function analyzeHeaders(headers = {}) {
  const checks = [
    { key: 'strict-transport-security', name: 'HSTS' },
    { key: 'x-frame-options', name: 'X-Frame' },
    { key: 'x-content-type-options', name: 'NoSniff' }
  ];
  return checks.map(c => ({
    name: c.name,
    present: !!headers[c.key],
    value: headers[c.key] || null
  }));
}

// ─── MAIN API ─────────────────────────────────────
app.post('/api/recon', async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const clean = domain.replace(/^https?:\/\//, '').trim();

  try {
    const dnsData = await getDNSRecords(clean);
    const ip = dnsData.A?.[0];

    const [whois, http, ssl, ports, geo] = await Promise.all([
      getWhois(clean),
      getHTTPInfo(clean),
      getSSLCert(clean),
      ip ? scanPorts(ip) : [],
      ip ? getGeo(ip) : null
    ]);

    const securityHeaders = analyzeHeaders(http.headers);
    const securityScore = 100 - (securityHeaders.filter(h => !h.present).length * 10);

    res.json({
      domain: clean,
      ip,
      timestamp: new Date().toISOString(),

      dns: dnsData,
      whois,
      http,
      ssl,
      geo,
      openPorts: ports,

      securityHeaders,
      securityScore,

      technologies: [],   // (future)
      subdomains: [],     // (future)
      robots: null        // (future)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SERVER ───────────────────────────────────────
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Server running on port ${PORT}`);
});