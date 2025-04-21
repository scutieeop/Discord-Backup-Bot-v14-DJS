import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up the localization system
 * @param {Client} client - The discord.js client
 */
export function setupLocales(client) {
  const localesPath = path.join(__dirname, '..', 'locales');
  
  // Create the locales directory if it doesn't exist
  if (!fs.existsSync(localesPath)) {
    fs.mkdirSync(localesPath, { recursive: true });
  }
  
  // Create default locales if they don't exist
  createDefaultLocaleFiles(localesPath);
  
  // Load all locale files
  const localeFiles = fs.readdirSync(localesPath).filter(file => file.endsWith('.json'));
  
  for (const file of localeFiles) {
    const localeName = file.split('.')[0];
    const localePath = path.join(localesPath, file);
    const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    
    client.locales.set(localeName, localeData);
    console.log(`[✓] Dil dosyası yüklendi: ${localeName}`);
  }
}

/**
 * Creates default locale files if they don't exist
 * @param {string} localesPath - Path to locales directory
 */
function createDefaultLocaleFiles(localesPath) {
  const defaultLocales = {
    'tr': {
      "general": {
        "bot_name": "Discord Backup Bot",
        "success": "Başarılı",
        "error": "Hata",
        "warning": "Uyarı",
        "info": "Bilgi",
        "loading": "Yükleniyor...",
        "not_found": "Bulunamadı",
        "unauthorized": "Yetkisiz",
        "completed": "Tamamlandı"
      },
      "commands": {
        "backup": {
          "name": "yedek-al",
          "description": "Sunucunun tam yedeğini alır",
          "options": {
            "password": "Yedek için şifre (isteğe bağlı)"
          },
          "responses": {
            "started": "Yedekleme işlemi başlatıldı...",
            "completed": "Yedekleme tamamlandı! Yedek ID: {id}",
            "error": "Yedekleme sırasında bir hata oluştu: {error}"
          }
        },
        "load": {
          "name": "yedek-yükle",
          "description": "Belirtilen yedeği sunucuya yükler",
          "options": {
            "id": "Yedek ID",
            "password": "Yedek şifresi (gerekirse)",
            "mode": "Yükleme modu (tam, roller, kanallar, sade)"
          },
          "responses": {
            "started": "{mode} modunda yedek yükleme işlemi başlatıldı...",
            "completed": "Yedek yükleme işlemi tamamlandı!",
            "error": "Yedek yükleme sırasında bir hata oluştu: {error}",
            "not_found": "Belirtilen ID'ye sahip yedek bulunamadı",
            "wrong_password": "Yanlış şifre girdiniz"
          }
        },
        "history": {
          "name": "yedek-geçmişi",
          "description": "Tüm yedeklerin geçmişini gösterir",
          "responses": {
            "no_backups": "Henüz yedek alınmamış",
            "history_title": "Yedek Geçmişi",
            "backup_info": "ID: {id} | Tarih: {date} | Kullanıcı: {user}"
          }
        },
        "share": {
          "name": "yedek-aktar",
          "description": "Bir yedeği başka bir kullanıcıya aktarır",
          "options": {
            "id": "Yedek ID",
            "user": "Aktarılacak kullanıcı"
          },
          "responses": {
            "sent": "Yedek {user} kullanıcısına başarıyla gönderildi",
            "error": "Yedek gönderilirken bir hata oluştu: {error}",
            "not_found": "Belirtilen ID'ye sahip yedek bulunamadı"
          }
        },
        "permission": {
          "name": "yetki-ayarla",
          "description": "Komut yetki ayarlarını yapılandırır",
          "options": {
            "command": "Komut adı",
            "role": "Yetkili rol"
          },
          "responses": {
            "set": "{command} komutu için {role} rolü yetkilendirildi",
            "error": "Yetki ayarlanırken bir hata oluştu: {error}"
          }
        },
        "settings": {
          "name": "ayarlar",
          "description": "Bot ayarlarını yapılandırır",
          "options": {
            "language": "Bot dili (tr, en)"
          },
          "responses": {
            "language_changed": "Bot dili {language} olarak değiştirildi",
            "error": "Ayarlar değiştirilirken bir hata oluştu: {error}"
          }
        }
      },
      "logs": {
        "backup_created": "Yedek oluşturuldu: {id} | Kullanıcı: {user}",
        "backup_loaded": "Yedek yüklendi: {id} | Kullanıcı: {user} | Mod: {mode}",
        "missing_users": "Yedekte olan ancak sunucuda olmayan kullanıcılar: {users}",
        "roles_restored": "Kullanıcı rolleri geri yüklendi: {user}",
        "permission_set": "Komut yetkisi ayarlandı: {command} -> {role}"
      }
    },
    'en': {
      "general": {
        "bot_name": "Discord Backup Bot",
        "success": "Success",
        "error": "Error",
        "warning": "Warning",
        "info": "Info",
        "loading": "Loading...",
        "not_found": "Not Found",
        "unauthorized": "Unauthorized",
        "completed": "Completed"
      },
      "commands": {
        "backup": {
          "name": "backup",
          "description": "Creates a full backup of the server",
          "options": {
            "password": "Password for the backup (optional)"
          },
          "responses": {
            "started": "Backup process started...",
            "completed": "Backup completed! Backup ID: {id}",
            "error": "An error occurred during backup: {error}"
          }
        },
        "load": {
          "name": "load-backup",
          "description": "Loads the specified backup to the server",
          "options": {
            "id": "Backup ID",
            "password": "Backup password (if required)",
            "mode": "Loading mode (full, roles, channels, basic)"
          },
          "responses": {
            "started": "Backup loading started in {mode} mode...",
            "completed": "Backup loading process completed!",
            "error": "An error occurred while loading the backup: {error}",
            "not_found": "Backup with the specified ID not found",
            "wrong_password": "You entered the wrong password"
          }
        },
        "history": {
          "name": "backup-history",
          "description": "Shows the history of all backups",
          "responses": {
            "no_backups": "No backups taken yet",
            "history_title": "Backup History",
            "backup_info": "ID: {id} | Date: {date} | User: {user}"
          }
        },
        "share": {
          "name": "share-backup",
          "description": "Shares a backup with another user",
          "options": {
            "id": "Backup ID",
            "user": "User to share with"
          },
          "responses": {
            "sent": "Backup successfully sent to {user}",
            "error": "An error occurred while sending the backup: {error}",
            "not_found": "Backup with the specified ID not found"
          }
        },
        "permission": {
          "name": "set-permission",
          "description": "Configures command permission settings",
          "options": {
            "command": "Command name",
            "role": "Authorized role"
          },
          "responses": {
            "set": "Role {role} authorized for command {command}",
            "error": "An error occurred while setting permissions: {error}"
          }
        },
        "settings": {
          "name": "settings",
          "description": "Configures bot settings",
          "options": {
            "language": "Bot language (tr, en)"
          },
          "responses": {
            "language_changed": "Bot language changed to {language}",
            "error": "An error occurred while changing settings: {error}"
          }
        }
      },
      "logs": {
        "backup_created": "Backup created: {id} | User: {user}",
        "backup_loaded": "Backup loaded: {id} | User: {user} | Mode: {mode}",
        "missing_users": "Users in backup but not in server: {users}",
        "roles_restored": "User roles restored: {user}",
        "permission_set": "Command permission set: {command} -> {role}"
      }
    }
  };
  
  for (const [locale, data] of Object.entries(defaultLocales)) {
    const localePath = path.join(localesPath, `${locale}.json`);
    
    if (!fs.existsSync(localePath)) {
      fs.writeFileSync(localePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[✓] Varsayılan dil dosyası oluşturuldu: ${locale}`);
    }
  }
}

/**
 * Gets a localized string
 * @param {Client} client - The discord.js client
 * @param {string} language - The language code
 * @param {string} key - The localization key (dot notation)
 * @param {Object} replacements - Object with values to replace in the string
 * @returns {string} The localized string
 */
export function getLocaleString(client, language, key, replacements = {}) {
  // Use default language if provided language is not available
  if (!client.locales.has(language)) {
    language = process.env.DEFAULT_LANGUAGE || 'tr';
  }
  
  const locale = client.locales.get(language);
  
  // Get the nested key value
  const keys = key.split('.');
  let value = locale;
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return the key if not found
    }
  }
  
  // Replace placeholders with values
  if (typeof value === 'string') {
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      value = value.replace(new RegExp(`{${placeholder}}`, 'g'), replacement);
    }
  }
  
  return value;
} 