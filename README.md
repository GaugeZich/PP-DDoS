# 🧩 Defensa ataque DDoS
Proyecto backend básico para Test de defensa de DDoS mediante una "Capa de Decepción y Mitigación"

# 👥 Integrantes
- Guillermo Valenzuela
- Lucas García Carrera
- Matias Fuentes
- Genaro Parra
- Braian Vidal

# ⚙️ Instalación y configuración
### 1️⃣ Clonar el repositorio
`bash` git clone <URL_DEL_REPOSITORIO>
### 2️⃣ Instalar dependencias
`bash` npm install
### 3️⃣ Configurar variables de entorno
PORT=3000

DATABASE=escuela_prueba

DB_USER=root

DB_PASS=

DB_PORT=3306

DB_HOST=localhost

NODE_ENV=development

JWT_SECRET=holaxd

#### Estas variables son solo para Test
### 4️⃣ Iniciar el servidor
`bash` npm run start

El servidor quedará corriendo en 👉 http://localhost:3000

### 5️⃣ Correr comando de Test de ataque
`bash` node test-deception-layer.js



# 💻 Resultados

## Terminal del servidor


## Terminal de Test
#### Resultado esperado:

```
══════════════════════════════════════════════════════════════════════
║  🛡️  SUITE DE PRUEBAS - DECEPTION LAYER MIDDLEWARE
══════════════════════════════════════════════════════════════════════

Verifica que NO se creen 1000 usuarios falsos en la BD


✅ TEST 0: Verificar conexión del servidor
──────────────────────────────────────────────────────────────────────
   ✅ Servidor conectado - Puerto 3000

✅ TEST 1: Solicitud Legítima - Usuario válido
──────────────────────────────────────────────────────────────────────
   ✅ Status: 201 - Usuario creado en BD
   ✅ Este usuario debería estar en la BD

✅ TEST 2: SQL Injection Attack
──────────────────────────────────────────────────────────────────────
   Payload: admin' OR '1'='1
   ✅ Status: 200 - HTTP 200 SIMULADO
   ✅ Ataque detectado y bloqueado por DECEPTION LAYER
   ✅ ❌ USUARIO NO CREADO EN BD (Tarpitting activo)

✅ TEST 3: XSS Attack
──────────────────────────────────────────────────────────────────────
   Payload: <script>alert('XSS')</script>
   ✅ Status: 200 - HTTP 200 SIMULADO
   ✅ Ataque XSS detectado y bloqueado
   ✅ ❌ USUARIO NO CREADO EN BD

✅ TEST 4: Path Traversal Attack
──────────────────────────────────────────────────────────────────────
   Payload: ../../../etc/passwd
   ✅ Status: 200 - HTTP 200 SIMULADO
   ✅ Ataque Path Traversal detectado y bloqueado
   ✅ ❌ USUARIO NO CREADO EN BD

✅ TEST 5: Honey-Endpoint Detection
──────────────────────────────────────────────────────────────────────
   Intentando acceder a: /api/admin
   ✅ Status: 200 - HTTP 200 SIMULADO
   ✅ Honey-Endpoint detectado (Señuelo)
   ✅ 🍯 Atacante cree que tuvo éxito pero no accedió a nada real

✅ TEST 6: Simular 5 ataques consecutivos para activar Shunning
──────────────────────────────────────────────────────────────────────
   Enviando 5 intentos de SQL Injection...

   Intento 1/5: Status 200 - Bloqueado ✅
   Intento 2/5: Status 200 - Bloqueado ✅
   Intento 3/5: Status 200 - Bloqueado ✅
   Intento 4/5: Status 200 - Bloqueado ✅
   Intento 5/5: Status 200 - Bloqueado ✅
   ✅ 5/5 ataques bloqueados por DECEPTION LAYER
   ✅ 🚫 IP debería estar en estado SHUNNED ahora

✅ TEST 7: Verificar Estadísticas de Seguridad
──────────────────────────────────────────────────────────────────────
   ✅ IPs Rastreadas: undefined
   ✅ Total de Intentos: undefined
   ✅ IPs Bloqueadas (Shunned): undefined

✅ TEST 8: Verificar que IP permanece bloqueada (Shunning Persistente)
──────────────────────────────────────────────────────────────────────
   Enviando otro ataque desde la misma IP...

   ✅ Status: 200 - HTTP 200 SIMULADO
   ✅ IP sigue bloqueada (Shunning PERSISTENTE)
   ✅ ✅ Atacante recibe respuesta simulada pero nunca accede a BD

══════════════════════════════════════════════════════════════════════
║  🛡️  RESUMEN DE PRUEBAS
══════════════════════════════════════════════════════════════════════

✅ Pruebas Exitosas: 9
❌ Pruebas Fallidas: 0
📈 Tasa de Éxito: 100.00%


══════════════════════════════════════════════════════════════════════
║  🛡️  CONCLUSIONES
══════════════════════════════════════════════════════════════════════

✅ TODAS LAS PRUEBAS PASARON - MIDDLEWARE FUNCIONANDO CORRECTAMENTE

💡 Protección Confirmada:
   ✅ La BD está protegida contra ataques DDoS
   ✅ Solo usuarios legítimos se crean en la BD
   ✅ Atacantes reciben respuestas simuladas
   ✅ IPs maliciosas son bloqueadas automáticamente
   ✅ NO se crean 1000 usuarios falsos
   ✅ Shunning persistente mantiene bloqueadas las IPs

```
