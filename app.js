const express = require('express');
const app = express();
const PORT = 3000;

// リバースプロキシ（Vercel, Render, Ngrokなど）を経由する場合、
// 正しい送信元IPを取得するための設定
app.set('trust proxy', true);

app.get('/', async (req, res) => {
    // 1. 訪問者のIPアドレスを取得
    // ※ローカル環境(localhost)でテストすると '::1' や '127.0.0.1' になります。
    let ip = req.ip || req.headers['x-forwarded-for'];

    // ローカルテスト用に、一時的にグローバルIP（例: GoogleのパブリックDNS）を代入して動作確認できます
    // if (ip === '::1' || ip === '127.0.0.1') { ip = '8.8.8.8'; }

    try {
        // 2. 外部API (ip-api.com) を叩いてIPを地理情報に変換
        // ※無料枠ではHTTP通信のみ、かつリクエスト数制限があります
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await response.json();

        // 3. ホスト（サーバー側）のコンソールにログとして出力
        console.log('========== 新しいアクセス ==========');
        console.log(`IPアドレス: ${ip}`);
        
        if (geoData.status === 'success') {
            console.log(`国: ${geoData.country}`);
            console.log(`地域: ${geoData.regionName}`);
            console.log(`都市: ${geoData.city}`);
            console.log(`プロバイダ: ${geoData.isp}`);
        } else {
            console.log('位置情報の取得に失敗しました:', geoData.message);
        }
        console.log('====================================\n');

        // 4. 訪問者には通常のページ（またはレスポンス）を返す
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