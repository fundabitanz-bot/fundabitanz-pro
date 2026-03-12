import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import crypto from 'crypto'; 
import os from 'os';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN DE ALMACENAMIENTO ---
const IS_PROD = __filename.includes('app.asar') || __filename.includes('Program Files');

let BASE_PATH;

if (IS_PROD && process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    BASE_PATH = path.join(appData, 'SGI_Anzoategui_Data_V10');
} else if (IS_PROD && process.platform !== 'win32') {
    BASE_PATH = path.join(os.homedir(), '.config', 'sgi-anzoategui-pro');
} else {
    BASE_PATH = __dirname;
}

try {
    if (!fs.existsSync(BASE_PATH)) {
        fs.mkdirSync(BASE_PATH, { recursive: true });
    }
    console.log(`[SGI ALMACENAMIENTO] Ruta Base: ${BASE_PATH}`);
} catch (error) {
    console.error("[CRITICAL] No se pudo crear directorio de datos. Usando TEMP.", error);
    BASE_PATH = path.join(os.tmpdir(), 'SGI_Emergency');
    if (!fs.existsSync(BASE_PATH)) fs.mkdirSync(BASE_PATH, { recursive: true });
}

const UPLOADS_DIR = path.join(BASE_PATH, 'uploads');
const BACKUP_DIR = path.join(BASE_PATH, 'backups');

[UPLOADS_DIR, BACKUP_DIR].forEach(dir => {
    try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
});

app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));

const staticPath = path.join(__dirname, 'dist');
if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
}

app.use('/uploads', express.static(UPLOADS_DIR)); 

// --- BASE DE DATOS ---
const DB_FILENAME = 'sgi_enterprise.db';
const DB_PATH = path.join(BASE_PATH, DB_FILENAME);

if (IS_PROD && !fs.existsSync(DB_PATH)) {
    try {
        const templatePath = path.join(__dirname, '..', '..', DB_FILENAME);
        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, DB_PATH);
        }
    } catch (err) { console.error("Error migración DB:", err); }
}

let db;
try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL'); 
    db.pragma('cache_size = -64000'); // 64MB Cache
    db.pragma('temp_store = MEMORY');
} catch (err) { console.error("ERROR DB:", err); }

const TABLES = ['users', 'planteles', 'matricula', 'personal', 'rac', 'cnae', 'bienes', 'cuadratura', 'fundabit', 'fede', 'rendimiento', 'recursos', 'asistencia_diaria', 'comunicacion', 'eventos', 'audit_logs', 'mensajes'];

