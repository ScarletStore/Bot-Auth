// Importa as bibliotecas necessárias do discord.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Importa as configurações do arquivo config.json
const config = require('../config.json');

// Importa e inicia o servidor web (ESSENCIAL para a página de login)
require('./web.js');

// Cria uma nova instância do cliente do bot com as 'intents' necessárias
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Cria uma coleção para armazenar os comandos do bot
client.commands = new Collection();

// Carrega os arquivos de comando da pasta 'commands'
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`[INFO] Comando carregado: ${command.data.name}`);
    } else {
        console.log(`[AVISO] O comando em ${filePath} não possui as propriedades "data" ou "execute".`);
    }
}

// Evento que é disparado quando o bot está pronto e online
client.once('ready', () => {
    console.log(`[INFO] Bot online! Logado como ${client.user.tag}`);
    client.user.setActivity('Gerenciando o servidor!', { type: 'PLAYING' });
});

// Evento para responder a comandos de barra
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[ERRO] Comando não encontrado: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
    }
});

// Faz o login do bot no Discord
client.login(config.botToken);
