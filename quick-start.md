# Discord Backup Bot - Hızlı Başlangıç Kılavuzu

Bu kılavuz, Discord Backup Bot'u hızlıca kurup çalıştırmanıza yardımcı olacaktır.

## Ön Gereksinimler

- [Node.js](https://nodejs.org/) (v16.9.0 veya daha yüksek)
- [npm](https://www.npmjs.com/) (Node.js ile birlikte gelir)
- Bir Discord botu (Discord Developer Portal üzerinden oluşturulmuş)

## Adım 1: Discord Botunuzu Oluşturun

1. [Discord Developer Portal](https://discord.com/developers/applications)'ına gidin ve oturum açın.
2. "New Application" butonuna tıklayın.
3. Botunuz için bir isim girin ve "Create" butonuna tıklayın.
4. Sol menüden "Bot" sekmesine tıklayın ve "Add Bot" butonuna tıklayın.
5. "MESSAGE CONTENT INTENT" seçeneğini aktif hale getirin.
6. Bot tokeninizi kopyalayın (Reset Token'a tıklayarak yeni bir token alabilirsiniz).
7. "OAuth2" > "URL Generator" bölümüne gidin.
8. "Scopes" altında "bot" ve "applications.commands" seçeneklerini işaretleyin.
9. "Bot Permissions" altında "Administrator" seçeneğini işaretleyin (bot yedekleme için tam yetkiye ihtiyaç duyar).
10. Oluşturulan URL'yi kullanarak botu sunucunuza ekleyin.

## Adım 2: Bot Kodunu Hazırlayın

1. Bu repoyu bilgisayarınıza klonlayın:
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
   TOKEN=your_bot_token_here
   CLIENT_ID=your_application_id_here
   GUILD_ID=your_server_id_here
   DEFAULT_LANGUAGE=tr
   ENCRYPTION_KEY=your_encryption_key_here
   ```

   - `TOKEN`: Discord Developer Portal'dan aldığınız bot tokeni
   - `CLIENT_ID`: Discord Developer Portal'daki uygulama ID'si
   - `GUILD_ID`: Botunuzu test edeceğiniz Discord sunucusunun ID'si
   - `DEFAULT_LANGUAGE`: Varsayılan dil (tr veya en)
   - `ENCRYPTION_KEY`: Şifreli yedekler için kullanılacak anahtar (rastgele karakter dizisi olabilir)

## Adım 3: Slash Komutlarını Kaydedin

```
node src/deploy-commands.js
```

Bu komut, botunuzun slash komutlarını Discord'a kaydeder. Eğer başarılı olursa, kaç komutun kaydedildiğine dair bir çıktı alacaksınız.

## Adım 4: Botu Başlatın

```
npm start
```

Botunuz artık aktif! Discord sunucunuzda aşağıdaki slash komutlarını kullanabilirsiniz:

- `/yedek-al`: Sunucunun tam yedeğini alır
- `/yedek-yükle`: Belirtilen yedeği sunucuya yükler
- `/yedek-geçmişi`: Tüm yedeklerin geçmişini gösterir
- `/yedek-aktar`: Bir yedeği başka bir kullanıcıya aktarır
- `/yetki-ayarla`: Komut yetki ayarlarını yapılandırır
- `/ayarlar`: Bot ayarlarını yapılandırır

## Sorun Giderme

- **Slash komutları gözükmüyor**: Bot'u tekrar davet edin ve "applications.commands" iznininin seçili olduğundan emin olun.
- **"Cannot find module" hatası**: Terminalde `npm install` komutunu çalıştırarak tüm bağımlılıkların kurulu olduğundan emin olun.
- **"401: Unauthorized" hatası**: `.env` dosyasındaki TOKEN değerinin doğru olduğundan emin olun.
- **Bot cevap vermiyor**: Botun gerekli izinlere sahip olduğundan ve `.env` dosyasındaki tüm değerlerin doğru olduğundan emin olun.

## İpuçları

- İlk kurulumda, global komutlar yerine tek bir sunucuda komut oluşturmak için `GUILD_ID` değerini `.env` dosyasına eklemeniz önerilir. Bu, komut güncellemelerinin daha hızlı yansımasını sağlar.
- Global komutlar için `GUILD_ID` değerini `.env` dosyasından kaldırabilirsiniz, ancak komut güncellemeleri tüm Discord sunucularına yayılması 1 saate kadar sürebilir.
- Yedeklerinizi güvenli bir yerde saklamayı unutmayın. Önemli yedekler için şifreleme kullanmanız önerilir. 