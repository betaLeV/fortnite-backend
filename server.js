const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://ogprojectbeta.onrender.com/callback";

app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send("Erreur : Pas de code reçu.");

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        const { username, id, avatar } = userRes.data;
        const authUrl = `ogproject://auth?user=${encodeURIComponent(username)}&id=${id}&avatar=${avatar}`;

        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { background: #0a0a0c; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { text-align: center; background: rgba(255, 255, 255, 0.03); padding: 50px; border-radius: 24px; border: 1px solid #5865F2; backdrop-filter: blur(10px); }
                    .avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #5865F2; margin-bottom: 20px; }
                    .btn { background: #5865F2; color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: bold; display: inline-block; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <img class="avatar" src="https://cdn.discordapp.com/avatars/${id}/${avatar}.png">
                    <h1>SALUT, ${username}</h1>
                    <p>Connexion réussie ! Redirection vers le launcher...</p>
                    <a href="${authUrl}" class="btn">RETOURNER AU JEU</a>
                </div>
                <script>setTimeout(() => { window.location.href = "${authUrl}"; }, 1500);</script>
            </body>
            </html>
        `);
    } catch (e) { res.status(500).send("Erreur Discord."); }
});

// Route pour le statut et les news
app.get('/api/launcher-info', (req, res) => {
    res.json({
        status: "ONLINE", // Change en "MAINTENANCE" pour couper l'accès
        news: [
            { title: "AVIONS X-4", img: "avion.webp" },
            { title: "BIOME NEIGE", img: "neige.wepb" },
            { title: "BOUTIQUE", img: "skins.jpg" }
        ],
        version: "1.0.0" // Utile pour l'auto-updater plus tard
    });
});

app.listen(process.env.PORT || 3000);
