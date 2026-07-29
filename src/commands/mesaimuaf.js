const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesaimuaf')
    .setDescription('Seste olma zorunluluğundan muaf tutulacak kullanıcı veya rolleri yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('ekle')
        .setDescription('Kullanıcıyı veya rolü ses zorunluluğundan muaf tutar.')
        .addUserOption(opt =>
          opt
            .setName('kullanici')
            .setDescription('Muaf tutulacak kullanıcı')
            .setRequired(false)
        )
        .addRoleOption(opt =>
          opt
            .setName('rol')
            .setDescription('Muaf tutulacak rol')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('cikar')
        .setDescription('Kullanıcının veya rolün ses muafiyetini kaldırır.')
        .addUserOption(opt =>
          opt
            .setName('kullanici')
            .setDescription('Muafiyeti kaldırılacak kullanıcı')
            .setRequired(false)
        )
        .addRoleOption(opt =>
          opt
            .setName('rol')
            .setDescription('Muafiyeti kaldırılacak rol')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('liste')
        .setDescription('Ses zorunluluğundan muaf tutulan kullanıcı ve rolleri listeler.')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    let config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
      return interaction.editReply({
        content: '❌ Sunucu kurulumu henüz yapılmamış! Önce `/kurulum-yap` komutunu çalıştırın.'
      });
    }

    // Yetki kontrolü: Admin, Highcommand veya Supervisor
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const isHighCommand = config.roles.highcommand && member.roles.cache.has(config.roles.highcommand);
    const isSupervisor = config.roles.supervisor && member.roles.cache.has(config.roles.supervisor);

    if (!isAdmin && !isHighCommand && !isSupervisor) {
      return interaction.editReply({
        content: '❌ Bu komutu kullanmak için **Highcommand**, **Supervisor** rolüne veya **Yönetici** yetkisine sahip olmanız gerekiyor.'
      });
    }

    if (!config.voiceExemptions) {
      config.voiceExemptions = { users: [], roles: [] };
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ekle') {
      const targetUser = interaction.options.getUser('kullanici');
      const targetRole = interaction.options.getRole('rol');

      if (!targetUser && !targetRole) {
        return interaction.editReply({
          content: '❌ Lütfen en az bir **kullanıcı** veya **rol** seçin.'
        });
      }

      const added = [];

      if (targetUser) {
        if (!config.voiceExemptions.users.includes(targetUser.id)) {
          config.voiceExemptions.users.push(targetUser.id);
          added.push(`👤 Kullanıcı: <@${targetUser.id}>`);
        }
      }

      if (targetRole) {
        if (!config.voiceExemptions.roles.includes(targetRole.id)) {
          config.voiceExemptions.roles.push(targetRole.id);
          added.push(`🎭 Rol: <@&${targetRole.id}>`);
        }
      }

      if (added.length === 0) {
        return interaction.editReply({
          content: 'ℹ️ Seçilen kullanıcı veya rol zaten muafiyet listesinde bulunuyor.'
        });
      }

      await config.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Ses Muafiyeti Eklendi')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          `Aşağıdaki kişi/roller seste olma zorunluluğundan muaf tutuldu:\n\n` +
          `${added.join('\n')}\n\n` +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x2ECC71)
        .setTimestamp()
        .setFooter({ text: `İşlemi yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
    }

    else if (subcommand === 'cikar') {
      const targetUser = interaction.options.getUser('kullanici');
      const targetRole = interaction.options.getRole('rol');

      if (!targetUser && !targetRole) {
        return interaction.editReply({
          content: '❌ Lütfen en az bir **kullanıcı** veya **rol** seçin.'
        });
      }

      const removed = [];

      if (targetUser) {
        const idx = config.voiceExemptions.users.indexOf(targetUser.id);
        if (idx !== -1) {
          config.voiceExemptions.users.splice(idx, 1);
          removed.push(`👤 Kullanıcı: <@${targetUser.id}>`);
        }
      }

      if (targetRole) {
        const idx = config.voiceExemptions.roles.indexOf(targetRole.id);
        if (idx !== -1) {
          config.voiceExemptions.roles.splice(idx, 1);
          removed.push(`🎭 Rol: <@&${targetRole.id}>`);
        }
      }

      if (removed.length === 0) {
        return interaction.editReply({
          content: 'ℹ️ Seçilen kullanıcı veya rol muafiyet listesinde bulunamadı.'
        });
      }

      await config.save();

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Ses Muafiyeti Kaldırıldı')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          `Aşağıdaki kişi/rollerin ses muafiyeti kaldırıldı:\n\n` +
          `${removed.join('\n')}\n\n` +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0xE74C3C)
        .setTimestamp()
        .setFooter({ text: `İşlemi yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
    }

    else if (subcommand === 'liste') {
      const usersList = (config.voiceExemptions.users || []).map(id => `• <@${id}>`).join('\n') || '*Muaf kullanıcı yok*';
      const rolesList = (config.voiceExemptions.roles || []).map(id => `• <@&${id}>`).join('\n') || '*Muaf rol yok*';

      const embed = new EmbedBuilder()
        .setTitle('📋 SES ZORUNLULUĞU MUAFİYET LİSTESİ')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          `**👤 Muaf Kullanıcılar:**\n${usersList}\n\n` +
          `**🎭 Muaf Roller:**\n${rolesList}\n\n` +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x5865F2)
        .setTimestamp()
        .setFooter({ text: guild.name, iconURL: guild.iconURL() });

      await interaction.editReply({ embeds: [embed] });
    }
  }
};
