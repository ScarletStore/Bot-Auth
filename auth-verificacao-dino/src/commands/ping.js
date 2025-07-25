const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com Pong! e a latência do bot.'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Calculando...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        await interaction.editReply(`Pong! 🏓\nLatência da mensagem: ${latency}ms.\nLatência da API: ${apiLatency}ms.`);
    },
};