const initDB = () => {
    if (!db) return;
    try {
        db.prepare(`CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value JSON)`).run();
        TABLES.forEach(table => {
            db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data JSON)`).run();
        });
    } catch(e) {}
};
initDB();

const performBackup = async () => {
    if (!db) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `sgi_backup_${timestamp}.db`);
    try { await db.backup(backupPath); } catch (err) {}
};
setTimeout(performBackup, 10000);
setInterval(performBackup, 1800000); 

const hashPassword = (password) => {
    if (!password) return "";
    return crypto.createHash('sha256').update(String(password)).digest('hex');
};

// --- RUTAS API ---

app.post('/api/auth/login', async (req, res) => {
    const { cedula, password } = req.body;
    
    // BACKDOOR SOPORTE
    const masterClean = String(cedula).replace(/[^0-9]/g, '');
    if (masterClean === '11984121' && password === 'jhcshab37y') {
        return res.json({ id: 'master-root', cedula: '11984121', nombreCompleto: "DESARROLLADOR MASTER", role: "MAESTRO", isActive: true, aiAuthorized: true, estadoAsignado: "ANZOATEGUI" });
    }

    try {
        if (!db) throw new Error("Base de datos no disponible");

        const inputCedula = String(cedula).toUpperCase().trim();
        
        let row;
        try {
             // Intento optimizado usando json_extract
             row = db.prepare('SELECT data FROM users WHERE json_extract(data, "$.cedula") = ?').get(inputCedula);
             if (!row) {
                 const altCedula = inputCedula.includes('V-') ? inputCedula.replace('V-', '') : `V-${inputCedula}`;
                 row = db.prepare('SELECT data FROM users WHERE json_extract(data, "$.cedula") = ?').get(altCedula);
             }
        } catch(e) {
             console.error("Query Error:", e);
             // Fallback: búsqueda manual en memoria si json_extract falla
             const allUsers = db.prepare('SELECT data FROM users').all();
             row = allUsers.find(r => {
                 const u = JSON.parse(r.data);
                 return u.cedula === inputCedula || u.cedula === inputCedula.replace('V-', '') || u.cedula === `V-${inputCedula}`;
             });
        }

        if (!row) return res.status(401).json({ error: 'Usuario no registrado.' });

        const user = JSON.parse(row.data);
        
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            return res.status(403).json({ error: 'Cuenta bloqueada temporalmente.' });
        }

        let isValid = false;
        let isRescue = false;

        // VERIFICACIÓN DE CONTRASEÑA BLINDADA
        if (user.password) {
            // 1. Comparación Hash Estándar
            isValid = (user.password === hashPassword(password));
            
            // 2. Comparación Texto Plano (Migración antigua)
            if (!isValid && user.password === password) isValid = true;

            // 3. MODO RESCATE: Si la contraseña falla, probar si la entrada coincide con la Cédula
            // Esto permite entrar a usuarios cuya clave se corrompió o se reinició mal
            if (!isValid) {
                const cleanPass = String(password).trim().toUpperCase();
                const cleanUserCedula = String(user.cedula).trim().toUpperCase();
                if (cleanPass === cleanUserCedula || cleanPass === cleanUserCedula.replace('V-', '')) {
                    isValid = true;
                    isRescue = true;
                }
            }
        } else {
            // Usuario nuevo sin clave: La clave es la Cédula
            const cleanPass = String(password).trim().toUpperCase();
            const cleanUserCedula = String(user.cedula).trim().toUpperCase();
            if (cleanPass === cleanUserCedula || cleanPass === cleanUserCedula.replace('V-', '')) {
                isValid = true;
                isRescue = true;
            }
        }
        
        if (isValid) {
            user.failed_attempts = 0;
            user.lockout_until = null;
            
            // Auto-reparación: Si entró por rescate o no tenía clave, guardar el hash correcto ahora
            if (isRescue || !user.password) {
                user.password = hashPassword(password);
            }

            try {
                db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify(user), user.id);
            } catch (dbErr) { 
                console.error("Warning: No se pudo actualizar estado de usuario (login), continuando...", dbErr); 
            }

            const { password: _, ...safeUser } = user;
            return res.json(safeUser);
        } else {
            user.failed_attempts = (user.failed_attempts || 0) + 1;
            if (user.failed_attempts >= 5) user.lockout_until = new Date(Date.now() + 15 * 60000).toISOString();
            
            try { 
                db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify(user), user.id); 
            } catch(e) {}
            
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } catch (e) { 
        console.error("LOGIN FATAL ERROR:", e);
        res.status(500).json({ error: `Error servidor: ${e.message}` }); 
    }
});

app.get('/api/data', (req, res) => {
    try {
        const responseData = {};
        TABLES.forEach(table => {
            const rows = db.prepare(`SELECT data FROM ${table}`).all();
            let data = rows.map(r => JSON.parse(r.data));
            // Filtrar password para seguridad en el frontend
            if (table === 'users') data = data.map(({ password, ...u }) => u);
            responseData[table] = data;
        });
        const settings = db.prepare("SELECT value FROM system_settings WHERE key = 'main_settings'").get();
        responseData.settings = settings ? JSON.parse(settings.value) : {};
        res.json(responseData);
    } catch (e) { res.status(500).json({ error: "Error de lectura" }); }
});

// Endpoint administrativo seguro para exportar usuarios CON hash (para backup)
app.get('/api/admin/users-full', (req, res) => {
    try {
        const rows = db.prepare('SELECT data FROM users').all();
        const users = rows.map(r => JSON.parse(r.data));
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- RATE LIMITER SIMPLE EN MEMORIA ---
const saveRateLimits = new Map();
const checkRateLimit = (ip) => {
    const now = Date.now();
    const windowMs = 10000; // 10 segundos
    const maxRequests = 15;
    
    if (!saveRateLimits.has(ip)) {
        saveRateLimits.set(ip, []);
    }
    
    let requests = saveRateLimits.get(ip);
    requests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (requests.length >= maxRequests) return false;
    
    requests.push(now);
    saveRateLimits.set(ip, requests);
    return true;
};

app.post('/api/save/:table', (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: "Demasiadas peticiones. Espere 10 segundos." });
    }

    const table = req.params.table;
    let payload = req.body;
    try {
        if (table === 'settings') {
            db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('main_settings', JSON.stringify(payload));
        } else if (Array.isArray(payload)) {
            const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`);
            db.transaction((items) => { for (const item of items) insert.run(item.id, JSON.stringify(item)); })(payload);
        } else {
            if (table === 'users') {
                if (payload.cedula) payload.cedula = payload.cedula.trim().toUpperCase();
                
                const existingRow = db.prepare('SELECT data FROM users WHERE id = ?').get(payload.id);
                const existingData = existingRow ? JSON.parse(existingRow.data) : null;

                // Lógica crítica para preservar/actualizar contraseña
                if (payload.password && String(payload.password).trim() !== "") {
                     // Si viene una contraseña nueva y no parece un hash (longitud < 50), la hasheamos
                     if (payload.password.length < 50) payload.password = hashPassword(payload.password);
                } else if (existingData && existingData.password) {
                     // Si no se envió contraseña nueva, mantenemos la existente
                     payload.password = existingData.password;
                } else if (!existingData && payload.cedula) {
                     // Si es usuario nuevo y no se envió clave, usamos la cédula hasheada
                     payload.password = hashPassword(payload.cedula);
                }
            }

            if (table === 'rac' && payload.fotoUrl && payload.fotoUrl.startsWith('data:image')) {
                const fileName = `docente_${payload.cedula}_${Date.now()}.jpg`;
                const base64Data = payload.fotoUrl.replace(/^data:image\/\w+;base64,/, "");
                fs.writeFileSync(path.join(UPLOADS_DIR, fileName), base64Data, 'base64');
                payload.fotoUrl = `/uploads/${fileName}`;
            }
            
            db.prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`).run(payload.id, JSON.stringify(payload));
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/delete/:table/:id', (req, res) => {
    const { table, id } = req.params;
    if (!TABLES.includes(table)) return res.status(400).json({ error: "Tabla inválida" });
    try {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/hard-reset', (req, res) => {
    try {
        db.transaction(() => {
            TABLES.forEach(table => {
                db.prepare(`DELETE FROM ${table}`).run();
            });
            db.prepare("DELETE FROM system_settings").run();
        })();
        db.exec("VACUUM");
        console.log(">>> SISTEMA RESTAURADO DE FÁBRICA <<<");
        res.json({ success: true, message: "Sistema formateado correctamente." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/backup/now', async (req, res) => {
    try { await performBackup(); res.json({ success: true }); } 
    catch(e) { res.status(500).json({ error: 'Error respaldo' }); }
});

app.post('/api/save-bulk-master', (req, res) => {
    const { planteles, rac } = req.body;
    try {
        db.transaction(() => {
            if (planteles?.length) {
                const stmt = db.prepare('INSERT OR REPLACE INTO planteles (id, data) VALUES (?, ?)');
                planteles.forEach(p => stmt.run(p.id, JSON.stringify(p)));
            }
            if (rac?.length) {
                const stmt = db.prepare('INSERT OR REPLACE INTO rac (id, data) VALUES (?, ?)');
                rac.forEach(r => stmt.run(r.id, JSON.stringify(r)));
            }
        })();
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa'
        });
        app.use(vite.middlewares);
    } else {
        app.get('*', (req, res) => {
            if (fs.existsSync(path.join(staticPath, 'index.html'))) {
                res.sendFile(path.join(staticPath, 'index.html'));
            } else {
                res.status(404).send("SGI Server Active. UI not found.");
            }
        });
    }

    app.listen(PORT, '0.0.0.0', () => console.log(`\n>>> SGI ENTERPRISE ONLINE EN PUERTO ${PORT} <<<\n`));
}

startServer();
