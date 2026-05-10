

import pkg from 'signale';
const { Signale } = pkg;

const logger = new Signale({ scope: 'Deception Layer' });

// Almacenamiento en memoria de IPs maliciosas y sus contadores
const ipTracker = new Map();

/**
 * Configuración de umbrales de detección y mitigación
 */
const CONFIG = {
  // Número de solicitudes sospechosas antes de aplicar shunning
  ATTACK_THRESHOLD: 5,
  
  // Tiempo en milisegundos para limpiar registros de IPs (24 horas)
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000,
  
  // Patrones que indican tráfico malicioso
  MALICIOUS_PATTERNS: [
    /sql|union|select|drop|insert|delete|update|exec|script|attacker/gi,
    /<script|javascript:|onerror|onload|onclick/gi,
    /\.\.|\/\/|\.\.\/|%2e%2e/gi,
    /passwd|shadow|etc\/|admin|root|system32/gi,
  ],
  
  // Rutas que se consideran "honey-endpoints" (señuelos)
  HONEY_ENDPOINTS: [
    '/api/admin',
    '/api/super-secret',
    '/api/database',
    '/api/internal',
    '/backup',
    '/config',
  ],
};

/**
 * Limpiar registros antiguos periódicamente
 */
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

// Iniciar limpieza automática
cleanupOldRecords();

/**
 * Obtener la IP real del cliente (considerando proxies)
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Analizar si la solicitud contiene patrones maliciosos
 */
const detectMaliciousPattern = (req) => {
  const url = req.originalUrl || '';
  const body = JSON.stringify(req.body || {});
  const headers = JSON.stringify(req.headers || {});
  
  const fullPayload = `${req.method} ${url} ${body} ${headers}`;
  
  for (const pattern of CONFIG.MALICIOUS_PATTERNS) {
    if (pattern.test(fullPayload)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Verificar si la ruta es un honey-endpoint (señuelo)
 */
const isHoneyEndpoint = (path) => {
  return CONFIG.HONEY_ENDPOINTS.some(endpoint => path.includes(endpoint));
};

/**
 * Registrar intento de ataque
 */
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
  
  logger.warn(`⚠️ Intento de ataque detectado - IP: ${ip} (${record.count}/${CONFIG.ATTACK_THRESHOLD})`);
  
  // Si alcanza el umbral, aplicar shunning
  if (record.count >= CONFIG.ATTACK_THRESHOLD && !record.shunned) {
    record.shunned = true;
    logger.error(`🚫 SHUNNING APLICADO - IP bloqueada: ${ip}`);
  }
  
  return record;
};

/**
 * Middleware principal de Deception Layer
 */
export const deceptionLayerMiddleware = (req, res, next) => {
  const clientIP = getClientIP(req);
  const isSuspicious = detectMaliciousPattern(req);
  const isHoney = isHoneyEndpoint(req.path);
  
  // Verificar si la IP está ya bloqueada (shunned)
  if (ipTracker.has(clientIP) && ipTracker.get(clientIP).shunned) {
    logger.error(`🚫 IP BLOQUEADA INTENTANDO ACCEDER: ${clientIP}`);
    
    // Devolver respuesta simulada de éxito
    return res.status(200).json({
      success: true,
      message: 'Solicitud procesada correctamente',
      data: [],
      requestId: Math.random().toString(36).substring(7),
    });
  }
  
  
 // Caso 1: Patrón malicioso detectado
if (isSuspicious) {

  const record = recordAttackAttempt(clientIP, req);

  logger.warn(`⚠️ ATAQUE BLOQUEADO AUTOMÁTICAMENTE: ${clientIP}`);

  // RESPUESTA FALSA (TARPITTING)
  return res.status(200).json({
    success: true,
    message: 'Solicitud procesada correctamente',
    data: [],
    requestId: Math.random().toString(36).substring(7),
  });
}
  // Caso 2: Acceso a honey-endpoint (sin ser detectado aún como malicioso)
  if (isHoney && !isSuspicious) {
    const record = recordAttackAttempt(clientIP, req);
    
    // Devolver respuesta simulada
    return res.status(200).json({
      success: true,
      message: 'Solicitud procesada correctamente',
      data: [],
      requestId: Math.random().toString(36).substring(7),
    });
  }
  
  // Caso 3: Solicitud legítima - pasar al siguiente middleware
  next();
};

/**
 * Middleware para obtener estadísticas de seguridad (admin only)
 */
export const getSecurityStats = (req, res) => {
  const stats = {
    trackedIPs: ipTracker.size,
    totalAttempts: Array.from(ipTracker.values()).reduce((sum, record) => sum + record.count, 0),
    shunnedIPs: Array.from(ipTracker.values()).filter(record => record.shunned).length,

    // Compatibilidad con tests
    tracked: ipTracker.size,
    attempts: Array.from(ipTracker.values()).reduce((sum, record) => sum + record.count, 0),
    blocked: Array.from(ipTracker.values()).filter(record => record.shunned).length,

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

/**
 * Limpiar registro de una IP específica (admin only)
 */
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