# Discord Backup Bot (Türkçe)

Discord sunucunuzun tam yedeklerini almanızı ve yönetmenizi sağlayan gelişmiş bir Discord botudur.

## 🚀 Özellikler

### 📦 Yedekleme Özellikleri
- **`/yedek-al`** komutu ile:
  - Sunucu adı, simgesi, tüm roller (izinler dahil), tüm kanallar (kategori yapısıyla), kanal izinleri alınır.
  - Her bir kullanıcının sahip olduğu roller listelenir (kullanıcının ID'si ile).
  - Yedek .json dosyası olarak saklanır.
  - AES256 şifreleme ile koruma sağlanabilir (isteğe bağlı şifre ile).

### 🔄 Yedek Yükleme Özellikleri
- **`/yedek-yükle id:<yedek_id>`** komutu ile:
  - Belirtilen yedek yüklenir.
  - Eğer yedek logunda kayıtlı kullanıcı hâlâ sunucudaysa, eski rollerini geri alır.
  - Eğer kullanıcı sunucuda değilse, bu durum loglanır.
  - Komutu kullanan kişi ve yükleme zamanı yedek-geçmişi.json içinde saklanır.

- **Modlu Yükleme Sistemi** (`/yedek-yükle id:xxx mod:<seçenek>`):
  - **tam**: Tüm sunucu yapısı ve roller yüklenir.
  - **roller**: Sadece roller ve rollerin izinleri yüklenir.
  - **kanallar**: Sadece kanal yapısı yüklenir.
  - **sade**: Sadece sunucu adı, simge ve temel ayarlar yüklenir.

### 📁 Loglama ve Dosya Sistemi
- **Gelişmiş Loglama**:
  - Her yedek alma ve yükleme işlemine özel loglar tutulur.
  - Tüm loglar zaman damgasıyla beraber kayıt altına alınır.

### 👥 Kullanıcı Rolleri & Yönetimi
- **Otomatik Rol Kurtarma**:
  - Sunucudan ayrılıp geri gelen kullanıcılar otomatik olarak yedekteki rollerini geri alır.

- **Yetki Sınırlandırması** (`/yetki-ayarla` komutu):
  - Belirli komutları sadece belirli roller kullanabilir.

### 🌐 Çoklu Dil Desteği
- **Dil Seçimi Sistemi** (`/ayarlar dil:<dil>`):
  - tr.json, en.json gibi çoklu dil dosyalarıyla çeviri desteği.
  - Komutlar ve bot cevapları otomatik olarak seçilen dile göre gelir.

### 📜 Geçmiş Takibi
- **Yedek Geçmişi** (`/yedek-geçmişi` komutu):
  - Tüm alınan ve yüklenen yedeklerin listesi.
  - Hangi kullanıcı, hangi yedeği, ne zaman aldı/yükledi bilgisiyle birlikte.

### 📤 Yedek Aktarma
- **Yedek Paylaşma** (`/yedek-aktar id:<id> kullanıcı:<@kullanıcı>`):
  - Seçilen yedek .json dosyası olarak başka bir kullanıcıya özel mesajla gönderilir.

## 💻 Kurulum

1. Repoyu klonlayın:
   ```
   git clone https://github.com/kullanici/discord-backup-bot.git
   cd discord-backup-bot
   ```

2. Gerekli paketleri yükleyin:
   ```
   npm install
   ```

3. `.env` dosyasını düzenleyin:
   ```
   TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   GUILD_ID=your_development_server_id_here
   DEFAULT_LANGUAGE=tr
   ENCRYPTION_KEY=your_encryption_key_here
   ```

4. Slash komutlarını güncelleyin:
   ```
   node src/deploy-commands.js
   ```

5. Botu başlatın:
   ```
   npm start
   ```

## 🔐 Güvenlik Notları

- Yedekler şifreyle korunabilir, bu şifrelerin güvenli bir şekilde saklanması sizin sorumluluğunuzdadır.
- Yedeğin içindeki tüm yapılar (roller, kanallar vs.) yedeklendiği için, bot yönetici izinleri gerektirmektedir.
- Yalnızca güvendiğiniz kişilere bot yönetici izni verin.

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın. 