const axios = require("axios");
const { malvin } = require("../malvin");

// ✅ تحميل منشورات انستقرام (صور / فيديو)
malvin({
  pattern: "igimagedl",
  alias: ["instagramimages", "igimages", "igimage"],
  react: '📥',
  desc: "تحميل منشورات إنستقرام (صور أو فيديوهات)",
  category: "التحميل",
  use: ".igimagedl <رابط منشور انستقرام>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const igUrl = args[0];
    if (!igUrl || !igUrl.includes("instagram.com")) {
      return reply('❌ يرجى إدخال رابط منشور إنستقرام صالح.\nمثال: `.igimagedl https://instagram.com/...`');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api.fgmods.xyz/api/downloader/igdl?url=${encodeURIComponent(igUrl)}&apikey=E8sfLg9l`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.status || !response.data.result) {
      return reply('❌ تعذر جلب المنشور. تحقق من الرابط وحاول مجددًا.');
    }

    const { url, caption, username, like, comment, isVideo } = response.data.result;

    await reply(`📥 *جاري تحميل منشور @${username} ... الرجاء الانتظار*`);

    for (const mediaUrl of url) {
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      if (!mediaResponse.data) {
        return reply('❌ فشل تحميل الوسائط. حاول لاحقًا.');
      }

      const mediaBuffer = Buffer.from(mediaResponse.data, 'binary');

      const captionText = 
        `📥 *منشور إنستقرام*\n\n` +
        `👤 *الاسم:* @${username}\n` +
        `❤️ *الإعجابات:* ${like}\n` +
        `💬 *التعليقات:* ${comment}\n` +
        `📝 *الوصف:* ${caption || "لا يوجد وصف"}\n\n` +
        `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴍᴀʟᴠɪɴ ᴋɪɴɢ`;

      if (isVideo) {
        await conn.sendMessage(from, {
          video: mediaBuffer,
          caption: captionText,
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
      } else {
        await conn.sendMessage(from, {
          image: mediaBuffer,
          caption: captionText,
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
      }
    }

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error('خطأ أثناء تحميل منشور إنستقرام:', error);
    reply('❌ تعذر تحميل المنشور. الرجاء المحاولة لاحقًا.');
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});

// ✅ تحميل فيديوهات إنستقرام
malvin({
  pattern: "igvid",
  alias: ["igvideo", "ig", "instagram", "igdl"],
  react: '📥',
  desc: "تحميل فيديوهات إنستقرام",
  category: "التحميل",
  use: ".igvid <رابط فيديو انستقرام>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const igUrl = args[0];
    if (!igUrl || !igUrl.includes("instagram.com")) {
      return reply('❌ يرجى إدخال رابط فيديو إنستقرام صالح.\nمثال: `.igvid https://instagram.com/...`');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api.nexoracle.com/downloader/aio2?apikey=free_key@maher_apis&url=${encodeURIComponent(igUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ تعذر جلب الفيديو. تحقق من الرابط وحاول مرة أخرى.');
    }

    const { title, low, high } = response.data.result;
    await reply(`📥 *جاري تحميل الفيديو: ${title || "فيديو إنستقرام"} ...*`);

    const videoUrl = high || low;
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    if (!videoResponse.data) {
      return reply('❌ فشل تحميل الفيديو. حاول لاحقًا.');
    }

    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    await conn.sendMessage(from, {
      video: videoBuffer,
      caption: `📥 *فيديو إنستقرام*\n\n` +
               `🔖 *العنوان:* ${title || "لا يوجد عنوان"}\n\n` +
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

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error('خطأ أثناء تحميل فيديو إنستقرام:', error);
    reply('❌ تعذر تحميل الفيديو. الرجاء المحاولة لاحقًا.');
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
