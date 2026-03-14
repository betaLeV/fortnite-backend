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
    if (!code) return res.send("Erreur : Code Discord manquant.");

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
        const authUrl = `ogproject://auth?user=${encodeURIComponent(username)}&id=${id}`;

        // Page de transition améliorée
        res.send(`
            <body style="background:#0a0a0c; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
                <div style="border: 1px solid #5865F2; display:inline-block; padding: 40px; border-radius: 20px; background: #111;">
                    <h1 style="color:#5865F2;">VÉRIFICATION RÉUSSIE !</h1>
                    <p>Tentative de connexion au Launcher...</p>
                    <br>
                    <a href="${authUrl}" style="background:#5865F2; color:white; padding:15px 30px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
                        CLIQUE ICI SI LE LAUNCHER NE S'OUVRE PAS
                    </a>
                    <p style="margin-top:20px; font-size:12px; opacity:0.5;">Tu peux fermer cette fenêtre après avoir cliqué.</p>
                </div>
                <script>
                    // Tentative d'ouverture automatique
                    window.location.href = "${authUrl}";
                </script>
            </body>
        `);
    } catch (e) { 
        console.error(e);
        res.send("Erreur lors de l'échange de jetons avec Discord."); 
    }
});

app.listen(process.env.PORT || 3000);
