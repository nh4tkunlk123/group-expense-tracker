export const sendDiscordNotification = async (
  webhookUrl: string, 
  payerName: string, 
  amount: number, 
  description: string, 
  splitCount: number,
  splitAmount: number,
  isSettleUp: boolean = false,
  settleUpReceiverName?: string
) => {
  try {
    let embed;
    
    if (isSettleUp) {
      embed = {
        title: 'Hoàn tất thanh toán',
        description: `**${payerName}** đã thanh toán **${amount.toLocaleString()}đ** cho **${settleUpReceiverName}**.\n\n*Lý do: ${description}*`,
        color: 3066993, // Green color
        timestamp: new Date().toISOString()
      };
    } else {
      embed = {
        title: 'Ghi nhận giao dịch mới',
        description: `**${payerName}** vừa chi trả **${amount.toLocaleString()}đ** cho mục đích **${description}**.`,
        color: 3447003, // Blue color
        fields: [
          {
            name: 'Tổng tiền',
            value: `\`${amount.toLocaleString()} đ\``,
            inline: true
          },
          {
            name: 'Chia đều cho',
            value: `\`${splitCount} người\``,
            inline: true
          },
          {
            name: 'Mỗi người nợ lại',
            value: `\`${splitAmount.toLocaleString()} đ\``,
            inline: false
          }
        ],
        timestamp: new Date().toISOString()
      };
    }

    const message = {
      content: null,
      embeds: [embed]
    };

    // Use FormData to bypass CORS preflight. multipart/form-data is a simple content type!
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(message));

    await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
};
