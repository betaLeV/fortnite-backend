const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://ogprojectbeta.onrender.com/callback";

// 1. Redirection vers Discord
app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

// 2. Traitement du retour de Discord
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send("Erreur : Pas de code reçu.");

    try {
        // Échange du code contre un Token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        // Récupération des infos utilisateur
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        const { username, id, avatar } = userRes.data;
        
        // Construction de l'URL de retour vers le Launcher
        const authUrl = `ogproject://auth?user=${encodeURIComponent(username)}&id=${id}&avatar=${avatar}`;

        // Page stylée qui renvoie au Launcher
        res.send(`
            <body style="background:#0a0a0c; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
                <div style="border: 2px solid #5865F2; display:inline-block; padding: 40px; border-radius: 20px; background: #111; box-shadow: 0 0 20px rgba(88, 101, 242, 0.3);">
                    <h1 style="color:#5865F2;">AUTHENTIFICATION RÉUSSIE</h1>
                    <p>Bienvenue, ${username}. Tu peux maintenant fermer cette page.</p>
                    <br>
                    <a href="${authUrl}" style="background:#5865F2; color:white; padding:15px 30px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
                        RETOURNER AU LAUNCHER
                    </a>
                </div>
                <script>
                    // Tentative de redirection automatique après 1 seconde
                    setTimeout(() => { window.location.href = "${authUrl}"; }, 1000);
                </script>
            </body>
        `);
    } catch (e) {
        console.error(e);
        res.status(500).send("Erreur lors de la communication avec Discord.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Auth en ligne sur le port ${PORT}`));
