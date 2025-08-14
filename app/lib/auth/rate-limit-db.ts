/**
 * Rate limit system using PostgreSQL
 * Replaces in-memory storage with database persistence
 */
import { sql } from '@vercel/postgres';

export interface RateLimitInfo {
  count: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpires?: number;
  temporalBlocksCount: number;
  permanentlyBlocked: boolean;
}

// Configuration differentiated by type
const CONFIG = {
  email: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutes
    MAX_TEMPORAL_BLOCKS: 3
  },
  ip: {
    MAX_ATTEMPTS: 10,
    WINDOW_MS: 1 * 60 * 60 * 1000, // 1 hour
    BLOCK_DURATION_MS: 3 * 24 * 60 * 60 * 1000, // 3 days
    MAX_TEMPORAL_BLOCKS: 3
  }
};

// Get configuration based on type
function getConfig(identifier: string) {
  const type = identifier.startsWith('email:') ? 'email' : 'ip';
  return CONFIG[type];
}

// Get the real client IP, taking into account possible proxies
export function getClientIp(req: any): string {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
    return ips[0] || 'unknown';
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// Get rate limit information from the database
export async function getRateLimitInfo(identifier: string): Promise<RateLimitInfo> {
  const now = Date.now();
  
  try {
    // Search for the record in the database
    const result = await sql`
      SELECT * FROM security_blocks 
      WHERE identifier = ${identifier}
    `;

    if (result.rows.length === 0) {
      // If no record exists, create a new one
      return {
        count: 0,
        lastAttempt: now,
        blocked: false,
        temporalBlocksCount: 0,
        permanentlyBlocked: false
      };
    }

    const record = result.rows[0];
    
    // Convert timestamps to numbers with explicit timezone handling
    const lastAttempt = new Date(record.last_attempt).getTime();
    const blockExpires = record.block_expires ? new Date(record.block_expires).getTime() : undefined;
    
    const info: RateLimitInfo = {
      count: record.count,
      lastAttempt,
      blocked: record.blocked,
      blockExpires,
      temporalBlocksCount: record.temporal_blocks_count,
      permanentlyBlocked: record.permanently_blocked
    };

    // If it is permanently blocked, it is blocked
    if (info.permanentlyBlocked) {
      return info;
    }

    // If it has expired the time window and it is not blocked, reset counter
    const config = getConfig(identifier);
    if (now - info.lastAttempt > config.WINDOW_MS && !info.blocked) {
      info.count = 0;
      info.lastAttempt = now;
    }

    // Verify if the temporary block has expired
    if (info.blocked && info.blockExpires && now > info.blockExpires) {
      info.blocked = false;
      info.count = 0;
      info.lastAttempt = now;
      
      // Update in the database
      await sql`
        UPDATE security_blocks 
        SET blocked = false, count = 0, last_attempt = ${new Date(now).toISOString()}, updated_at = CURRENT_TIMESTAMP
        WHERE identifier = ${identifier}
      `;
    }

    return info;

  } catch (error) {
    console.error('Error getting rate limit information:', error);
    // In case of error, return default values
    return {
      count: 0,
      lastAttempt: now,
      blocked: false,
      temporalBlocksCount: 0,
      permanentlyBlocked: false
    };
  }
}

// Increment failed attempts counter
export async function incrementRateLimit(identifier: string): Promise<RateLimitInfo> {
  const now = Date.now();
  const config = getConfig(identifier);
  
  try {
    // Get current information
    const info = await getRateLimitInfo(identifier);
    
    // If it is blocked, do not increment
    if (info.blocked || info.permanentlyBlocked) {
      return info;
    }
    
    const newCount = info.count + 1;
    
    // Verify if it should be blocked
    if (newCount >= config.MAX_ATTEMPTS) {
      const temporalBlocksCount = info.temporalBlocksCount + 1;
      
      // Verify if it should be permanently blocked
      if (temporalBlocksCount >= config.MAX_TEMPORAL_BLOCKS) {
        // Permanent block
        await sql`
          UPDATE security_blocks
          SET count = ${newCount},
              last_attempt = to_timestamp(${now / 1000}),
              blocked = true,
              block_expires = to_timestamp(${(now + config.BLOCK_DURATION_MS) / 1000}),
              temporal_blocks_count = ${temporalBlocksCount},
              permanently_blocked = true,
              updated_at = CURRENT_TIMESTAMP
          WHERE identifier = ${identifier}
        `;
        
        return {
          count: newCount,
          lastAttempt: now,
          blocked: true,
          blockExpires: now + config.BLOCK_DURATION_MS,
          temporalBlocksCount,
          permanentlyBlocked: true
        };
      } else {
        // Temporary block
        const blockExpires = now + config.BLOCK_DURATION_MS;
        
        await sql`
          UPDATE security_blocks
          SET count = ${newCount},
              last_attempt = to_timestamp(${now / 1000}),
              blocked = true,
              block_expires = to_timestamp(${blockExpires / 1000}),
              temporal_blocks_count = ${temporalBlocksCount},
              updated_at = CURRENT_TIMESTAMP
          WHERE identifier = ${identifier}
        `;
        
        return {
          count: newCount,
          lastAttempt: now,
          blocked: true,
          blockExpires,
          temporalBlocksCount,
          permanentlyBlocked: false
        };
      }
    } else {
      // Update counter
      await sql`
        UPDATE security_blocks
        SET count = ${newCount},
            last_attempt = to_timestamp(${now / 1000}),
            updated_at = CURRENT_TIMESTAMP
        WHERE identifier = ${identifier}
      `;
      
      return {
        count: newCount,
        lastAttempt: now,
        blocked: info.blocked,
        blockExpires: info.blockExpires,
        temporalBlocksCount: info.temporalBlocksCount,
        permanentlyBlocked: info.permanentlyBlocked
      };
    }
  } catch (error) {
    console.error('Error actualizando rate limit en BD:', error);
    // En caso de error, devolver información básica
    return {
      count: 0,
      lastAttempt: now,
      blocked: false,
      temporalBlocksCount: 0,
      permanentlyBlocked: false
    };
  }
}

// Resetear contador de intentos (login exitoso)
export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const info = await getRateLimitInfo(identifier);
    
    // No resetear si está bloqueado permanentemente
    if (info.permanentlyBlocked) {
      return;
    }

    const type = identifier.startsWith('email:') ? 'email' : 'ip';

    await sql`
      INSERT INTO security_blocks (
        identifier, type, count, last_attempt, blocked, block_expires,
        temporal_blocks_count, permanently_blocked, created_at, updated_at
      ) VALUES (
        ${identifier}, ${type}, 0, ${new Date().toISOString()}, false, null,
        ${info.temporalBlocksCount}, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (identifier) DO UPDATE SET
        count = 0,
        last_attempt = ${new Date().toISOString()},
        blocked = false,
        block_expires = null,
        permanently_blocked = false,
        updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {
    console.error('Error reseteando rate limit:', error);
  }
}

// Verify if it is blocked
export async function isRateLimited(identifier: string): Promise<boolean> {
  const info = await getRateLimitInfo(identifier);
  
  // If it is permanently blocked, it is blocked
  if (info.permanentlyBlocked) {
    console.log(`🔒 ${identifier} está permanentemente bloqueado`);
    return true;
  }
  
  // If it is blocked temporarily, check if it has expired
  if (info.blocked && info.blockExpires) {
    const now = Date.now();
    
    // If the block has expired, automatically unlock it
    if (now > info.blockExpires) {
      console.log(`🔓 Bloqueo expirado para ${identifier}, desbloqueando automáticamente`);
      
      try {
        await sql`
          UPDATE security_blocks 
          SET blocked = false, 
              block_expires = null,
              updated_at = CURRENT_TIMESTAMP
          WHERE identifier = ${identifier}
        `;
        
        console.log(`✅ ${identifier} desbloqueado exitosamente`);
        return false; // It is not blocked
      } catch (error) {
        console.error('Error desbloqueando automáticamente:', error);
        return true; // In case of error, keep blocked for security
      }
    }
    
    console.log(`🔒 ${identifier} aún está bloqueado (no ha expirado)`);
    return true; // It is blocked
  }
  return false; // It is not blocked
}

// ========== ADMINISTRATION FUNCTIONS ==========

// Get all rate limit records
export async function getAllRateLimitRecords(): Promise<Array<{identifier: string, info: RateLimitInfo}>> {
  try {
    const result = await sql`
      SELECT * FROM security_blocks 
      ORDER BY last_attempt DESC
    `;

    return result.rows.map(record => ({
      identifier: record.identifier,
      info: {
        count: record.count,
        lastAttempt: new Date(record.last_attempt).getTime(),
        blocked: record.blocked,
        blockExpires: record.block_expires ? new Date(record.block_expires).getTime() : undefined,
        temporalBlocksCount: record.temporal_blocks_count,
        permanentlyBlocked: record.permanently_blocked
      }
    }));
  } catch (error) {
    console.error('Error obteniendo registros de seguridad:', error);
    return [];
  }
}

// Get general statistics
export async function getSecurityStats() {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE blocked = true OR permanently_blocked = true) as active_blocks,
        COUNT(*) FILTER (WHERE permanently_blocked = true) as permanent_blocks,
        COUNT(*) FILTER (WHERE blocked = true AND permanently_blocked = false) as temporal_blocks,
        COUNT(*) FILTER (WHERE last_attempt > NOW() - INTERVAL '24 hours') as recent_attempts,
        COUNT(*) FILTER (WHERE type = 'email') as email_blocks,
        COUNT(*) FILTER (WHERE type = 'ip') as ip_blocks
      FROM security_blocks
    `;

    const stats = result.rows[0];
    
    return {
      totalRecords: parseInt(stats.total_records),
      activeBlocks: parseInt(stats.active_blocks),
      permanentBlocks: parseInt(stats.permanent_blocks),
      temporalBlocks: parseInt(stats.temporal_blocks),
      recentAttempts: parseInt(stats.recent_attempts),
      emailBlocks: parseInt(stats.email_blocks),
      ipBlocks: parseInt(stats.ip_blocks)
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalRecords: 0,
      activeBlocks: 0,
      permanentBlocks: 0,
      temporalBlocks: 0,
      recentAttempts: 0,
      emailBlocks: 0,
      ipBlocks: 0
    };
  }
}

