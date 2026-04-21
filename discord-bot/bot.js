require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const express = require('express');

// Dummy HTTP Server for Render/Koyeb free tiers health check
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`[System] Web server listening on port ${port}`));

// Khởi tạo kết nối Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Khởi tạo Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ],
});

let discordToSupabaseMap = {};
if (fs.existsSync('links.json')) {
  try {
    discordToSupabaseMap = JSON.parse(fs.readFileSync('links.json', 'utf8'));
  } catch (e) {
    console.error('Lỗi đọc links.json', e);
  }
}

function parseAmount(amountStr) {
  if (!amountStr) return null;
  const str = amountStr.toLowerCase().replace(/,/g, '').replace(/\./g, '');
  if (str.endsWith('k')) {
    const num = parseFloat(str.replace('k', ''));
    if (!isNaN(num)) return num * 1000;
  }
  if (str.endsWith('tr') || str.endsWith('m')) {
    const num = parseFloat(str.replace('tr', '').replace('m', ''));
    if (!isNaN(num)) return num * 1000000;
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN') + 'đ';

const commands = [
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Liên kết tài khoản hệ thống (System Account Link)')
    .addStringOption(option => 
      option.setName('ten')
        .setDescription('Tên tài khoản (Ví dụ: Nhat)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('expense')
    .setDescription('Ghi nhận khoản chi chung (Shared Expense)')
    .addStringOption(option => 
      option.setName('so_tien')
        .setDescription('Số tiền (Ví dụ: 500k)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('ly_do')
        .setDescription('Lý do chi (Ví dụ: Tien dien)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('chia_cho')
        .setDescription('Danh sách người chia sẻ. Bỏ trống = Toàn bộ nhóm.')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('lend')
    .setDescription('Ghi nhận khoản cho vay (One-way Debt)')
    .addStringOption(option => 
      option.setName('so_tien')
        .setDescription('Số tiền cho vay (Ví dụ: 50k)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('nguoi_vay')
        .setDescription('Tên người vay')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('ly_do')
        .setDescription('Lý do cho vay')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('settle')
    .setDescription('Ghi nhận khoản thanh toán nợ (Debt Settlement)')
    .addStringOption(option => 
      option.setName('so_tien')
        .setDescription('Số tiền thanh toán (Ví dụ: 250k)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('nguoi_nhan')
        .setDescription('Tên người nhận tiền')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Xem tổng hợp công nợ cá nhân (Debt Summary)')
].map(command => command.toJSON());

client.once('clientReady', async () => {
  console.log(`[System] Tracker Bot online as: ${client.user.tag}`);
  
  // Đăng ký Slash Commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('[System] Đang đăng ký Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Đăng ký Slash Commands thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký Slash Commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // 1. Lệnh /link
    if (commandName === 'link') {
      const name = interaction.options.getString('ten');

      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;

      const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
      if (!user) {
        const availableNames = users.map(u => u.name).join(', ');
        return interaction.reply({ content: `[Lỗi] Không tìm thấy tài khoản "${name}". Danh sách hiện tại: ${availableNames}`, ephemeral: true });
      }

      discordToSupabaseMap[interaction.user.id] = user.id;
      fs.writeFileSync('links.json', JSON.stringify(discordToSupabaseMap, null, 2));

      return interaction.reply({ content: `[Thành công] Đã liên kết tài khoản hệ thống: **${user.name}**.`, ephemeral: true });
    }

    const currentUserId = discordToSupabaseMap[interaction.user.id];
    if (!currentUserId && ['expense', 'settle', 'summary', 'lend'].includes(commandName)) {
      return interaction.reply({ content: '[Lỗi] Vui lòng sử dụng lệnh `/link` để xác thực tài khoản trước khi thực hiện giao dịch.', ephemeral: true });
    }

    // 2. Lệnh /expense
    if (commandName === 'expense') {
      const amountStr = interaction.options.getString('so_tien');
      const note = interaction.options.getString('ly_do');
      const chiaChoStr = interaction.options.getString('chia_cho');
      
      const amount = parseAmount(amountStr);
      if (!amount) return interaction.reply({ content: '[Lỗi] Định dạng số tiền không hợp lệ.', ephemeral: true });

      const { data: users } = await supabase.from('users').select('*');
      const currentUser = users.find(u => u.id === currentUserId);

      // Lọc danh sách chia tiền
      let splitUsers = [...users];
      if (chiaChoStr) {
        const names = chiaChoStr.split(',').map(n => n.trim().toLowerCase());
        splitUsers = users.filter(u => {
          if ((names.includes('tôi') || names.includes('mình')) && u.id === currentUserId) return true;
          return names.some(name => u.name.toLowerCase().includes(name));
        });
        
        if (splitUsers.length === 0) {
          return interaction.reply({ content: `[Lỗi] Không tìm thấy dữ liệu khớp với "${chiaChoStr}".`, ephemeral: true });
        }
        
        // LUÔN LUÔN tự động thêm người trả tiền
        if (!splitUsers.some(u => u.id === currentUserId)) {
          splitUsers.push(currentUser);
        }
      }

      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          description: note,
          amount: amount,
          paid_by: currentUserId
        }])
        .select()
        .single();
        
      if (txError) throw txError;

      const splitAmount = amount / splitUsers.length;
      const splits = splitUsers.map(u => ({
        transaction_id: tx.id,
        user_id: u.id,
        amount_owed: splitAmount
      }));

      const { error: splitError } = await supabase.from('transaction_splits').insert(splits);
      if (splitError) throw splitError;

      const splitNames = splitUsers.map(u => u.name).join(', ');

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('Ghi nhận khoản chi chung')
        .setDescription(`**${currentUser.name}** đã chi trả **${formatMoney(amount)}**.\nMục đích: **${note}**.`)
        .addFields(
          { name: 'Người tham gia', value: `${splitNames}`, inline: false },
          { name: 'Số lượng', value: `${splitUsers.length} người`, inline: true },
          { name: 'Dư nợ cá nhân', value: `${formatMoney(splitAmount)}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }

    // Lệnh /lend (Nợ 1 chiều)
    if (commandName === 'lend') {
      const amountStr = interaction.options.getString('so_tien');
      const borrowerQuery = interaction.options.getString('nguoi_vay');
      const note = interaction.options.getString('ly_do') || 'Khoản vay cá nhân';
      
      const amount = parseAmount(amountStr);
      if (!amount) return interaction.reply({ content: '[Lỗi] Định dạng số tiền không hợp lệ.', ephemeral: true });

      const { data: users } = await supabase.from('users').select('*');
      const currentUser = users.find(u => u.id === currentUserId);

      // Tìm những người vay
      const names = borrowerQuery.split(',').map(n => n.trim().toLowerCase());
      const borrowers = users.filter(u => names.some(name => u.name.toLowerCase().includes(name)));

      if (borrowers.length === 0) {
        return interaction.reply({ content: `❌ Không tìm ra ai khớp với "${borrowerQuery}"!`, ephemeral: true });
      }

      // KHÔNG THÊM currentUser VÀO DANH SÁCH CHIA
      // Nếu có người lỡ gõ "tôi" vào đây thì lọc ra luôn, vì tự mượn tiền mình thì vô lý
      const validBorrowers = borrowers.filter(u => u.id !== currentUserId);

      if (validBorrowers.length === 0) {
        return interaction.reply({ content: `❌ Bro không thể tự cho mình mượn tiền được!`, ephemeral: true });
      }

      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          description: `Cho mượn: ${note}`,
          amount: amount,
          paid_by: currentUserId
        }])
        .select()
        .single();
        
      if (txError) throw txError;

      // Chia đều số tiền cho những người vay (nếu có nhiều người mượn chung 1 cục)
      const splitAmount = amount / validBorrowers.length;
      const splits = validBorrowers.map(u => ({
        transaction_id: tx.id,
        user_id: u.id,
        amount_owed: splitAmount
      }));

      const { error: splitError } = await supabase.from('transaction_splits').insert(splits);
      if (splitError) throw splitError;

      const borrowerNames = validBorrowers.map(u => u.name).join(', ');

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('🤝 Đã ghi sổ khoản cho mượn (Nợ 1 chiều)')
        .setDescription(`**${currentUser.name}** vừa cho **${borrowerNames}** mượn **${formatMoney(amount)}**.\nLý do: **${note}**`)
        .addFields(
          { name: 'Mỗi người mượn', value: `${formatMoney(splitAmount)}`, inline: true }
        );

      return interaction.reply({ embeds: [embed] });
    }



    // 3. Lệnh /settle
    if (commandName === 'settle') {
      const amountStr = interaction.options.getString('so_tien');
      const receiverQuery = interaction.options.getString('nguoi_nhan').toLowerCase();

      const amount = parseAmount(amountStr);
      if (!amount) return interaction.reply({ content: '[Lỗi] Định dạng số tiền không hợp lệ.', ephemeral: true });

      const { data: users } = await supabase.from('users').select('*');
      const receiver = users.find(u => u.name.toLowerCase().includes(receiverQuery) && u.id !== currentUserId);
      const currentUser = users.find(u => u.id === currentUserId);

      if (!receiver) return interaction.reply({ content: `[Lỗi] Không tìm thấy dữ liệu người dùng "${receiverQuery}".`, ephemeral: true });

      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          description: `Thanh toán dư nợ`,
          amount: amount,
          paid_by: currentUserId
        }])
        .select()
        .single();
        
      if (txError) throw txError;

      const { error: splitError } = await supabase.from('transaction_splits').insert([{
        transaction_id: tx.id,
        user_id: receiver.id,
        amount_owed: amount
      }]);

      if (splitError) throw splitError;

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('Hoàn tất thanh toán')
        .setDescription(`**${currentUser.name}** đã thanh toán **${formatMoney(amount)}** cho **${receiver.name}**.`);

      return interaction.reply({ embeds: [embed] });
    }

    // 4. Lệnh /summary
    if (commandName === 'summary') {
      const { data: users } = await supabase.from('users').select('*');
      const currentUser = users.find(u => u.id === currentUserId);
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          splits: transaction_splits (*)
        `);

      let netBalance = 0;
      let textLines = [];

      users.forEach(otherUser => {
        if (otherUser.id === currentUserId) return;
        
        let balance = 0;
        transactions.forEach(tx => {
          if (tx.paid_by === currentUserId) {
            const split = tx.splits.find(s => s.user_id === otherUser.id);
            if (split) balance += Number(split.amount_owed);
          }
          else if (tx.paid_by === otherUser.id) {
            const split = tx.splits.find(s => s.user_id === currentUserId);
            if (split) balance -= Number(split.amount_owed);
          }
        });

        netBalance += balance;
        if (balance > 0) textLines.push(`• Dư nợ từ **${otherUser.name}**: \`${formatMoney(balance)}\``);
        else if (balance < 0) textLines.push(`• Công nợ với **${otherUser.name}**: \`${formatMoney(Math.abs(balance))}\``);
      });

      const embed = new EmbedBuilder()
        .setColor(netBalance >= 0 ? 0x2ecc71 : 0xe74c3c)
        .setTitle(`Báo cáo tài chính cá nhân: ${currentUser.name}`)
        .setDescription(`Số dư khả dụng: **${netBalance > 0 ? '+' : ''}${formatMoney(netBalance)}**\n\n${textLines.join('\n') || '*Trạng thái công nợ hiện tại: Cân bằng.*'}`);

      return interaction.reply({ embeds: [embed] });
    }

  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '[Lỗi] Hệ thống đang gặp sự cố kết nối với Database.', ephemeral: true });
    } else {
      await interaction.reply({ content: '[Lỗi] Hệ thống đang gặp sự cố kết nối với Database.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
