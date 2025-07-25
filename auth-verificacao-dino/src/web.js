// Importa as bibliotecas necessárias
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

// IMPORTANTE: Garanta que este arquivo existe e tem as chaves corretas!
const config = require('../config.json');

const app = express();
const port = process.env.PORT || 3000;

// Função para gerar uma página de resposta HTML estilizada
const generateResponsePage = (title, message, isSuccess = true) => {
    const iconColor = isSuccess ? '#00ff87' : '#ED4245';
    const icon = isSuccess 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    return `
    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} - Infinity</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Poppins', sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;
            background-image: url('https://cdn.discordapp.com/attachments/1398298075134431324/1398406540486250588/leblanck_store_230.psd.jpg?ex=68853f14&is=6883ed94&hm=cca85c52d5e7a125f0cfbc40ccdfb11ca5cce029a9e9942ae85aefa939499d84&');
            background-size: cover; background-position: center; }
        body::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); z-index: 1; }
        .response-container { position: relative; z-index: 2; background: rgba(26, 28, 30, 0.75); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            padding: 40px 50px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.125); text-align: center; max-width: 450px; width: 90%; }
        .icon { margin-bottom: 20px; } h1 { color: #FFFFFF; font-size: 2em; margin: 0 0 10px; } p { color: #DCDEE1; font-size: 1.1em; margin-bottom: 0; }
    </style></head><body><div class="response-container"><div class="icon">${icon}</div><h1>${title}</h1><p>${message}</p></div></body></html>`;
};

// Serve os arquivos da pasta 'public' (nosso index.html)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota que redireciona para a página de login do Discord
app.get('/login', (req, res) => {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=identify%20guilds.join`;
    res.redirect(authUrl);
});

// Rota de callback que o Discord chama
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send(generateResponsePage('Erro', 'Código de autorização não fornecido.', false));
    }

    try {
        // Troca o código por um token de acesso
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri,
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            console.error('Erro ao obter token:', tokenData);
            return res.send(generateResponsePage('Erro de Autenticação', 'Não foi possível obter o token de acesso. Verifique as configurações e tente novamente.', false));
        }

        // Pega as informações do usuário
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();

        // Adiciona o usuário ao servidor
        const guildAddResponse = await fetch(`https://discord.com/api/guilds/${config.guildId}/members/${userData.id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bot ${config.botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ access_token: tokenData.access_token }),
        });

        if (guildAddResponse.status === 201 || guildAddResponse.status === 204) {
            res.send(generateResponsePage('Tudo Certo!', `Bem-vindo(a), ${userData.username}! Sua verificação foi concluída.`, true));
        } else {
            const errorData = await guildAddResponse.json();
            console.error('Erro ao adicionar membro:', errorData);
            res.send(generateResponsePage('Ops!', 'Não conseguimos te adicionar. É provável que você já seja um membro.', false));
        }

    } catch (err) {
        console.error('Erro no processo de callback:', err);
        res.status(500).send(generateResponsePage('Erro Interno', 'Ocorreu um problema em nosso sistema. Tente novamente.', false));
    }
});

app.listen(port, () => {
    console.log(`[INFO] Servidor web rodando na porta ${port}`);
});
