const config = require('../settings');
const { Tarzanalwaqdiy } = require('../malvin');
const yts = require('yt-search');
const fetch = require('node-fetch');

Tarzanalwaqdiy({
    pattern: "video2",
    alias: ["vid", "video2"],
    react: "🎥",
    desc: "Download video from YouTube",
    category: "download",
    use: ".video2 <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ يرجى كتابة اسم فيديو أو رابط YouTube!");

        let videoUrl, title;
        
        // التحقق إن كانت الإدخالات رابط
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
        } else {
            // البحث في YouTube
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ لم يتم العثور على نتائج!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
        }

        await reply("⏳ *جارٍ تحميل الفيديو...*");

        // استخدام API للتحميل
        const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) return await reply("❌ فشل في تحميل الفيديو!");

        await conn.sendMessage(from, {
            video: { url: data.result.download_url },
            mimetype: 'video/mp4',
            caption: `🎬 *${title}*\n\n> 👑 بواسطة Tarzan Alwaqdiy`
        }, { quoted: mek });

        await reply(`✅ *${title}* تم تحميله بنجاح!`);

    } catch (error) {
        console.error(error);
        await reply(`❌ حدث خطأ:\n${error.message}`);
    }
});
