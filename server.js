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

        // PAGE DE CONNEXION STYLÉE
        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Authentification réussie</title>
                <style>
                    body {
                        background: #0a0a0c;
                        color: white;
                        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        overflow: hidden;
                    }
                    .container {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.03);
                        padding: 60px;
                        border-radius: 24px;
                        border: 1px solid rgba(88, 101, 242, 0.4);
                        box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(88, 101, 242, 0.1);
                        backdrop-filter: blur(10px);
                        max-width: 400px;
                        animation: fadeIn 0.8s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .avatar {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        border: 4px solid #5865F2;
                        margin-bottom: 20px;
                        box-shadow: 0 0 20px rgba(88, 101, 242, 0.5);
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 10px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        font-weight: 900;
                    }
                    p {
                        opacity: 0.6;
                        margin-bottom: 30px;
                        font-size: 14px;
                    }
                    .btn {
                        background: #5865F2;
                        color: white;
                        text-decoration: none;
                        padding: 16px 32px;
                        border-radius: 12px;
                        font-weight: bold;
                        display: inline-block;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .btn:hover {
                        background: #4752c4;
                        transform: scale(1.05);
                        box-shadow: 0 6px 20px rgba(88, 101, 242, 0.6);
                    }
                    .loader {
                        width: 20px;
                        height: 20px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid white;
                        border-radius: 50%;
                        display: inline-block;
                        margin-right: 10px;
                        animation: spin 1s linear infinite;
                        vertical-align: middle;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img class="avatar" src="https://cdn.discordapp.com/avatars/${id}/${avatar}.png" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                    <h1>BIENVENUE, ${username}</h1>
                    <p>Authentification réussie !<br>Redirection vers le launcher en cours...</p>
                    <a href="${authUrl}" class="btn">
                        <span class="loader"></span> Retourner au Jeu
                    </a>
                </div>
                <script>
                    // Redirection automatique plus rapide
                    setTimeout(() => { window.location.href = "${authUrl}"; }, 1500);
                </script>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send("Erreur Discord.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Serveur sur port \${PORT}\`));
