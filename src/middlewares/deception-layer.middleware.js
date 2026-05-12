import pkg from 'signale';
const { Signale } = pkg;

const logger = new Signale({ scope: 'Deception Layer' });

const ipTracker = new Map();

const CONFIG = {
  ATTACK_THRESHOLD: 5,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000,
  MALICIOUS_PATTERNS: [
  /sql|union|select|drop|insert|delete|update|exec|script|attacker|malicious/gi,
  /<script|javascript:|onerror|onload|onclick/gi,
  /\.\.|\/\/|\.\.\/|%2e%2e/gi,
  /passwd|shadow|etc\/|admin|root|system32/gi,
],
  HONEY_ENDPOINTS: [
    '/api/admin',
    '/api/super-secret',
    '/api/database',
    '/api/internal',
    '/backup',
    '/config',
  ],
  WHITELIST_PATHS: [
    '/user',
    '/auth/login',
    '/auth/register',
  ],
  BOT_UA_PATTERNS: /curl|wget|python-requests|python|go-http-client|java\/|nikto|sqlmap|nmap|masscan|zgrab|dirbuster|gobuster|wfuzz|hydra|medusa|burpsuite|scanner|bot|spider|crawl/gi,
};

const cleanupOldRecords = () => {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipTracker.entries()) {
      if (now - data.firstSeen > CONFIG.CLEANUP_INTERVAL) {
        ipTracker.delete(ip);
        logger.info(`Registro de IP limpiado: ${ip}`);
      }
    }
  }, CONFIG.CLEANUP_INTERVAL);
};

cleanupOldRecords();

const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

const detectMaliciousPattern = (req) => {
  const url = req.originalUrl || '';
  const body = JSON.stringify(req.body || {});
  const headers = JSON.stringify(req.headers || {});
  const fullPayload = `${req.method} ${url} ${body} ${headers}`;

  return CONFIG.MALICIOUS_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(fullPayload);
  });
};

const isHoneyEndpoint = (path) =>
  CONFIG.HONEY_ENDPOINTS.some((endpoint) => path.includes(endpoint));

const isWhitelistedPath = (path) =>
  CONFIG.WHITELIST_PATHS.some((p) => path.includes(p));

const recordAttackAttempt = (ip, req) => {
  if (!ipTracker.has(ip)) {
    ipTracker.set(ip, {
      count: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      attempts: [],
      shunned: false,
    });
  }

  const record = ipTracker.get(ip);
  record.count++;
  record.lastSeen = Date.now();
  record.attempts.push({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    userAgent: req.headers['user-agent'],
  });

  logger.warn(`⚠️  Intento detectado - IP: ${ip} (${record.count}/${CONFIG.ATTACK_THRESHOLD})`);

  if (record.count >= CONFIG.ATTACK_THRESHOLD && !record.shunned) {
    record.shunned = true;
    logger.error(`🚫 SHUNNING APLICADO - IP bloqueada: ${ip}`);
  }

  return record;
};

const fakeOkResponse = (res) =>
  res.status(200).json({
    success: true,
    message: 'Solicitud procesada correctamente',
    data: [],
    requestId: Math.random().toString(36).substring(7),
  });

// ─── Middleware principal ────────────────────────────────────────────────────

export const deceptionLayerMiddleware = (req, res, next) => {
  const clientIP = getClientIP(req);
  const isSuspicious = detectMaliciousPattern(req);
  const isHoney = isHoneyEndpoint(req.path);

  // 1. Payload malicioso → shunnear y bloquear siempre, en cualquier ruta
  if (isSuspicious) {
    recordAttackAttempt(clientIP, req);
    logger.warn(`🚨 ATAQUE DETECTADO - tarpitting: ${clientIP}`);
    return fakeOkResponse(res);
  }

  // 2. Honey-endpoint
  if (isHoney) {
    recordAttackAttempt(clientIP, req);
    logger.warn(`🍯 HONEY-ENDPOINT - tarpitting: ${clientIP}`);
    return fakeOkResponse(res);
  }

  // 3. IP bloqueada PERO payload limpio → dejar pasar
  if (ipTracker.has(clientIP) && ipTracker.get(clientIP).shunned) {
    logger.warn(`⚠️ IP shunned con payload limpio - permitiendo: ${clientIP}`);
    return next();
  }

  // 4. Solicitud legítima
  next();
};
// ─── Admin endpoints ─────────────────────────────────────────────────────────

export const getSecurityStats = (req, res) => {
  const stats = {
    trackedIPs: ipTracker.size,
    totalAttempts: Array.from(ipTracker.values()).reduce((sum, r) => sum + r.count, 0),
    shunnedIPs: Array.from(ipTracker.values()).filter((r) => r.shunned).length,
    tracked: ipTracker.size,
    attempts: Array.from(ipTracker.values()).reduce((sum, r) => sum + r.count, 0),
    blocked: Array.from(ipTracker.values()).filter((r) => r.shunned).length,
    details: Array.from(ipTracker.entries()).map(([ip, data]) => ({
      ip,
      attempts: data.count,
      status: data.shunned ? 'BLOCKED' : 'MONITORING',
      firstSeen: new Date(data.firstSeen).toISOString(),
      lastSeen: new Date(data.lastSeen).toISOString(),
      recentAttempts: data.attempts.slice(-5),
    })),
  };

  res.json(stats);
};

export const clearIPRecord = (req, res) => {
  const { ip } = req.params;

  if (ipTracker.has(ip)) {
    ipTracker.delete(ip);
    logger.info(`Registro de IP limpiado manualmente: ${ip}`);
    res.json({ success: true, message: `IP ${ip} eliminada del registro` });
  } else {
    res.status(404).json({ success: false, message: `IP ${ip} no encontrada` });
  }
};

export default deceptionLayerMiddleware;