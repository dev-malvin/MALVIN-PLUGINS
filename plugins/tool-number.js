const { malvin } = require("../malvin");
const axios = require("axios");

// ✅ الأمر: tempnum – جلب أرقام مؤقتة
malvin({
    pattern: "tempnum",
    alias: ["fakenum", "tempnumber"],
    desc: "الحصول على أرقام مؤقتة وتعليمات OTP",
    category: "أدوات",
    react: "📱",
    use: "<رمز-الدولة>"
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args || args.length < 1) {
            return reply(`❌ *طريقة الاستخدام:* .tempnum <رمز-الدولة>\nمثال: .tempnum us\n\n📦 استخدم .otpbox <الرقم> لعرض رسائل OTP`);
        }

        const countryCode = args[0].toLowerCase();

        const { data } = await axios.get(
            `https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${countryCode}`,
            { 
                timeout: 10000,
                validateStatus: status => status === 200
            }
        );

        if (!data?.result || !Array.isArray(data.result)) {
            console.error("هيكل API غير صالح:", data);
            return reply(`⚠ تنسيق استجابة غير صحيح من API\nجرّب: .tempnum us`);
        }

        if (data.result.length === 0) {
            return reply(`📭 لا توجد أرقام متوفرة للدولة *${countryCode.toUpperCase()}*\nجرّب رمز دولة آخر!\n\n📦 استخدم .otpbox <الرقم> بعد اختيار الرقم`);
        }

        const numbers = data.result.slice(0, 25);
        const numberList = numbers.map((num, i) => 
            `${String(i+1).padStart(2, ' ')}. ${num.number}`
        ).join("\n");

        await reply(
            `╭──「 📱 الأرقام المؤقتة 」\n` +
            `│\n` +
            `│ 🌍 الدولة: ${countryCode.toUpperCase()}\n` +
            `│ 🔢 عدد الأرقام: ${numbers.length}\n` +
            `│\n` +
            `${numberList}\n\n` +
            `╰──「 📦 استخدم: .otpbox <الرقم> 」\n` +
            `_مثال: .otpbox +1234567890_`
        );

    } catch (err) {
        console.error("خطأ في API:", err);
        const errorMessage = err.code === "ECONNABORTED" ? 
            `⏳ *انتهت المهلة*: تأخر في استجابة API\nجرّب رموز دول مثل 'us' أو 'gb'` :
            `⚠ *خطأ*: ${err.message}\nاستخدم الصيغة: .tempnum <رمز-الدولة>`;
            
        reply(`${errorMessage}\n\n🔑 تذكير: استخدم .otpbox <الرقم> لعرض رسائل OTP`);
    }
});

// ✅ الأمر: templist – عرض قائمة الدول
malvin({
    pattern: "templist",
    alias: ["tempnumberlist", "tempnlist", "listnumbers"],
    desc: "عرض قائمة الدول التي توفر أرقام مؤقتة",
    category: "أدوات",
    react: "🌍",
    filename: __filename,
    use: ".templist"
},
async (conn, m, { reply }) => {
    try {
        const { data } = await axios.get("https://api.vreden.my.id/api/tools/fakenumber/country");

        if (!data || !data.result) return reply("❌ تعذر جلب قائمة الدول.");

        const countries = data.result.map((c, i) => `*${i + 1}.* ${c.title} \`(${c.id})\``).join("\n");

        await reply(`🌍 *عدد الدول المتوفرة:* ${data.result.length}\n\n${countries}`);
    } catch (e) {
        console.error("خطأ في قائمة الدول:", e);
        reply("❌ فشل في تحميل قائمة الدول المؤقتة.");
    }
});

// ✅ الأمر: otpbox – عرض رسائل OTP لرقم مؤقت
malvin({
    pattern: "otpbox",
    alias: ["checkotp", "getotp"],
    desc: "عرض رسائل OTP للرقم المؤقت",
    category: "أدوات",
    react: "🔑",
    use: "<رقم-كامل>"
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0] || !args[0].startsWith("+")) {
            return reply(`❌ *طريقة الاستخدام:* .otpbox <الرقم الكامل>\nمثال: .otpbox +9231034481xx`);
        }

        const phoneNumber = args[0].trim();

        const { data } = await axios.get(
            `https://api.vreden.my.id/api/tools/fakenumber/message?nomor=${encodeURIComponent(phoneNumber)}`,
            { 
                timeout: 10000,
                validateStatus: status => status === 200
            }
        );

        if (!data?.result || !Array.isArray(data.result)) {
            return reply("⚠ لا توجد رسائل OTP لهذا الرقم.");
        }

        const otpMessages = data.result.map(msg => {
            const otpMatch = msg.content.match(/\b\d{4,8}\b/g);
            const otpCode = otpMatch ? otpMatch[0] : "غير موجود";

            return `┌ *من:* ${msg.from || "غير معروف"}
│ *الرمز:* ${otpCode}
│ *الوقت:* ${msg.time_wib || msg.timestamp}
└ *الرسالة:* ${msg.content.substring(0, 50)}${msg.content.length > 50 ? "..." : ""}`;
        }).join("\n\n");

        await reply(
            `╭──「 🔑 رسائل OTP 」\n` +
            `│ 📞 الرقم: ${phoneNumber}\n` +
            `│ ✉️ عدد الرسائل: ${data.result.length}\n` +
            `│\n` +
            `${otpMessages}\n` +
            `╰──「 📦 استخدم .tempnum لجلب أرقام جديدة 」`
        );

    } catch (err) {
        console.error("خطأ في التحقق من OTP:", err);
        const errorMsg = err.code === "ECONNABORTED" ?
            "⌛ انتهت مهلة التحقق. حاول مرة أخرى لاحقًا." :
            `⚠ خطأ: ${err.response?.data?.error || err.message}`;

        reply(`${errorMsg}\n\n📌 مثال: .otpbox +9231034481xx`);
    }
});
