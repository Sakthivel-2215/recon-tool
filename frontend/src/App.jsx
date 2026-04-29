import React, { useState, useRef } from 'react'
import styles from './App.module.css'

// ── Utility ───────────────────────────────────────────────────────────────────
const fmt = (v) => (v === undefined || v === null || v === '') ? '—' : String(v)

function Badge({ color, children }) {
  const colors = {
    green: { background: '#001a0e', color: '#00ff87', border: '1px solid #00ff87' },
    red:   { background: '#1a0006', color: '#ff4560', border: '1px solid #ff4560' },
    yellow:{ background: '#1a1200', color: '#ffd60a', border: '1px solid #ffd60a' },
    cyan:  { background: '#00101a', color: '#00e5ff', border: '1px solid #00e5ff' },
    gray:  { background: '#0d1a12', color: '#7aad88', border: '1px solid #3d6b4a' },
  }
  return (
    <span style={{
      ...colors[color] || colors.gray,
      padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
      fontFamily: 'var(--mono)', letterSpacing: '0.05em', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function Card({ title, icon, children, accent }) {
  return (
    <div className={`${styles.card} fade-in`} style={accent ? { borderTopColor: accent } : {}}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{icon}</span>
        <span className={styles.cardTitle}>{title}</span>
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  )
}

function Row({ label, value, mono, badge }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue} style={mono ? { fontFamily: 'var(--mono)', fontSize: '12px' } : {}}>
        {badge ? <Badge color={badge.color}>{badge.text}</Badge> : fmt(value)}
      </span>
    </div>
  )
}

// ── Scan Animation ────────────────────────────────────────────────────────────
function ScanningAnimation({ domain }) {
  const steps = [
    'Resolving DNS records...',
    'Fetching WHOIS data...',
    'Probing HTTP headers...',
    'Analyzing SSL certificate...',
    'Scanning open ports...',
    'Geolocating IP address...',
    'Detecting technologies...',
    'Checking subdomains...',
    'Reading robots.txt...',
    'Analyzing security headers...',
  ]
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 600)
    return () => clearInterval(t)
  }, [])
  return (
    <div className={styles.scanWrapper}>
      <div className={styles.scanTarget}>
        <span className={styles.scanTargetLabel}>TARGET</span>
        <span className={styles.scanTargetDomain}>{domain}</span>
      </div>
      <div className={styles.scanProgress}>
        <div className={styles.scanBar}><div className={styles.scanBarFill} /></div>
        <div className={styles.scanLog}>
          {steps.slice(0, step + 1).map((s, i) => (
            <div key={i} className={styles.scanLogLine}>
              <span className={styles.scanLogArrow}>&gt;&gt;</span>
              <span className={i === step ? styles.scanLogActive : styles.scanLogDone}>{s}</span>
              {i < step && <span className={styles.scanLogOk}>✓</span>}
              {i === step && <span className={styles.scanCursor} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── DNS Card ──────────────────────────────────────────────────────────────────
function DNSCard({ dns }) {
  const types = [
    { key: 'A',    label: 'A Records (IPv4)' },
    { key: 'AAAA', label: 'AAAA Records (IPv6)' },
    { key: 'MX',   label: 'Mail Servers (MX)' },
    { key: 'NS',   label: 'Name Servers (NS)' },
    { key: 'TXT',  label: 'TXT Records' },
    { key: 'CNAME',label: 'CNAME Records' },
    { key: 'SOA',  label: 'SOA Record' },
    { key: 'CAA',  label: 'CAA Records' },
  ]
  return (
    <Card title="DNS RECORDS" icon="⬡" accent="var(--cyan)">
      {types.map(({ key, label }) => {
        const val = dns?.[key]
        if (!val || (Array.isArray(val) && val.length === 0)) return null
        return (
          <div key={key} className={styles.dnsGroup}>
            <div className={styles.dnsType}>{label}</div>
            {Array.isArray(val) ? val.map((v, i) => (
              <div key={i} className={styles.dnsRecord}>
                {key === 'MX'  ? `${v.priority} → ${v.exchange}` :
                 key === 'TXT' ? (Array.isArray(v) ? v.join('') : v) :
                 key === 'SOA' ? `${v.nsname} | serial: ${v.serial}` :
                 key === 'CAA' ? `${v.critical} ${v.issue}` :
                 String(v)}
              </div>
            )) : (
              <div className={styles.dnsRecord}>{String(val)}</div>
            )}
          </div>
        )
      })}
    </Card>
  )
}

// ── SSL Card ──────────────────────────────────────────────────────────────────
function SSLCard({ ssl }) {
  if (!ssl) return null
  if (ssl.error) return (
    <Card title="SSL CERTIFICATE" icon="🔒" accent="var(--red)">
      <Row label="Status" badge={{ color: 'red', text: 'ERROR: ' + ssl.error }} />
    </Card>
  )
  const statusColor = ssl.isExpired ? 'red' : ssl.isExpiringSoon ? 'yellow' : 'green'
  const statusText  = ssl.isExpired ? 'EXPIRED' : ssl.isExpiringSoon ? `EXPIRES IN ${ssl.daysLeft}d` : `VALID (${ssl.daysLeft} days left)`
  return (
    <Card title="SSL CERTIFICATE" icon="🔒" accent="var(--green)">
      <Row label="Status"      badge={{ color: statusColor, text: statusText }} />
      <Row label="Issued To"   value={ssl.subject?.CN} mono />
      <Row label="Issuer"      value={ssl.issuer?.O || ssl.issuer?.CN} mono />
      <Row label="Valid From"  value={ssl.validFrom} mono />
      <Row label="Valid To"    value={ssl.validTo}   mono />
      <Row label="Key Bits"    value={ssl.bits ? `${ssl.bits}-bit` : '—'} />
      <Row label="Serial"      value={ssl.serialNumber?.substring(0, 20) + '...'} mono />
      <Row label="Fingerprint" value={ssl.fingerprint?.substring(0, 30) + '...'} mono />
      {ssl.subjectAltName && (
        <div className={styles.dnsGroup}>
          <div className={styles.dnsType}>Subject Alt Names</div>
          {ssl.subjectAltName.split(', ').slice(0, 8).map((s, i) => (
            <div key={i} className={styles.dnsRecord}>{s}</div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── HTTP Card ─────────────────────────────────────────────────────────────────
function HTTPCard({ http }) {
  if (!http) return null
  const sc = http.statusCode
  const statusColor = sc >= 500 ? 'red' : sc >= 400 ? 'yellow' : sc >= 300 ? 'cyan' : 'green'
  const importantHeaders = [
    'server', 'content-type', 'cache-control', 'x-powered-by',
    'x-frame-options', 'strict-transport-security', 'content-encoding',
    'cf-ray', 'x-vercel-id', 'x-amz-cf-id', 'set-cookie',
  ]
  return (
    <Card title="HTTP RESPONSE" icon="◈" accent="var(--cyan)">
      {http.error ? <Row label="Error" badge={{ color: 'red', text: http.error }} /> : <>
        <Row label="Status Code"   badge={{ color: statusColor, text: `${sc} ${http.statusText || ''}` }} />
        <Row label="Protocol"      badge={{ color: 'cyan', text: http.protocol || 'HTTPS' }} />
        <Row label="Response Time" value={`${http.responseTime}ms`} />
        <Row label="Redirects"     value={http.redirects || '0'} />
        <Row label="Page Title"    value={http.pageTitle} />
        <Row label="Content-Type"  value={http.contentType} mono />
        <Row label="Content-Length"value={http.contentLength ? `${Math.round(parseInt(http.contentLength)/1024)} KB` : '—'} />
        {http.finalUrl && <Row label="Final URL" value={http.finalUrl} mono />}
        <div className={styles.dnsGroup}>
          <div className={styles.dnsType}>Response Headers</div>
          {importantHeaders.map(h => {
            const v = http.headers?.[h]
            if (!v) return null
            return (
              <div key={h} className={styles.headerRow}>
                <span className={styles.headerKey}>{h}:</span>
                <span className={styles.headerVal}>{String(v).substring(0, 80)}</span>
              </div>
            )
          })}
        </div>
      </>}
    </Card>
  )
}

// ── Geo Card ──────────────────────────────────────────────────────────────────
function GeoCard({ geo, ip }) {
  if (!geo) return null
  return (
    <Card title="IP GEOLOCATION" icon="◉" accent="var(--yellow)">
      <Row label="IP Address" value={ip || geo.query} mono />
      <Row label="Country"    value={`${geo.country} (${geo.countryCode})`} />
      <Row label="Region"     value={geo.regionName} />
      <Row label="City"       value={geo.city} />
      <Row label="Timezone"   value={geo.timezone} />
      <Row label="ISP"        value={geo.isp} />
      <Row label="Org"        value={geo.org} />
      <Row label="AS"         value={geo.as} />
      <Row label="Coordinates" value={geo.lat && geo.lon ? `${geo.lat}, ${geo.lon}` : '—'} mono />
    </Card>
  )
}

// ── Ports Card ────────────────────────────────────────────────────────────────
function PortsCard({ ports }) {
  if (!ports) return null
  return (
    <Card title="OPEN PORTS" icon="▣" accent={ports.length > 0 ? 'var(--red)' : 'var(--green)'}>
      {ports.length === 0 ? (
        <Row label="Result" badge={{ color: 'green', text: 'No common ports exposed' }} />
      ) : (
        <div className={styles.portGrid}>
          {ports.map(({ port, service }) => (
            <div key={port} className={styles.portItem}>
              <span className={styles.portNumber}>{port}</span>
              <span className={styles.portService}>{service}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── Technologies Card ─────────────────────────────────────────────────────────
function TechCard({ techs }) {
  if (!techs || techs.length === 0) return null
  const categories = [...new Set(techs.map(t => t.category))]
  const catColors = {
    'Web Server': 'cyan', 'Framework': 'green', 'CDN/Security': 'yellow',
    'CDN': 'yellow', 'Hosting': 'cyan', 'CMS': 'orange', 'E-commerce': 'orange',
    'JS Library': 'green', 'JS Framework': 'green', 'CSS Framework': 'cyan',
    'Analytics': 'gray', 'Security': 'red', 'Cloud': 'yellow',
  }
  return (
    <Card title="DETECTED TECHNOLOGIES" icon="⟁" accent="var(--green)">
      {categories.map(cat => (
        <div key={cat} className={styles.techGroup}>
          <div className={styles.dnsType}>{cat}</div>
          <div className={styles.techList}>
            {techs.filter(t => t.category === cat).map((t, i) => (
              <Badge key={i} color={catColors[cat] || 'gray'}>{t.name}</Badge>
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}

// ── Security Headers Card ─────────────────────────────────────────────────────
function SecurityCard({ headers, score }) {
  if (!headers) return null
  return (
    <Card title="SECURITY ANALYSIS" icon="⚿" accent={score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)'}>
      <div className={styles.scoreWrapper}>
        <div className={styles.scoreLabel}>SECURITY SCORE</div>
        <div className={styles.scoreValue} style={{
          color: score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)'
        }}>{score}<span className={styles.scoreMax}>/100</span></div>
        <div className={styles.scoreBar}>
          <div className={styles.scoreBarFill} style={{
            width: `${score}%`,
            background: score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)',
          }} />
        </div>
      </div>
      <div className={styles.secHeadersList}>
        {headers.map((h, i) => (
          <div key={i} className={styles.secHeaderRow}>
            <span className={h.present ? styles.secPresent : styles.secMissing}>{h.present ? '✓' : '✗'}</span>
            <div className={styles.secHeaderInfo}>
              <div className={styles.secHeaderName}>{h.name}</div>
              <div className={styles.secHeaderDesc}>{h.desc}</div>
              {h.present && h.value && (
                <div className={styles.secHeaderValue}>{String(h.value).substring(0, 60)}</div>
              )}
            </div>
            <Badge color={h.present ? 'green' : 'red'}>{h.present ? 'PRESENT' : 'MISSING'}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── WHOIS Card ────────────────────────────────────────────────────────────────
function WHOISCard({ whois }) {
  const [showRaw, setShowRaw] = useState(false)
  if (!whois) return null
  const { parsed, raw, error } = whois
  return (
    <Card title="WHOIS DATA" icon="◫" accent="var(--yellow)">
      {error ? <Row label="Error" badge={{ color: 'red', text: error }} /> : <>
        {parsed && <>
          <Row label="Registrar"          value={parsed.registrar} />
          <Row label="Created Date"       value={parsed.createdDate} mono />
          <Row label="Expiry Date"        value={parsed.expiryDate} mono />
          <Row label="Updated Date"       value={parsed.updatedDate} mono />
          <Row label="Registrant Org"     value={parsed.registrantOrg} />
          <Row label="Registrant Country" value={parsed.registrantCountry} />
          <Row label="Status"             value={parsed.status} mono />
          <Row label="DNSSEC"             value={parsed.dnssec} />
        </>}
        {raw && (
          <div style={{ marginTop: '12px' }}>
            <button className={styles.rawToggle} onClick={() => setShowRaw(s => !s)}>
              {showRaw ? '▼ HIDE RAW WHOIS' : '▶ SHOW RAW WHOIS'}
            </button>
            {showRaw && <pre className={styles.rawWhois}>{raw}</pre>}
          </div>
        )}
      </>}
    </Card>
  )
}

// ── Subdomains Card ───────────────────────────────────────────────────────────
function SubdomainsCard({ subdomains }) {
  if (!subdomains || subdomains.length === 0) return (
    <Card title="SUBDOMAINS" icon="⬡" accent="var(--text3)">
      <Row label="Result" badge={{ color: 'gray', text: 'No common subdomains found' }} />
    </Card>
  )
  return (
    <Card title="SUBDOMAINS FOUND" icon="⬡" accent="var(--orange)">
      {subdomains.map((s, i) => (
        <div key={i} className={styles.subdomain}>
          <span className={styles.subdomainName}>{s.subdomain}</span>
          <span className={styles.subdomainIP}>{s.ips?.join(', ')}</span>
        </div>
      ))}
    </Card>
  )
}

// ── Robots Card ───────────────────────────────────────────────────────────────
function RobotsCard({ robots }) {
  if (!robots) return null
  const [show, setShow] = useState(false)
  return (
    <Card title="ROBOTS.TXT" icon="◈" accent={robots.found ? 'var(--cyan)' : 'var(--text3)'}>
      <Row label="Status" badge={{ color: robots.found ? 'green' : 'gray', text: robots.found ? 'FOUND' : 'NOT FOUND' }} />
      {robots.found && robots.content && (
        <>
          <button className={styles.rawToggle} onClick={() => setShow(s => !s)} style={{ marginTop: '8px' }}>
            {show ? '▼ HIDE CONTENT' : '▶ SHOW CONTENT'}
          </button>
          {show && <pre className={styles.rawWhois}>{robots.content}</pre>}
        </>
      )}
    </Card>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const runScan = async () => {
    const target = domain.trim()
    if (!target) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') runScan() }

  const examples = ['github.com', 'cloudflare.com', 'netflix.com', 'shopify.com']

  return (
    <div className={styles.app}>
      {/* Scanline effect */}
      <div className={styles.scanline} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <span className={`${styles.logoText} glow`}>RECONX</span>
            <span className={styles.logoBeta}>v2.0</span>
          </div>
          <div className={styles.headerTagline}>
            WEBSITE INTELLIGENCE &amp; RECONNAISSANCE TOOL
          </div>
        </div>
      </header>

      {/* Search */}
      <main className={styles.main}>
        <div className={styles.searchSection}>
          <div className={styles.terminal}>
            <div className={styles.terminalBar}>
              <span className={styles.dot} style={{ background: '#ff4560' }} />
              <span className={styles.dot} style={{ background: '#ffd60a' }} />
              <span className={styles.dot} style={{ background: '#00ff87' }} />
              <span className={styles.terminalTitle}>recon-shell — bash</span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.prompt}>
                <span className={styles.promptUser}>root@reconx</span>
                <span className={styles.promptSep}>:</span>
                <span className={styles.promptDir}>~/scan</span>
                <span className={styles.promptDollar}>$</span>
                <span className={styles.promptCmd}>recon</span>
              </div>
              <div className={styles.inputRow}>
                <span className={styles.inputArrow}>&gt;</span>
                <input
                  ref={inputRef}
                  className={styles.input}
                  type="text"
                  placeholder="enter target domain (e.g. example.com)"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading}
                  autoFocus
                />
                <button
                  className={styles.scanBtn}
                  onClick={runScan}
                  disabled={loading || !domain.trim()}
                >
                  {loading ? 'SCANNING...' : 'LAUNCH SCAN'}
                </button>
              </div>
              <div className={styles.examples}>
                <span className={styles.examplesLabel}>quick targets:</span>
                {examples.map(ex => (
                  <button key={ex} className={styles.exampleBtn}
                    onClick={() => { setDomain(ex); }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scanning animation */}
        {loading && <ScanningAnimation domain={domain} />}

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>✗</span>
            <span>SCAN FAILED: {error}</span>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className={styles.results}>
            {/* Summary strip */}
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>TARGET</span>
                <span className={`${styles.summaryValue} glow`}>{result.domain}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>IP ADDRESS</span>
                <span className={styles.summaryValue}>{result.ip || '—'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>HTTP STATUS</span>
                <span className={styles.summaryValue} style={{
                  color: result.http?.statusCode < 400 ? 'var(--green)' : 'var(--red)'
                }}>{result.http?.statusCode || '—'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>OPEN PORTS</span>
                <span className={styles.summaryValue} style={{
                  color: (result.openPorts?.length || 0) > 5 ? 'var(--red)' : 'var(--green)'
                }}>{result.openPorts?.length || 0}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>SECURITY SCORE</span>
                <span className={styles.summaryValue} style={{
                  color: result.securityScore >= 80 ? 'var(--green)' : result.securityScore >= 50 ? 'var(--yellow)' : 'var(--red)'
                }}>{result.securityScore}/100</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>LOCATION</span>
                <span className={styles.summaryValue}>{result.geo?.city ? `${result.geo.city}, ${result.geo.countryCode}` : '—'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>SCANNED AT</span>
                <span className={styles.summaryValue}>{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              <div className={styles.col}>
                <DNSCard dns={result.dns} />
                <SSLCard ssl={result.ssl} />
                <WHOISCard whois={result.whois} />
                <RobotsCard robots={result.robots} />
              </div>
              <div className={styles.col}>
                <HTTPCard http={result.http} />
                <SecurityCard headers={result.securityHeaders} score={result.securityScore} />
                <TechCard techs={result.technologies} />
                <GeoCard geo={result.geo} ip={result.ip} />
                <PortsCard ports={result.openPorts} />
                <SubdomainsCard subdomains={result.subdomains} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <span>RECONX — FOR EDUCATIONAL &amp; SECURITY RESEARCH PURPOSES ONLY</span>
      </footer>
    </div>
  )
}
