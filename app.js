const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; 

// ★ ここにDiscordで生成したWebhook URLを貼り付ける ★
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/〇〇〇/〇〇〇';

app.set('trust proxy', true);

app.get('/', async (req, res) => {
    // 1. IPアドレスを綺麗に取得する（カンマ区切りの場合は最初の一つだけを取る）
    let rawIp = req.headers['x-forwarded-for'] || req.ip || '';
    let ip = rawIp.split(',')[0].trim(); 

    try {
        // 2. IP情報を取得
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await response.json();

        console.log('========== 新しいアクセス ==========');
        console.log(`抽出したIP: ${ip}`);

        // 3. メッセージの組み立て
        let discordMessage = `🚨 **新しいアクセスを検知しました！**\nIPアドレス: \`${ip}\`\n`;

        if (geoData.status === 'success') {
            discordMessage += `国: ${geoData.country}\n地域: ${geoData.regionName}\n都市: ${geoData.city}\nプロバイダ: ${geoData.isp}`;
            console.log(`地域: ${geoData.regionName}`);
        } else {
            discordMessage += `位置情報の取得に失敗しました: ${geoData.message}`;
            console.log(`取得失敗理由: ${geoData.message}`);
        }
        console.log('====================================');

        // 4. Discordへ送信し、その結果も確認する
        const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: discordMessage })
        });

        // Discordからの返事をログに出す
        if (!discordRes.ok) {
            console.error('❌ Discordへの送信に失敗しました:', discordRes.status, await discordRes.text());
        } else {
            console.log('✅ Discordへ通知を送信しました！\n');
        }

        res.send(`
            <h1>ようこそ！</h1>
            <p>アクセス情報が記録されました。</p>
        `);

    } catch (error) {
        console.error('❌ プログラムの途中でエラーが発生しました:', error.message);
        res.status(500).send('サーバーエラー');
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
