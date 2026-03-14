const express = require('express');
const axios = require('axios');
const app = express();

// Ces valeurs seront lues depuis les variables d'environnement sur Render
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send("Erreur de connexion.");

    try {
        // Échange du code contre un Token Discord
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        // Récupération du profil Discord
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        const { username, id, avatar } = userRes.data;

        // Page de redirection vers le Launcher
        res.send(`
            <body style="background:#0a0a0c; color:white; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;">
                <img src="https://cdn.discordapp.com/avatars/${id}/${avatar}.png" style="border-radius:50%; width:100px; border:3px solid #5865F2;">
                <h1>Bonjour, ${username} !</h1>
                <p>Connexion réussie. Retourne sur le Launcher.</p>
                <a href="ogproject://auth?user=${encodeURIComponent(username)}&id=${id}" 
                   style="background:#5865F2; color:white; padding:15px 30px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:20px;">
                   OUVRIR LE LAUNCHER
                </a>
                <script>
                    setTimeout(() => {
                        window.location.href = "ogproject://auth?user=${encodeURIComponent(username)}&id=${id}";
                    }, 2500);
                </script>
            </body>
        `);
    } catch (e) {
        console.error(e);
        res.send("Une erreur est survenue lors de l'authentification.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
