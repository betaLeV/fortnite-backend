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
    if (!code) return res.send("Code manquant.");

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        const { username, id } = userRes.data;

        // On renvoie vers le launcher avec le protocole personnalisé
        res.send(`
            <body style="background:#0a0a0c; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
                <h1>Connexion réussie !</h1>
                <p>Tu peux fermer cette page, le launcher va s'actualiser.</p>
                <script>window.location.href = "ogproject://auth?user=${encodeURIComponent(username)}&id=${id}";</script>
            </body>
        `);
    } catch (e) { res.send("Erreur auth Discord."); }
});

app.listen(process.env.PORT || 3000);
