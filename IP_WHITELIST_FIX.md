# ✅ SOLUCIÓN: IP NO WHITELISTADA EN MONGODB ATLAS

## El problema exacto
Tu IP no está autorizada para acceder a MongoDB Atlas. El backend puede llegar al cluster pero Atlas rechaza la conexión.

## Solución PASO A PASO

### 1. Abre MongoDB Atlas
Ve a: https://cloud.mongodb.com/v2

### 2. Selecciona tu proyecto y cluster
- Busca "cluster-tcalendar"
- Haz clic en él

### 3. Ve a Network Access
En el menú izquierdo → **SECURITY** → **Network Access**

### 4. Verifica si TU IP está en la lista
- Deberías ver una IP en la lista
- Si tu IP es dinámica (cambia), agrega `0.0.0.0/0` (permite todas)

### 5. AGREGAR TU IP ACTUAL
Si no está, haz clic en **+ Add IP Address**

**Opción A: IP específica (Recomendado)**
- Haz clic en **Add Current IP Address**
- Atlas detectará tu IP automáticamente
- Haz clic en **Confirm**

**Opción B: Todas las IPs (Para desarrollo)**
- Haz clic en el campo IP
- Escribe: `0.0.0.0/0`
- Haz clic en **Confirm**

### 6. ESPERA 5-10 SEGUNDOS
MongoDB Atlas necesita actualizar sus servidores. Es importante esperar.

### 7. Reinicia el backend
En la terminal:
```bash
cd C:\Users\teo72\Downloads\tcalendar\backend
npm run dev
```

Deberías ver:
```
✅ MongoDB Atlas connected successfully
Server running on port 5000
```

---

## Si aún no funciona

1. Verifica que estés usando la IP CORRECTA
2. Intenta con `0.0.0.0/0` temporalmente
3. Espera 15-30 segundos después de agregar
4. Reinicia completamente el backend (cierra la terminal)

## Credenciales del backend
```
Usuario: teo72holakase_db_user
Contraseña: Segura2026
Cluster: cluster-tcalendar.diq7tzm.mongodb.net
```

Verifica que coincidan exactamente en MongoDB Atlas.
