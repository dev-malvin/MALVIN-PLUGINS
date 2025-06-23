const { Tarzanalwaqdiy } = require('../malvin');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const fetch = require("node-fetch");

Tarzanalwaqdiy({
    pattern: "video",
    alias: ["ytvideo", "mp4"],
    react: "📽",
    desc: "Download YouTube video (MP4)",
    category: "download",
    use: ".video <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❓ ما هو الفيديو الذي تريد تحميله؟ الرجاء إدخال كلمة بحث.");

        await reply("🔍 *جارٍ البحث عن الفيديو، انتظر قليلًا...*");

        const search = await ytsearch(q);
        if (!search.results.length) return reply("❌ لم يتم العثور على أي نتائج.");

        const { title, thumbnail, timestamp, url } = search.results[0];
        const videoUrl = encodeURIComponent(url);

        // المحاولة باستخدام API الأساسي
        const api1 = `https://apis-keith.vercel.app/download/dlmp4?url=${videoUrl}`;
        const api2 = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${videoUrl}`;

        let data;

        try {
            const res1 = await fetch(api1);
            data = await res1.json();
            if (!data?.status || !data?.result?.downloadUrl) throw new Error("فشل API الأساسي");
        } catch {
            const res2 = await fetch(api2);
            data = await res2.json();
            if (!data?.success || !data?.result?.download_url) throw new Error("فشل كل من API الأساسي والثانوي");
        }

        const downloadUrl = data.result.downloadUrl || data.result.download_url;

        // إرسال معلومات الفيديو
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `🎬 *تم العثور على فيديو:*\n\n📌 *العنوان:* ${title}\n⏱️ *المدة:* ${timestamp}\n🔗 *الرابط:* ${url}\n\n> 👑 *تم بواسطة Tarzan Alwaqdiy*`
        }, { quoted: mek });

        // إرسال الفيديو
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            caption: `✅ *تم تحميل الفيديو بنجاح!*\n\n> 👑 *تم بواسطة Tarzan Alwaqdiy*`
        }, { quoted: mek });

    } catch (error) {
        reply(`❌ حدث خطأ أثناء التحميل:\n${error.message}`);
    }
});