// Unblock manually an identifier
export async function manualUnblock(identifier: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE security_blocks 
      SET count = 0, blocked = false, block_expires = null, 
          permanently_blocked = false, updated_at = CURRENT_TIMESTAMP
      WHERE identifier = ${identifier}
    `;
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error desbloqueando:', error);
    return false;
  }
}

// Block manually an identifier
export async function manualBlock(identifier: string, permanent: boolean = false): Promise<void> {
  try {
    const type = identifier.startsWith('email:') ? 'email' : 'ip';
    const now = new Date();
    const blockExpires = permanent ? null : new Date(Date.now() + CONFIG[type].BLOCK_DURATION_MS);

    await sql`
      INSERT INTO security_blocks (
        identifier, type, count, last_attempt, blocked, block_expires,
        temporal_blocks_count, permanently_blocked, created_at, updated_at
      ) VALUES (
        ${identifier}, ${type}, ${CONFIG[type].MAX_ATTEMPTS}, ${now.toISOString()}, true, ${blockExpires?.toISOString() ?? null},
        1, ${permanent}, ${now.toISOString()}, ${now.toISOString()}
      )
      ON CONFLICT (identifier) DO UPDATE SET
        count = ${CONFIG[type].MAX_ATTEMPTS},
        last_attempt = ${now.toISOString()},
        blocked = true,
        block_expires = ${blockExpires?.toISOString() ?? null},
        permanently_blocked = ${permanent},
        updated_at = ${now.toISOString()}
    `;
  } catch (error) {
    console.error('Error bloqueando manualmente:', error);
  }
}

// Delete completely a record
export async function deleteRecord(identifier: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM security_blocks 
      WHERE identifier = ${identifier}
    `;    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error eliminando registro:', error);
    return false;
  }
}

// Delete old records (more than 7 days without activity)
export async function cleanupOldRecords() {
  try {
    // Use the longest duration between email and IP for cleanup
    const maxBlockDuration = Math.max(CONFIG.email.BLOCK_DURATION_MS, CONFIG.ip.BLOCK_DURATION_MS);
    
    const result = await sql`
      DELETE FROM security_blocks 
      WHERE created_at < NOW() - INTERVAL '7 days'
      AND blocked = false 
      AND permanently_blocked = false
      AND last_attempt < NOW() - INTERVAL '${maxBlockDuration / 1000} seconds'
    `;
    
    console.log(`🧹 Limpieza completada: ${result.rowCount} registros eliminados`);
    return result.rowCount;
  } catch (error) {
    console.error('Error en limpieza de registros:', error);
    return 0;
  }
}
