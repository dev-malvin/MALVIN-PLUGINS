const axios = require("axios");
const { malvin } = require("../malvin");

// ✅ تحميل فيديوهات TikTok
malvin({
  pattern: "tiktok",
  alias: ["ttdl", "tiktokdl", "tt"],
  react: '📥',
  desc: "تحميل فيديوهات تيك توك",
  category: "التحميل",
  use: ".tiktok <رابط فيديو تيك توك>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    // التحقق من وجود رابط صالح
    const tiktokUrl = args[0];
    if (!tiktokUrl || !tiktokUrl.includes("tiktok.com")) {
      return reply('❌ يرجى إدخال رابط فيديو تيك توك صالح.\nمثال: `.tiktok https://tiktok.com/...`');
    }

    // إرسال تفاعل انتظار
    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // رابط API
    const apiUrl = `https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(tiktokUrl)}`;
    const response = await axios.get(apiUrl);

    // التحقق من الاستجابة
    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ تعذر جلب الفيديو. تحقق من الرابط وحاول مجددًا.');
    }

    const { title, thumbnail, author, metrics, url } = response.data.result;

    await reply(`📥 *جاري تحميل فيديو تيك توك من @${author.username} ... الرجاء الانتظار.*`);

    // تحميل الفيديو
    const videoResponse = await axios.get(url, { responseType: 'arraybuffer' });
    if (!videoResponse.data) {
      return reply('❌ فشل تحميل الفيديو. حاول لاحقًا.');
    }

    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    // إرسال الفيديو مع التفاصيل
    await conn.sendMessage(from, {
      video: videoBuffer,
      caption: `📥 *فيديو TikTok*\n\n` +
        `🎬 *العنوان:* ${title || "بدون عنوان"}\n` +
        `👤 *الناشر:* @${author.username} (${author.nickname})\n` +
        `❤️ *الإعجابات:* ${metrics.digg_count}\n` +
        `💬 *التعليقات:* ${metrics.comment_count}\n` +
        `🔁 *المشاركات:* ${metrics.share_count}\n` +
        `⬇️ *التحميلات:* ${metrics.download_count}\n\n` +
        `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴍᴀʟᴠɪɴ ᴋɪɴɢ`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363398430045533@newsletter',
          newsletterName: '『 ᴍᴀʟᴠɪɴ-xᴅ 』',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    // تفاعل النجاح
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error('خطأ أثناء تحميل فيديو TikTok:', error);
    reply('❌ تعذر تحميل الفيديو. الرجاء المحاولة لاحقًا.');
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
