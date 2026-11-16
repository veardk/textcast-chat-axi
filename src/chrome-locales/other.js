// Chrome strings for Arabic, Hindi, Vietnamese, Thai, Indonesian and Turkish. Keys are the English
// source text; see chrome-i18n.js for how a missing key falls back to English.

/** @type {Record<string, Record<string, string>>} */
export const OTHER_STRINGS = {
  ar: {
    Conversation: "المحادثة",
    "Show conversation": "إظهار المحادثة",
    "Hide conversation": "إخفاء المحادثة",
    "Minimize conversation": "تصغير المحادثة",
    Minimize: "تصغير",
    "New reply": "رد جديد",
    "{n} queued": "{n} في الانتظار",
    " ({n} queued)": " ({n} في الانتظار)",
    " (new reply)": " (رد جديد)",
    "Session ended": "انتهت الجلسة",
    "Agent is working…": "الوكيل يعمل…",
    "External listener active": "مستمع خارجي متصل",
    "Agent listening": "الوكيل متصل",
    "Agent not listening": "الوكيل غير متصل",
    More: "المزيد",
    Revisions: "المراجعات",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "يسجّل الوكيل هذه المراجعات داخل الصفحة نفسها. ينقلك «إظهار» إلى الموضع التالي المعلَّم في تلك المراجعة، ولا يتغير مظهر الصفحة.",
    Reveal: "إظهار",
    "Reveal {pos}/{total}": "إظهار {pos}/{total}",
    "Reveal the next block changed in {label}": "إظهار الموضع التالي الذي تغيّر في «{label}»",
    "Ask about selected text": "اسأل عن النص المحدد",
    "Toggle annotate/explore mode": "تشغيل/إيقاف السؤال بالتحديد",
    Editing: "الملف",
    "Copy path": "نسخ المسار",
    Copy: "نسخ",
    Copied: "تم النسخ",
    "Reload page": "إعادة تحميل الصفحة",
    "End session": "إنهاء الجلسة",
    "Take over here": "المتابعة هنا",
    "Check and reload": "تحقق وأعد التحميل",
    Dismiss: "إغلاق",
    Reload: "إعادة تحميل",
    "Message the agent, or select text on the page to ask about it": "راسل الوكيل، أو حدّد نصًا في الصفحة لتسأل عنه",
    "Select any sentence on the page to ask about it, or write a message below.":
      "حدّد أي جملة في الصفحة لتسأل عنها، أو اكتب رسالة في الأسفل.",
    "Attach images": "إرفاق صور",
    "Send everything and end the session": "إرسال الكل وإنهاء الجلسة",
    "Send & End": "إرسال وإنهاء",
    "Send to Agent": "إرسال",
    "Session ended.": "انتهت الجلسة.",
    "To talk here again, copy this and send it to any agent.": "للمتابعة هنا مجددًا، انسخ هذا النص وأرسله إلى أي وكيل.",
    "Talk with me in this Textcast window:": "تحدّث معي في نافذة Textcast هذه:",
    "Then follow the next_step it prints.": "ثم اتبع next_step الذي يطبعه.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "هذه الصفحة مفتوحة في علامة تبويب أخرى. تبقى الردود غير المرسلة في علامة التبويب التي كتبتها فيها، والمتابعة هنا لا تنقلها.",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "الوكيل لا ينتظر الرسائل حاليًا. إذا استمر ذلك، فاطلب منه العودة إلى الاستماع (poll).",
    Agent: "الوكيل",
    You: "أنت",
    Queued: "في الانتظار",
    "Sending…": "جارٍ الإرسال…",
    Cancel: "إلغاء",
    Save: "حفظ",
    "Edit queued prompt": "تعديل الرسالة المنتظرة",
    "Remove queued prompt": "حذف الرسالة المنتظرة",
    "Image message": "رسالة صورة",
    "Image annotation": "ملاحظة على صورة",
    "Image expired": "انتهت صلاحية الصورة",
    "{n} more image": "{n} صورة أخرى",
    "{n} more images": "{n} صور أخرى",
    Seen: "تمت القراءة",
    Working: "قيد العمل",
    Done: "تم",
    "Seen: not yet": "لم تُقرأ بعد",
    "Working: not yet": "لم يبدأ العمل بعد",
    "Done: not yet": "لم يكتمل بعد",
    "No agent is listening": "لا يوجد وكيل متصل",
    Delivering: "جارٍ التسليم",
    "Agent is busy; delivered on its next poll": "الوكيل مشغول؛ ستصل الرسالة عند استماعه التالي",
    "Unsent annotation": "ملاحظة غير مرسلة",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "حُذف الموضع الذي ارتبطت به هذه الملاحظة أو استُبدل في الصفحة، لذا تعذّر إبقاؤها مفتوحة. نصك محفوظ هنا:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "تبقى الردود غير المرسلة في علامة التبويب التي كتبتها فيها، والمتابعة في نافذة أخرى لا تنقلها.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "لا شيء في الانتظار في علامة التبويب هذه. تبقى الردود غير المرسلة في علامة التبويب التي كتبتها فيها، والمتابعة في نافذة أخرى لا تنقلها.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "لا يوجد ما يُرسل. للإنهاء دون ملاحظات، اختر «إنهاء الجلسة» من قائمة المزيد (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "ما زلنا نحاول الإرسال. نصك محفوظ في علامة التبويب هذه. أبقِها مفتوحة وتأكد من أن الخادم يعمل.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "تعذّر الإرسال. ما زال نصك في الانتظار. تأكد من أن Textcast Chat يعمل، ثم اضغط «إرسال» مرة أخرى.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "تعذّر الإرسال. ما زال نصك في الانتظار. تأكد من أن Textcast Chat يعمل، ثم اضغط «إرسال وإنهاء» مرة أخرى.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "تعذّر تجهيز كل شيء خلال 5 ثوانٍ. تبقى الجلسة مفتوحة ويمكن تعديل الرسائل المنتظرة.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "تعذّر الإرسال لأن المحتوى كبير جدًا. ما زال في الانتظار. احذف بعض النص أو الصور ثم حاول مجددًا.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "لم يُرسل — {detail}. احذف الصورة أو استبدلها ثم أرسل مجددًا.",
    "more than {n} images on one prompt": "أكثر من {n} صور في رسالة واحدة",
    "too many images queued at once": "صور كثيرة جدًا في الانتظار دفعة واحدة",
    "an image attachment was malformed": "إحدى الصور تالفة",
    "an image is no longer available": "إحدى الصور لم تعد متاحة",
    "some attachments could not be delivered": "تعذّر تسليم بعض الصور",
    "Uploading…": "جارٍ الرفع…",
    "Upload failed": "فشل الرفع",
    Retry: "إعادة المحاولة",
    Remove: "حذف",
    "Retry {name}": "إعادة محاولة {name}",
    "Remove {name}": "حذف {name}",
    "Remove image": "حذف الصورة",
    "Could not read image": "تعذّرت قراءة الصورة",
    "Waiting for an image to finish uploading…": "في انتظار اكتمال رفع الصورة…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "تعذّر إرفاق إحدى الصور. أعد المحاولة أو احذفها قبل الإرسال.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "تعذّر إرفاق إحدى الصور. أعد المحاولة أو احذفها قبل وضعها في الانتظار.",
    "You can attach up to {n} image.": "يمكنك إرفاق {n} صورة كحد أقصى.",
    "You can attach up to {n} images.": "يمكنك إرفاق {n} صور كحد أقصى.",
    "Image is larger than the {limit} limit": "حجم الصورة يتجاوز الحد {limit}",
    "Unsupported file type. Use {types}.": "نوع ملف غير مدعوم. استخدم {types}.",
    "Too many uploads. Wait a moment and retry.": "عمليات رفع كثيرة جدًا. انتظر قليلًا ثم أعد المحاولة.",
    "Upload limit reached for this session ({limit}).": "بلغت هذه الجلسة حد الرفع ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "عمليات رفع متزامنة كثيرة جدًا. انتظر قليلًا ثم أعد المحاولة.",
    "Textcast Chat was updated. This page is running the previous version.":
      "تم تحديث Textcast Chat. ما زالت هذه الصفحة تعمل بالإصدار السابق.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "أُعيد تشغيل Textcast Chat بإصدار محلي. ما زالت هذه الصفحة تعمل بالإصدار السابق.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "أُعيد تشغيل Textcast Chat. ما زالت هذه الصفحة تعمل بالإصدار السابق.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "توقّف Textcast Chat. أعد تحميل الصفحة بعد تشغيله من جديد.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "خادم Textcast Chat الذي تتصل به هذه الصفحة لم يعد يعمل. ستنجح إعادة التحميل عندما يعمل من جديد.",
    "Textcast Chat did not answer.": "لم يستجب Textcast Chat.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "لم يستجب Textcast Chat للتحقق، لذا لا يمكن معرفة ما إذا كان يعمل. حاول مجددًا بعد قليل.",
    "Textcast Chat could not load this artifact.": "تعذّر تحميل الصفحة.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "لم يستجب Textcast Chat لطلب التحميل، وغالبًا ما يكون قد أُعيد تشغيله أثناء فتح الصفحة. استخدم «تحقق وأعد التحميل» لإعادة الاتصال.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "ما زال Textcast Chat لا يستجيب. اطلب من الوكيل تشغيله من جديد، ثم استخدم «تحقق وأعد التحميل».",
    "This review is already open in another tab.": "هذه الصفحة مفتوحة بالفعل في علامة تبويب أخرى.",
    "Textcast Chat is not running.": "Textcast Chat لا يعمل.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "أُعيد تشغيل Textcast Chat ولم يعد. اطلب من الوكيل تشغيله من جديد، ثم تحقق وأعد تحميل الصفحة.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "ما زال Textcast Chat لا يعمل. اطلب من الوكيل تشغيله من جديد، ثم استخدم «تحقق وأعد التحميل».",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "ما زال Textcast Chat لا يعمل. شغّله من جديد، ثم استخدم «تحقق وأعد التحميل».",
    "Textcast Chat could not finish loading.": "تعذّر إكمال التحميل.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "لم يُحمَّل نص واجهة Textcast Chat، وغالبًا ما يكون الخادم قد أُعيد تشغيله أثناء فتح الصفحة. استخدم «تحقق وأعد التحميل» لإعادة الاتصال.",
    "Now playing": "قيد التشغيل",
    "Close player": "إغلاق المشغّل",
    "Play the video when a line is clicked": "تشغيل الفيديو عند النقر على جملة",
    Ask: "اسأل",
    "Ask about this, or say what to change...": "اسأل عن هذا، أو اذكر ما يجب تغييره…",
    "Tell the agent what to change...": "أخبر الوكيل بما يجب تغييره…",
    "Attach image": "إرفاق صورة",
    "Enter to queue · {key}+Enter to send": "Enter للإضافة إلى الانتظار · {key}+Enter للإرسال",
    Queue: "إلى الانتظار",
    Send: "إرسال",
    "Annotate <{tag}>": "ملاحظة على <{tag}>",
  },
  hi: {
    Conversation: "बातचीत",
    "Show conversation": "बातचीत दिखाएँ",
    "Hide conversation": "बातचीत छिपाएँ",
    "Minimize conversation": "बातचीत छोटी करें",
    Minimize: "छोटा करें",
    "New reply": "नया जवाब",
    "{n} queued": "{n} कतार में",
    " ({n} queued)": " ({n} कतार में)",
    " (new reply)": " (नया जवाब)",
    "Session ended": "सत्र समाप्त",
    "Agent is working…": "एजेंट काम कर रहा है…",
    "External listener active": "बाहरी लिसनर जुड़ा है",
    "Agent listening": "एजेंट ऑनलाइन",
    "Agent not listening": "एजेंट ऑफ़लाइन",
    More: "और",
    Revisions: "संशोधन",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "एजेंट ये संशोधन पेज में ही दर्ज करता है। “दिखाएँ” उस संशोधन में चिह्नित अगली जगह पर ले जाता है; पेज का रूप नहीं बदलता।",
    Reveal: "दिखाएँ",
    "Reveal {pos}/{total}": "दिखाएँ {pos}/{total}",
    "Reveal the next block changed in {label}": "“{label}” में बदली गई अगली जगह दिखाएँ",
    "Ask about selected text": "चुने गए टेक्स्ट के बारे में पूछें",
    "Toggle annotate/explore mode": "चुनकर पूछना चालू/बंद करें",
    Editing: "फ़ाइल",
    "Copy path": "पाथ कॉपी करें",
    Copy: "कॉपी करें",
    Copied: "कॉपी हो गया",
    "Reload page": "पेज फिर से लोड करें",
    "End session": "सत्र समाप्त करें",
    "Take over here": "यहाँ जारी रखें",
    "Check and reload": "जाँचें और फिर से लोड करें",
    Dismiss: "बंद करें",
    Reload: "फिर से लोड करें",
    "Message the agent, or select text on the page to ask about it":
      "एजेंट को संदेश भेजें, या पेज पर टेक्स्ट चुनकर उसके बारे में पूछें",
    "Select any sentence on the page to ask about it, or write a message below.":
      "पेज पर कोई भी वाक्य चुनकर पूछें, या नीचे संदेश लिखें।",
    "Attach images": "चित्र जोड़ें",
    "Send everything and end the session": "सब भेजें और सत्र समाप्त करें",
    "Send & End": "भेजें और समाप्त करें",
    "Send to Agent": "भेजें",
    "Session ended.": "सत्र समाप्त हो गया।",
    "To talk here again, copy this and send it to any agent.":
      "यहाँ फिर से बात करने के लिए, इसे कॉपी करके किसी भी एजेंट को भेजें।",
    "Talk with me in this Textcast window:": "इस Textcast विंडो में मुझसे बात करो:",
    "Then follow the next_step it prints.": "फिर इसके आउटपुट में दिए next_step का पालन करो।",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "यह पेज दूसरे टैब में खुला है। न भेजे गए जवाब उसी टैब में रहते हैं जहाँ आपने उन्हें लिखा; यहाँ जारी रखने से वे साथ नहीं आते।",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "आपका एजेंट अभी संदेशों का इंतज़ार नहीं कर रहा। अगर ऐसा बना रहे, तो उसे फिर से सुनना (poll) शुरू करने को कहें।",
    Agent: "एजेंट",
    You: "आप",
    Queued: "कतार में",
    "Sending…": "भेजा जा रहा है…",
    Cancel: "रद्द करें",
    Save: "सहेजें",
    "Edit queued prompt": "कतार वाला संदेश संपादित करें",
    "Remove queued prompt": "कतार वाला संदेश हटाएँ",
    "Image message": "चित्र संदेश",
    "Image annotation": "चित्र पर टिप्पणी",
    "Image expired": "चित्र की अवधि समाप्त",
    "{n} more image": "{n} और चित्र",
    "{n} more images": "{n} और चित्र",
    Seen: "देखा गया",
    Working: "काम जारी",
    Done: "पूरा",
    "Seen: not yet": "अभी नहीं देखा",
    "Working: not yet": "अभी शुरू नहीं हुआ",
    "Done: not yet": "अभी पूरा नहीं हुआ",
    "No agent is listening": "कोई एजेंट ऑनलाइन नहीं",
    Delivering: "पहुँचाया जा रहा है",
    "Agent is busy; delivered on its next poll": "एजेंट व्यस्त है; अगली बार सुनने पर पहुँचेगा",
    "Unsent annotation": "न भेजी गई टिप्पणी",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "जिस हिस्से से यह टिप्पणी जुड़ी थी, वह पेज से हटाया या बदला गया, इसलिए इसे वहीं खुला नहीं रखा जा सका। आपका लिखा यहाँ सुरक्षित है:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "न भेजे गए जवाब उसी टैब में रहते हैं जहाँ आपने उन्हें लिखा; दूसरी विंडो में जारी रखने से वे साथ नहीं आते।",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "इस टैब में कतार में कुछ नहीं है। न भेजे गए जवाब उसी टैब में रहते हैं जहाँ आपने उन्हें लिखा; दूसरी विंडो में जारी रखने से वे साथ नहीं आते।",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "भेजने के लिए कुछ नहीं है। बिना प्रतिक्रिया के समाप्त करने के लिए “और” मेनू (⋮) में “सत्र समाप्त करें” चुनें।",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "भेजने की कोशिश जारी है। आपका लिखा इस टैब में सहेजा गया है। टैब खुला रखें और जाँचें कि सर्वर चल रहा है।",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "भेजा नहीं जा सका। आपका लिखा अभी भी कतार में है। जाँचें कि Textcast Chat चल रहा है, फिर दोबारा “भेजें” दबाएँ।",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "भेजा नहीं जा सका। आपका लिखा अभी भी कतार में है। जाँचें कि Textcast Chat चल रहा है, फिर दोबारा “भेजें और समाप्त करें” दबाएँ।",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "5 सेकंड में सब कुछ तैयार नहीं हो सका। सत्र खुला है और कतार वाले संदेश अब भी संपादित किए जा सकते हैं।",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "सामग्री बहुत बड़ी होने से भेजी नहीं जा सकी। वह अभी भी कतार में है। कुछ टेक्स्ट या चित्र हटाकर फिर कोशिश करें।",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "नहीं भेजा गया — {detail}। चित्र हटाएँ या बदलें, फिर दोबारा भेजें।",
    "more than {n} images on one prompt": "एक संदेश में {n} से ज़्यादा चित्र",
    "too many images queued at once": "एक साथ कतार में बहुत सारे चित्र",
    "an image attachment was malformed": "एक चित्र ख़राब है",
    "an image is no longer available": "एक चित्र अब उपलब्ध नहीं है",
    "some attachments could not be delivered": "कुछ चित्र पहुँचाए नहीं जा सके",
    "Uploading…": "अपलोड हो रहा है…",
    "Upload failed": "अपलोड विफल",
    Retry: "फिर कोशिश करें",
    Remove: "हटाएँ",
    "Retry {name}": "{name} फिर कोशिश करें",
    "Remove {name}": "{name} हटाएँ",
    "Remove image": "चित्र हटाएँ",
    "Could not read image": "चित्र पढ़ा नहीं जा सका",
    "Waiting for an image to finish uploading…": "चित्र अपलोड पूरा होने का इंतज़ार…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "एक चित्र जोड़ा नहीं जा सका। भेजने से पहले फिर कोशिश करें या उसे हटाएँ।",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "एक चित्र जोड़ा नहीं जा सका। कतार में डालने से पहले फिर कोशिश करें या उसे हटाएँ।",
    "You can attach up to {n} image.": "आप अधिकतम {n} चित्र जोड़ सकते हैं।",
    "You can attach up to {n} images.": "आप अधिकतम {n} चित्र जोड़ सकते हैं।",
    "Image is larger than the {limit} limit": "चित्र {limit} की सीमा से बड़ा है",
    "Unsupported file type. Use {types}.": "यह फ़ाइल प्रकार समर्थित नहीं है। {types} इस्तेमाल करें।",
    "Too many uploads. Wait a moment and retry.": "बहुत ज़्यादा अपलोड। थोड़ा रुककर फिर कोशिश करें।",
    "Upload limit reached for this session ({limit}).": "इस सत्र की अपलोड सीमा पूरी हो गई ({limit})।",
    "Too many uploads in flight. Wait a moment and retry.":
      "एक साथ बहुत ज़्यादा अपलोड चल रहे हैं। थोड़ा रुककर फिर कोशिश करें।",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat अपडेट हो गया है। यह पेज अभी पिछला संस्करण चला रहा है।",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat लोकल बिल्ड के साथ फिर से शुरू हुआ। यह पेज अभी पिछला संस्करण चला रहा है।",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat फिर से शुरू हुआ। यह पेज अभी पिछला संस्करण चला रहा है।",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat बंद हो गया। इसे फिर शुरू करने के बाद पेज फिर से लोड करें।",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "इस पेज से जुड़ा Textcast Chat सर्वर अब नहीं चल रहा। उसके फिर चलने पर पेज फिर से लोड हो सकेगा।",
    "Textcast Chat did not answer.": "Textcast Chat ने जवाब नहीं दिया।",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat ने जाँच का जवाब नहीं दिया, इसलिए पता नहीं चल रहा कि वह चल रहा है या नहीं। थोड़ी देर बाद फिर कोशिश करें।",
    "Textcast Chat could not load this artifact.": "पेज लोड नहीं हो सका।",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat ने लोड अनुरोध का जवाब नहीं दिया; आमतौर पर पेज खुलते समय सर्वर फिर से शुरू हो गया होता है। फिर से जुड़ने के लिए “जाँचें और फिर से लोड करें” चुनें।",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat अब भी जवाब नहीं दे रहा। अपने एजेंट से इसे फिर शुरू करवाएँ, फिर “जाँचें और फिर से लोड करें” चुनें।",
    "This review is already open in another tab.": "यह पेज पहले से दूसरे टैब में खुला है।",
    "Textcast Chat is not running.": "Textcast Chat नहीं चल रहा।",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat फिर से शुरू होने के बाद वापस नहीं आया। अपने एजेंट से इसे फिर शुरू करवाएँ, फिर पेज जाँचकर फिर से लोड करें।",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat अब भी नहीं चल रहा। अपने एजेंट से इसे फिर शुरू करवाएँ, फिर “जाँचें और फिर से लोड करें” चुनें।",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat अब भी नहीं चल रहा। इसे फिर शुरू करें, फिर “जाँचें और फिर से लोड करें” चुनें।",
    "Textcast Chat could not finish loading.": "लोडिंग पूरी नहीं हो सकी।",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat इंटरफ़ेस की स्क्रिप्ट लोड नहीं हुई; आमतौर पर पेज खुलते समय सर्वर फिर से शुरू हो गया होता है। फिर से जुड़ने के लिए “जाँचें और फिर से लोड करें” चुनें।",
    "Now playing": "चल रहा है",
    "Close player": "प्लेयर बंद करें",
    "Play the video when a line is clicked": "वाक्य पर क्लिक करने पर वीडियो चलाएँ",
    Ask: "पूछें",
    "Ask about this, or say what to change...": "इसके बारे में पूछें, या बताएँ क्या बदलना है…",
    "Tell the agent what to change...": "एजेंट को बताएँ क्या बदलना है…",
    "Attach image": "चित्र जोड़ें",
    "Enter to queue · {key}+Enter to send": "कतार में डालने के लिए Enter · भेजने के लिए {key}+Enter",
    Queue: "कतार में डालें",
    Send: "भेजें",
    "Annotate <{tag}>": "<{tag}> पर टिप्पणी",
  },
  vi: {
    Conversation: "Trò chuyện",
    "Show conversation": "Hiện trò chuyện",
    "Hide conversation": "Ẩn trò chuyện",
    "Minimize conversation": "Thu nhỏ trò chuyện",
    Minimize: "Thu nhỏ",
    "New reply": "Trả lời mới",
    "{n} queued": "{n} đang chờ",
    " ({n} queued)": " ({n} đang chờ)",
    " (new reply)": " (trả lời mới)",
    "Session ended": "Phiên đã kết thúc",
    "Agent is working…": "Agent đang xử lý…",
    "External listener active": "Trình nghe bên ngoài đang kết nối",
    "Agent listening": "Agent đang trực",
    "Agent not listening": "Agent không trực",
    More: "Thêm",
    Revisions: "Bản sửa",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "Agent tự ghi các bản sửa này trong trang. “Xem” sẽ đưa bạn tới chỗ tiếp theo được đánh dấu trong bản sửa đó; giao diện trang không thay đổi.",
    Reveal: "Xem",
    "Reveal {pos}/{total}": "Xem {pos}/{total}",
    "Reveal the next block changed in {label}": "Xem chỗ tiếp theo đã sửa trong “{label}”",
    "Ask about selected text": "Hỏi về đoạn văn đã chọn",
    "Toggle annotate/explore mode": "Bật/tắt hỏi khi chọn văn bản",
    Editing: "Tệp",
    "Copy path": "Sao chép đường dẫn",
    Copy: "Sao chép",
    Copied: "Đã sao chép",
    "Reload page": "Tải lại trang",
    "End session": "Kết thúc phiên",
    "Take over here": "Tiếp tục ở đây",
    "Check and reload": "Kiểm tra và tải lại",
    Dismiss: "Đóng",
    Reload: "Tải lại",
    "Message the agent, or select text on the page to ask about it":
      "Nhắn cho agent, hoặc chọn văn bản trên trang để hỏi",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Chọn bất kỳ câu nào trên trang để hỏi, hoặc viết tin nhắn bên dưới.",
    "Attach images": "Đính kèm ảnh",
    "Send everything and end the session": "Gửi tất cả và kết thúc phiên",
    "Send & End": "Gửi và kết thúc",
    "Send to Agent": "Gửi",
    "Session ended.": "Phiên đã kết thúc.",
    "To talk here again, copy this and send it to any agent.":
      "Để trò chuyện lại ở đây, hãy sao chép đoạn này và gửi cho bất kỳ agent nào.",
    "Talk with me in this Textcast window:": "Hãy trò chuyện với tôi trong cửa sổ Textcast này:",
    "Then follow the next_step it prints.": "Sau đó làm theo next_step mà lệnh in ra.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Trang này đang mở ở một tab khác. Nội dung chưa gửi chỉ lưu ở tab bạn đã nhập; tiếp tục ở đây sẽ không mang chúng theo.",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "Agent hiện không chờ tin nhắn. Nếu tình trạng kéo dài, hãy nhờ agent nghe lại (poll).",
    Agent: "Agent",
    You: "Bạn",
    Queued: "Đang chờ",
    "Sending…": "Đang gửi…",
    Cancel: "Hủy",
    Save: "Lưu",
    "Edit queued prompt": "Sửa tin đang chờ",
    "Remove queued prompt": "Xóa tin đang chờ",
    "Image message": "Tin nhắn ảnh",
    "Image annotation": "Ghi chú ảnh",
    "Image expired": "Ảnh đã hết hạn",
    "{n} more image": "Thêm {n} ảnh",
    "{n} more images": "Thêm {n} ảnh",
    Seen: "Đã xem",
    Working: "Đang xử lý",
    Done: "Xong",
    "Seen: not yet": "Chưa xem",
    "Working: not yet": "Chưa bắt đầu",
    "Done: not yet": "Chưa xong",
    "No agent is listening": "Không có agent trực",
    Delivering: "Đang chuyển",
    "Agent is busy; delivered on its next poll": "Agent đang bận; sẽ nhận được ở lần nghe tiếp theo",
    "Unsent annotation": "Ghi chú chưa gửi",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Phần nội dung gắn với ghi chú này đã bị xóa hoặc thay thế trên trang, nên không thể giữ ghi chú tại chỗ. Nội dung bạn viết được lưu ở đây:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Nội dung chưa gửi chỉ lưu ở tab bạn đã nhập; tiếp tục ở cửa sổ khác sẽ không mang chúng theo.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Tab này không có tin nào đang chờ. Nội dung chưa gửi chỉ lưu ở tab bạn đã nhập; tiếp tục ở cửa sổ khác sẽ không mang chúng theo.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Không có gì để gửi. Để kết thúc mà không góp ý, chọn “Kết thúc phiên” trong menu Thêm (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Vẫn đang thử gửi. Nội dung đã lưu trong tab này. Hãy giữ tab mở và kiểm tra máy chủ còn chạy.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Không gửi được. Nội dung vẫn đang chờ. Kiểm tra Textcast Chat còn chạy, rồi bấm “Gửi” lần nữa.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Không gửi được. Nội dung vẫn đang chờ. Kiểm tra Textcast Chat còn chạy, rồi bấm “Gửi và kết thúc” lần nữa.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Không chuẩn bị xong mọi thứ trong 5 giây. Phiên vẫn mở và các tin đang chờ vẫn sửa được.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Không gửi được vì nội dung quá lớn. Nó vẫn đang chờ. Bớt văn bản hoặc ảnh rồi thử lại.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Chưa gửi — {detail}. Xóa hoặc thay ảnh rồi gửi lại.",
    "more than {n} images on one prompt": "một tin nhắn có hơn {n} ảnh",
    "too many images queued at once": "quá nhiều ảnh đang chờ cùng lúc",
    "an image attachment was malformed": "một ảnh bị hỏng",
    "an image is no longer available": "một ảnh không còn dùng được",
    "some attachments could not be delivered": "một số ảnh không chuyển được",
    "Uploading…": "Đang tải lên…",
    "Upload failed": "Tải lên thất bại",
    Retry: "Thử lại",
    Remove: "Xóa",
    "Retry {name}": "Thử lại {name}",
    "Remove {name}": "Xóa {name}",
    "Remove image": "Xóa ảnh",
    "Could not read image": "Không đọc được ảnh",
    "Waiting for an image to finish uploading…": "Đang chờ ảnh tải lên xong…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Có ảnh chưa đính kèm được. Hãy thử lại hoặc xóa trước khi gửi.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Có ảnh chưa đính kèm được. Hãy thử lại hoặc xóa trước khi đưa vào hàng chờ.",
    "You can attach up to {n} image.": "Bạn có thể đính kèm tối đa {n} ảnh.",
    "You can attach up to {n} images.": "Bạn có thể đính kèm tối đa {n} ảnh.",
    "Image is larger than the {limit} limit": "Ảnh vượt giới hạn {limit}",
    "Unsupported file type. Use {types}.": "Không hỗ trợ loại tệp này. Hãy dùng {types}.",
    "Too many uploads. Wait a moment and retry.": "Tải lên quá nhiều. Chờ một lát rồi thử lại.",
    "Upload limit reached for this session ({limit}).": "Phiên này đã đạt giới hạn tải lên ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Quá nhiều ảnh đang tải lên cùng lúc. Chờ một lát rồi thử lại.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat đã được cập nhật. Trang này vẫn đang dùng phiên bản cũ.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat đã khởi động lại với bản dựng cục bộ. Trang này vẫn đang dùng phiên bản cũ.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat đã khởi động lại. Trang này vẫn đang dùng phiên bản cũ.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat đã dừng. Hãy tải lại trang sau khi chạy lại nó.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Máy chủ Textcast Chat của trang này không còn chạy. Tải lại sẽ được khi nó chạy lại.",
    "Textcast Chat did not answer.": "Textcast Chat không phản hồi.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat không phản hồi lần kiểm tra nên không biết nó có đang chạy không. Thử lại sau giây lát.",
    "Textcast Chat could not load this artifact.": "Không tải được trang.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat không phản hồi yêu cầu tải, thường do máy chủ khởi động lại khi trang đang mở. Bấm “Kiểm tra và tải lại” để kết nối lại.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat vẫn không phản hồi. Nhờ agent chạy lại, rồi bấm “Kiểm tra và tải lại”.",
    "This review is already open in another tab.": "Trang này đã mở ở một tab khác.",
    "Textcast Chat is not running.": "Textcast Chat không chạy.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat khởi động lại nhưng không chạy lên. Nhờ agent chạy lại, rồi kiểm tra và tải lại trang.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat vẫn chưa chạy. Nhờ agent chạy lại, rồi bấm “Kiểm tra và tải lại”.",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat vẫn chưa chạy. Hãy chạy lại, rồi bấm “Kiểm tra và tải lại”.",
    "Textcast Chat could not finish loading.": "Không tải xong được.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Script giao diện Textcast Chat không tải được, thường do máy chủ khởi động lại khi trang đang mở. Bấm “Kiểm tra và tải lại” để kết nối lại.",
    "Now playing": "Đang phát",
    "Close player": "Đóng trình phát",
    "Play the video when a line is clicked": "Phát video khi bấm vào câu",
    Ask: "Hỏi",
    "Ask about this, or say what to change...": "Hỏi về đoạn này, hoặc nói cần sửa gì…",
    "Tell the agent what to change...": "Nói với agent cần sửa gì…",
    "Attach image": "Đính kèm ảnh",
    "Enter to queue · {key}+Enter to send": "Enter để đưa vào hàng chờ · {key}+Enter để gửi",
    Queue: "Đưa vào hàng chờ",
    Send: "Gửi",
    "Annotate <{tag}>": "Ghi chú <{tag}>",
  },
  th: {
    Conversation: "บทสนทนา",
    "Show conversation": "แสดงบทสนทนา",
    "Hide conversation": "ซ่อนบทสนทนา",
    "Minimize conversation": "ย่อบทสนทนา",
    Minimize: "ย่อ",
    "New reply": "คำตอบใหม่",
    "{n} queued": "รอส่ง {n} รายการ",
    " ({n} queued)": " (รอส่ง {n} รายการ)",
    " (new reply)": " (คำตอบใหม่)",
    "Session ended": "เซสชันสิ้นสุดแล้ว",
    "Agent is working…": "เอเจนต์กำลังทำงาน…",
    "External listener active": "ตัวรับฟังภายนอกเชื่อมต่ออยู่",
    "Agent listening": "เอเจนต์ออนไลน์",
    "Agent not listening": "เอเจนต์ออฟไลน์",
    More: "เพิ่มเติม",
    Revisions: "การแก้ไข",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "เอเจนต์บันทึกการแก้ไขเหล่านี้ไว้ในหน้าเอง “แสดง” จะพาไปยังจุดถัดไปที่ทำเครื่องหมายไว้ในการแก้ไขนั้น โดยหน้าตาของหน้าไม่เปลี่ยน",
    Reveal: "แสดง",
    "Reveal {pos}/{total}": "แสดง {pos}/{total}",
    "Reveal the next block changed in {label}": "แสดงจุดถัดไปที่แก้ไขใน “{label}”",
    "Ask about selected text": "ถามเกี่ยวกับข้อความที่เลือก",
    "Toggle annotate/explore mode": "เปิด/ปิดการถามด้วยการเลือกข้อความ",
    Editing: "ไฟล์",
    "Copy path": "คัดลอกพาธ",
    Copy: "คัดลอก",
    Copied: "คัดลอกแล้ว",
    "Reload page": "โหลดหน้าใหม่",
    "End session": "จบเซสชัน",
    "Take over here": "ทำต่อที่นี่",
    "Check and reload": "ตรวจสอบและโหลดใหม่",
    Dismiss: "ปิด",
    Reload: "โหลดใหม่",
    "Message the agent, or select text on the page to ask about it":
      "ส่งข้อความถึงเอเจนต์ หรือเลือกข้อความในหน้าเพื่อถาม",
    "Select any sentence on the page to ask about it, or write a message below.":
      "เลือกประโยคใดก็ได้ในหน้าเพื่อถาม หรือพิมพ์ข้อความด้านล่าง",
    "Attach images": "แนบรูปภาพ",
    "Send everything and end the session": "ส่งทั้งหมดและจบเซสชัน",
    "Send & End": "ส่งและจบ",
    "Send to Agent": "ส่ง",
    "Session ended.": "เซสชันสิ้นสุดแล้ว",
    "To talk here again, copy this and send it to any agent.":
      "หากต้องการคุยต่อที่นี่ ให้คัดลอกข้อความนี้แล้วส่งให้เอเจนต์ใดก็ได้",
    "Talk with me in this Textcast window:": "คุยกับฉันในหน้าต่าง Textcast นี้:",
    "Then follow the next_step it prints.": "จากนั้นทำตาม next_step ที่คำสั่งแสดงออกมา",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "หน้านี้เปิดอยู่ในแท็บอื่น ข้อความที่ยังไม่ส่งจะอยู่ในแท็บที่พิมพ์ไว้เท่านั้น การทำต่อที่นี่จะไม่นำมาด้วย",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "เอเจนต์ไม่ได้รอรับข้อความอยู่ หากยังเป็นเช่นนี้ ให้ขอให้เอเจนต์กลับมารับฟัง (poll) อีกครั้ง",
    Agent: "เอเจนต์",
    You: "คุณ",
    Queued: "รอส่ง",
    "Sending…": "กำลังส่ง…",
    Cancel: "ยกเลิก",
    Save: "บันทึก",
    "Edit queued prompt": "แก้ไขข้อความที่รอส่ง",
    "Remove queued prompt": "ลบข้อความที่รอส่ง",
    "Image message": "ข้อความรูปภาพ",
    "Image annotation": "หมายเหตุรูปภาพ",
    "Image expired": "รูปภาพหมดอายุ",
    "{n} more image": "อีก {n} รูป",
    "{n} more images": "อีก {n} รูป",
    Seen: "อ่านแล้ว",
    Working: "กำลังทำ",
    Done: "เสร็จแล้ว",
    "Seen: not yet": "ยังไม่ได้อ่าน",
    "Working: not yet": "ยังไม่เริ่ม",
    "Done: not yet": "ยังไม่เสร็จ",
    "No agent is listening": "ไม่มีเอเจนต์ออนไลน์",
    Delivering: "กำลังส่งถึง",
    "Agent is busy; delivered on its next poll": "เอเจนต์ไม่ว่าง จะได้รับเมื่อรับฟังครั้งถัดไป",
    "Unsent annotation": "หมายเหตุที่ยังไม่ส่ง",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "ส่วนที่หมายเหตุนี้ผูกอยู่ถูกลบหรือแทนที่ในหน้า จึงเปิดค้างไว้ที่เดิมไม่ได้ ข้อความของคุณเก็บไว้ที่นี่:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "ข้อความที่ยังไม่ส่งจะอยู่ในแท็บที่พิมพ์ไว้เท่านั้น การทำต่อในหน้าต่างอื่นจะไม่นำมาด้วย",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "แท็บนี้ไม่มีข้อความรอส่ง ข้อความที่ยังไม่ส่งจะอยู่ในแท็บที่พิมพ์ไว้เท่านั้น การทำต่อในหน้าต่างอื่นจะไม่นำมาด้วย",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "ไม่มีอะไรให้ส่ง หากต้องการจบโดยไม่ส่งความเห็น ให้เลือก “จบเซสชัน” ในเมนูเพิ่มเติม (⋮)",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "ยังคงพยายามส่ง ข้อความบันทึกไว้ในแท็บนี้แล้ว โปรดเปิดแท็บไว้และตรวจสอบว่าเซิร์ฟเวอร์ยังทำงานอยู่",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "ส่งไม่สำเร็จ ข้อความยังรอส่งอยู่ ตรวจสอบว่า Textcast Chat ทำงานอยู่ แล้วกด “ส่ง” อีกครั้ง",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "ส่งไม่สำเร็จ ข้อความยังรอส่งอยู่ ตรวจสอบว่า Textcast Chat ทำงานอยู่ แล้วกด “ส่งและจบ” อีกครั้ง",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "เตรียมทุกอย่างไม่ทันใน 5 วินาที เซสชันยังเปิดอยู่ และยังแก้ไขข้อความที่รอส่งได้",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "ส่งไม่ได้เพราะเนื้อหาใหญ่เกินไป ข้อความยังรอส่งอยู่ ลบข้อความหรือรูปภาพบางส่วนแล้วลองใหม่",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "ยังไม่ได้ส่ง — {detail} ลบหรือเปลี่ยนรูปภาพแล้วส่งอีกครั้ง",
    "more than {n} images on one prompt": "มีรูปภาพเกิน {n} รูปในข้อความเดียว",
    "too many images queued at once": "รูปภาพรอส่งพร้อมกันมากเกินไป",
    "an image attachment was malformed": "มีรูปภาพที่เสียหาย",
    "an image is no longer available": "มีรูปภาพที่ใช้ไม่ได้แล้ว",
    "some attachments could not be delivered": "ส่งรูปภาพบางรูปไม่สำเร็จ",
    "Uploading…": "กำลังอัปโหลด…",
    "Upload failed": "อัปโหลดไม่สำเร็จ",
    Retry: "ลองใหม่",
    Remove: "ลบ",
    "Retry {name}": "ลอง {name} ใหม่",
    "Remove {name}": "ลบ {name}",
    "Remove image": "ลบรูปภาพ",
    "Could not read image": "อ่านรูปภาพไม่ได้",
    "Waiting for an image to finish uploading…": "กำลังรอรูปภาพอัปโหลดเสร็จ…",
    "An image couldn't be attached. Retry or remove it before sending.": "แนบรูปภาพไม่สำเร็จ ลองใหม่หรือลบออกก่อนส่ง",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "แนบรูปภาพไม่สำเร็จ ลองใหม่หรือลบออกก่อนเพิ่มเข้ารายการรอส่ง",
    "You can attach up to {n} image.": "แนบรูปภาพได้สูงสุด {n} รูป",
    "You can attach up to {n} images.": "แนบรูปภาพได้สูงสุด {n} รูป",
    "Image is larger than the {limit} limit": "รูปภาพใหญ่เกินขีดจำกัด {limit}",
    "Unsupported file type. Use {types}.": "ไม่รองรับไฟล์ประเภทนี้ โปรดใช้ {types}",
    "Too many uploads. Wait a moment and retry.": "อัปโหลดบ่อยเกินไป รอสักครู่แล้วลองใหม่",
    "Upload limit reached for this session ({limit}).": "เซสชันนี้อัปโหลดครบขีดจำกัดแล้ว ({limit})",
    "Too many uploads in flight. Wait a moment and retry.": "กำลังอัปโหลดพร้อมกันมากเกินไป รอสักครู่แล้วลองใหม่",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat อัปเดตแล้ว หน้านี้ยังใช้เวอร์ชันก่อนหน้าอยู่",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat รีสตาร์ตด้วยบิลด์ในเครื่องแล้ว หน้านี้ยังใช้เวอร์ชันก่อนหน้าอยู่",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat รีสตาร์ตแล้ว หน้านี้ยังใช้เวอร์ชันก่อนหน้าอยู่",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat หยุดทำงานแล้ว โหลดหน้าใหม่หลังจากเปิดใช้อีกครั้ง",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "เซิร์ฟเวอร์ Textcast Chat ของหน้านี้ไม่ทำงานแล้ว จะโหลดใหม่ได้เมื่อกลับมาทำงาน",
    "Textcast Chat did not answer.": "Textcast Chat ไม่ตอบสนอง",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat ไม่ตอบการตรวจสอบ จึงไม่ทราบว่ายังทำงานอยู่หรือไม่ ลองใหม่อีกครู่",
    "Textcast Chat could not load this artifact.": "โหลดหน้าไม่สำเร็จ",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat ไม่ตอบคำขอโหลด มักเป็นเพราะเซิร์ฟเวอร์รีสตาร์ตระหว่างเปิดหน้า กด “ตรวจสอบและโหลดใหม่” เพื่อเชื่อมต่ออีกครั้ง",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat ยังไม่ตอบสนอง ให้เอเจนต์เปิดใช้อีกครั้ง แล้วกด “ตรวจสอบและโหลดใหม่”",
    "This review is already open in another tab.": "หน้านี้เปิดอยู่ในแท็บอื่นแล้ว",
    "Textcast Chat is not running.": "Textcast Chat ไม่ได้ทำงาน",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat รีสตาร์ตแล้วไม่กลับมา ให้เอเจนต์เปิดใช้อีกครั้ง แล้วตรวจสอบและโหลดหน้าใหม่",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat ยังไม่ทำงาน ให้เอเจนต์เปิดใช้อีกครั้ง แล้วกด “ตรวจสอบและโหลดใหม่”",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat ยังไม่ทำงาน เปิดใช้อีกครั้ง แล้วกด “ตรวจสอบและโหลดใหม่”",
    "Textcast Chat could not finish loading.": "โหลดไม่เสร็จ",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "สคริปต์หน้าจอ Textcast Chat โหลดไม่สำเร็จ มักเป็นเพราะเซิร์ฟเวอร์รีสตาร์ตระหว่างเปิดหน้า กด “ตรวจสอบและโหลดใหม่” เพื่อเชื่อมต่ออีกครั้ง",
    "Now playing": "กำลังเล่น",
    "Close player": "ปิดตัวเล่น",
    "Play the video when a line is clicked": "เล่นวิดีโอเมื่อคลิกประโยค",
    Ask: "ถาม",
    "Ask about this, or say what to change...": "ถามเกี่ยวกับส่วนนี้ หรือบอกสิ่งที่ต้องแก้…",
    "Tell the agent what to change...": "บอกเอเจนต์ว่าต้องแก้อะไร…",
    "Attach image": "แนบรูปภาพ",
    "Enter to queue · {key}+Enter to send": "Enter เพื่อเพิ่มเข้ารายการรอส่ง · {key}+Enter เพื่อส่ง",
    Queue: "รอส่ง",
    Send: "ส่ง",
    "Annotate <{tag}>": "หมายเหตุ <{tag}>",
  },
  id: {
    Conversation: "Percakapan",
    "Show conversation": "Tampilkan percakapan",
    "Hide conversation": "Sembunyikan percakapan",
    "Minimize conversation": "Perkecil percakapan",
    Minimize: "Perkecil",
    "New reply": "Balasan baru",
    "{n} queued": "{n} dalam antrean",
    " ({n} queued)": " ({n} dalam antrean)",
    " (new reply)": " (balasan baru)",
    "Session ended": "Sesi berakhir",
    "Agent is working…": "Agen sedang bekerja…",
    "External listener active": "Pendengar eksternal aktif",
    "Agent listening": "Agen siaga",
    "Agent not listening": "Agen tidak siaga",
    More: "Lainnya",
    Revisions: "Revisi",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "Agen mencatat revisi ini di dalam halaman. “Tampilkan” membawa Anda ke bagian berikutnya yang ditandai pada revisi itu; tampilan halaman tidak berubah.",
    Reveal: "Tampilkan",
    "Reveal {pos}/{total}": "Tampilkan {pos}/{total}",
    "Reveal the next block changed in {label}": "Tampilkan bagian berikutnya yang diubah di “{label}”",
    "Ask about selected text": "Tanya tentang teks terpilih",
    "Toggle annotate/explore mode": "Aktifkan/nonaktifkan tanya lewat pilihan teks",
    Editing: "Berkas",
    "Copy path": "Salin jalur",
    Copy: "Salin",
    Copied: "Tersalin",
    "Reload page": "Muat ulang halaman",
    "End session": "Akhiri sesi",
    "Take over here": "Lanjutkan di sini",
    "Check and reload": "Periksa dan muat ulang",
    Dismiss: "Tutup",
    Reload: "Muat ulang",
    "Message the agent, or select text on the page to ask about it":
      "Kirim pesan ke agen, atau pilih teks di halaman untuk bertanya",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Pilih kalimat mana pun di halaman untuk bertanya, atau tulis pesan di bawah.",
    "Attach images": "Lampirkan gambar",
    "Send everything and end the session": "Kirim semua dan akhiri sesi",
    "Send & End": "Kirim & akhiri",
    "Send to Agent": "Kirim",
    "Session ended.": "Sesi berakhir.",
    "To talk here again, copy this and send it to any agent.":
      "Untuk mengobrol lagi di sini, salin teks ini lalu kirim ke agen mana pun.",
    "Talk with me in this Textcast window:": "Ngobrol denganku di jendela Textcast ini:",
    "Then follow the next_step it prints.": "Lalu ikuti next_step yang ditampilkannya.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Halaman ini terbuka di tab lain. Jawaban yang belum terkirim tetap di tab tempat Anda mengetiknya; melanjutkan di sini tidak membawanya.",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "Agen Anda sedang tidak menunggu pesan. Jika terus begini, minta agen untuk mendengarkan lagi (poll).",
    Agent: "Agen",
    You: "Anda",
    Queued: "Dalam antrean",
    "Sending…": "Mengirim…",
    Cancel: "Batal",
    Save: "Simpan",
    "Edit queued prompt": "Ubah pesan dalam antrean",
    "Remove queued prompt": "Hapus pesan dalam antrean",
    "Image message": "Pesan gambar",
    "Image annotation": "Catatan gambar",
    "Image expired": "Gambar kedaluwarsa",
    "{n} more image": "{n} gambar lagi",
    "{n} more images": "{n} gambar lagi",
    Seen: "Dibaca",
    Working: "Diproses",
    Done: "Selesai",
    "Seen: not yet": "Belum dibaca",
    "Working: not yet": "Belum diproses",
    "Done: not yet": "Belum selesai",
    "No agent is listening": "Tidak ada agen yang siaga",
    Delivering: "Mengantarkan",
    "Agent is busy; delivered on its next poll": "Agen sedang sibuk; pesan diterima saat ia mendengarkan lagi",
    "Unsent annotation": "Catatan belum terkirim",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Bagian yang terkait dengan catatan ini dihapus atau diganti di halaman, jadi catatan tidak bisa tetap di tempatnya. Teks Anda disimpan di sini:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Jawaban yang belum terkirim tetap di tab tempat Anda mengetiknya; melanjutkan di jendela lain tidak membawanya.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Tidak ada antrean di tab ini. Jawaban yang belum terkirim tetap di tab tempat Anda mengetiknya; melanjutkan di jendela lain tidak membawanya.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Tidak ada yang dikirim. Untuk mengakhiri tanpa masukan, pilih “Akhiri sesi” di menu Lainnya (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Masih mencoba mengirim. Teks Anda tersimpan di tab ini. Biarkan tab tetap terbuka dan pastikan server berjalan.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Gagal mengirim. Teks Anda masih dalam antrean. Pastikan Textcast Chat berjalan, lalu klik “Kirim” lagi.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Gagal mengirim. Teks Anda masih dalam antrean. Pastikan Textcast Chat berjalan, lalu klik “Kirim & akhiri” lagi.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Tidak semua bisa disiapkan dalam 5 detik. Sesi tetap terbuka dan pesan dalam antrean masih bisa diubah.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Gagal mengirim karena isinya terlalu besar. Masih dalam antrean. Kurangi teks atau gambar, lalu coba lagi.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Tidak terkirim — {detail}. Hapus atau ganti gambar, lalu kirim lagi.",
    "more than {n} images on one prompt": "lebih dari {n} gambar dalam satu pesan",
    "too many images queued at once": "terlalu banyak gambar dalam antrean sekaligus",
    "an image attachment was malformed": "ada gambar yang rusak",
    "an image is no longer available": "ada gambar yang sudah tidak tersedia",
    "some attachments could not be delivered": "beberapa gambar tidak bisa diantarkan",
    "Uploading…": "Mengunggah…",
    "Upload failed": "Gagal mengunggah",
    Retry: "Coba lagi",
    Remove: "Hapus",
    "Retry {name}": "Coba lagi {name}",
    "Remove {name}": "Hapus {name}",
    "Remove image": "Hapus gambar",
    "Could not read image": "Gambar tidak bisa dibaca",
    "Waiting for an image to finish uploading…": "Menunggu gambar selesai diunggah…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Ada gambar yang gagal dilampirkan. Coba lagi atau hapus sebelum mengirim.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Ada gambar yang gagal dilampirkan. Coba lagi atau hapus sebelum memasukkan ke antrean.",
    "You can attach up to {n} image.": "Anda bisa melampirkan hingga {n} gambar.",
    "You can attach up to {n} images.": "Anda bisa melampirkan hingga {n} gambar.",
    "Image is larger than the {limit} limit": "Gambar melebihi batas {limit}",
    "Unsupported file type. Use {types}.": "Jenis berkas tidak didukung. Gunakan {types}.",
    "Too many uploads. Wait a moment and retry.": "Terlalu banyak unggahan. Tunggu sebentar lalu coba lagi.",
    "Upload limit reached for this session ({limit}).": "Batas unggahan sesi ini tercapai ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Terlalu banyak unggahan berjalan bersamaan. Tunggu sebentar lalu coba lagi.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat telah diperbarui. Halaman ini masih memakai versi sebelumnya.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat dimulai ulang dengan build lokal. Halaman ini masih memakai versi sebelumnya.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat dimulai ulang. Halaman ini masih memakai versi sebelumnya.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat dihentikan. Muat ulang halaman setelah menjalankannya lagi.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Server Textcast Chat untuk halaman ini sudah tidak berjalan. Muat ulang akan berhasil saat server berjalan lagi.",
    "Textcast Chat did not answer.": "Textcast Chat tidak merespons.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat tidak menjawab pemeriksaan, jadi tidak diketahui apakah sedang berjalan. Coba lagi sebentar lagi.",
    "Textcast Chat could not load this artifact.": "Halaman gagal dimuat.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat tidak merespons permintaan muat, biasanya karena server dimulai ulang saat halaman dibuka. Pilih “Periksa dan muat ulang” untuk menyambung lagi.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat masih tidak merespons. Minta agen menjalankannya lagi, lalu pilih “Periksa dan muat ulang”.",
    "This review is already open in another tab.": "Halaman ini sudah terbuka di tab lain.",
    "Textcast Chat is not running.": "Textcast Chat tidak berjalan.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat dimulai ulang tetapi tidak kembali. Minta agen menjalankannya lagi, lalu periksa dan muat ulang halaman.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat masih belum berjalan. Minta agen menjalankannya lagi, lalu pilih “Periksa dan muat ulang”.",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat masih belum berjalan. Jalankan lagi, lalu pilih “Periksa dan muat ulang”.",
    "Textcast Chat could not finish loading.": "Gagal menyelesaikan pemuatan.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Skrip antarmuka Textcast Chat tidak termuat, biasanya karena server dimulai ulang saat halaman dibuka. Pilih “Periksa dan muat ulang” untuk menyambung lagi.",
    "Now playing": "Sedang diputar",
    "Close player": "Tutup pemutar",
    "Play the video when a line is clicked": "Putar video saat kalimat diklik",
    Ask: "Tanya",
    "Ask about this, or say what to change...": "Tanyakan tentang ini, atau sebutkan yang perlu diubah…",
    "Tell the agent what to change...": "Beri tahu agen apa yang perlu diubah…",
    "Attach image": "Lampirkan gambar",
    "Enter to queue · {key}+Enter to send": "Enter untuk masuk antrean · {key}+Enter untuk kirim",
    Queue: "Masukkan antrean",
    Send: "Kirim",
    "Annotate <{tag}>": "Catatan untuk <{tag}>",
  },
  tr: {
    Conversation: "Sohbet",
    "Show conversation": "Sohbeti göster",
    "Hide conversation": "Sohbeti gizle",
    "Minimize conversation": "Sohbeti küçült",
    Minimize: "Küçült",
    "New reply": "Yeni yanıt",
    "{n} queued": "{n} sırada",
    " ({n} queued)": " ({n} sırada)",
    " (new reply)": " (yeni yanıt)",
    "Session ended": "Oturum sona erdi",
    "Agent is working…": "Ajan çalışıyor…",
    "External listener active": "Harici dinleyici bağlı",
    "Agent listening": "Ajan dinliyor",
    "Agent not listening": "Ajan bağlı değil",
    More: "Diğer",
    Revisions: "Düzeltmeler",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "Ajan bu düzeltmeleri sayfanın içine yazar. “Göster”, o düzeltmede işaretlenen bir sonraki yere götürür; sayfanın görünümü değişmez.",
    Reveal: "Göster",
    "Reveal {pos}/{total}": "Göster {pos}/{total}",
    "Reveal the next block changed in {label}": "“{label}” içinde değişen sonraki yeri göster",
    "Ask about selected text": "Seçili metin hakkında sor",
    "Toggle annotate/explore mode": "Seçerek sormayı aç/kapat",
    Editing: "Dosya",
    "Copy path": "Yolu kopyala",
    Copy: "Kopyala",
    Copied: "Kopyalandı",
    "Reload page": "Sayfayı yeniden yükle",
    "End session": "Oturumu bitir",
    "Take over here": "Burada devam et",
    "Check and reload": "Kontrol et ve yeniden yükle",
    Dismiss: "Kapat",
    Reload: "Yeniden yükle",
    "Message the agent, or select text on the page to ask about it":
      "Ajana mesaj yazın ya da sormak için sayfada metin seçin",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Sormak için sayfadaki herhangi bir cümleyi seçin ya da aşağıya mesaj yazın.",
    "Attach images": "Görsel ekle",
    "Send everything and end the session": "Hepsini gönder ve oturumu bitir",
    "Send & End": "Gönder ve bitir",
    "Send to Agent": "Gönder",
    "Session ended.": "Oturum sona erdi.",
    "To talk here again, copy this and send it to any agent.":
      "Burada yeniden konuşmak için bunu kopyalayıp herhangi bir ajana gönderin.",
    "Talk with me in this Textcast window:": "Bu Textcast penceresinde benimle konuş:",
    "Then follow the next_step it prints.": "Ardından çıktısındaki next_step'i izle.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Bu sayfa başka bir sekmede açık. Gönderilmemiş yanıtlar yazıldıkları sekmede kalır; burada devam etmek onları taşımaz.",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "Ajanınız şu an mesaj beklemiyor. Böyle sürerse ajandan yeniden dinlemesini (poll) isteyin.",
    Agent: "Ajan",
    You: "Siz",
    Queued: "Sırada",
    "Sending…": "Gönderiliyor…",
    Cancel: "İptal",
    Save: "Kaydet",
    "Edit queued prompt": "Sıradaki mesajı düzenle",
    "Remove queued prompt": "Sıradaki mesajı sil",
    "Image message": "Görsel mesaj",
    "Image annotation": "Görsel notu",
    "Image expired": "Görselin süresi doldu",
    "{n} more image": "{n} görsel daha",
    "{n} more images": "{n} görsel daha",
    Seen: "Görüldü",
    Working: "İşleniyor",
    Done: "Tamamlandı",
    "Seen: not yet": "Henüz görülmedi",
    "Working: not yet": "Henüz başlanmadı",
    "Done: not yet": "Henüz tamamlanmadı",
    "No agent is listening": "Bağlı ajan yok",
    Delivering: "İletiliyor",
    "Agent is busy; delivered on its next poll": "Ajan meşgul; bir sonraki dinlemede iletilecek",
    "Unsent annotation": "Gönderilmemiş not",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Bu notun bağlı olduğu kısım sayfadan silindi ya da değiştirildi, bu yüzden not yerinde açık tutulamadı. Yazdıklarınız burada saklanıyor:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Gönderilmemiş yanıtlar yazıldıkları sekmede kalır; başka bir pencerede devam etmek onları taşımaz.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Bu sekmede sırada bir şey yok. Gönderilmemiş yanıtlar yazıldıkları sekmede kalır; başka bir pencerede devam etmek onları taşımaz.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Gönderilecek bir şey yok. Geri bildirim vermeden bitirmek için Diğer menüsünden (⋮) “Oturumu bitir”i seçin.",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Göndermeye çalışılıyor. Yazdıklarınız bu sekmede kayıtlı. Sekmeyi açık tutun ve sunucunun çalıştığını kontrol edin.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Gönderilemedi. Yazdıklarınız hâlâ sırada. Textcast Chat'in çalıştığını kontrol edip yeniden “Gönder”e tıklayın.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Gönderilemedi. Yazdıklarınız hâlâ sırada. Textcast Chat'in çalıştığını kontrol edip yeniden “Gönder ve bitir”e tıklayın.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Her şey 5 saniye içinde hazırlanamadı. Oturum açık kalıyor ve sıradaki mesajlar hâlâ düzenlenebilir.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "İçerik çok büyük olduğu için gönderilemedi. Hâlâ sırada. Biraz metin ya da görsel çıkarıp yeniden deneyin.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Gönderilmedi — {detail}. Görseli silin ya da değiştirin, sonra yeniden gönderin.",
    "more than {n} images on one prompt": "bir mesajda {n} görselden fazla",
    "too many images queued at once": "aynı anda sırada çok fazla görsel",
    "an image attachment was malformed": "bir görsel bozuk",
    "an image is no longer available": "bir görsel artık kullanılamıyor",
    "some attachments could not be delivered": "bazı görseller iletilemedi",
    "Uploading…": "Yükleniyor…",
    "Upload failed": "Yükleme başarısız",
    Retry: "Yeniden dene",
    Remove: "Sil",
    "Retry {name}": "{name} için yeniden dene",
    "Remove {name}": "{name} öğesini sil",
    "Remove image": "Görseli sil",
    "Could not read image": "Görsel okunamadı",
    "Waiting for an image to finish uploading…": "Görselin yüklenmesi bekleniyor…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Bir görsel eklenemedi. Göndermeden önce yeniden deneyin ya da silin.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Bir görsel eklenemedi. Sıraya almadan önce yeniden deneyin ya da silin.",
    "You can attach up to {n} image.": "En fazla {n} görsel ekleyebilirsiniz.",
    "You can attach up to {n} images.": "En fazla {n} görsel ekleyebilirsiniz.",
    "Image is larger than the {limit} limit": "Görsel {limit} sınırını aşıyor",
    "Unsupported file type. Use {types}.": "Desteklenmeyen dosya türü. {types} kullanın.",
    "Too many uploads. Wait a moment and retry.": "Çok fazla yükleme. Biraz bekleyip yeniden deneyin.",
    "Upload limit reached for this session ({limit}).": "Bu oturumun yükleme sınırına ulaşıldı ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Aynı anda çok fazla yükleme var. Biraz bekleyip yeniden deneyin.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat güncellendi. Bu sayfa hâlâ önceki sürümü kullanıyor.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat yerel bir derlemeyle yeniden başlatıldı. Bu sayfa hâlâ önceki sürümü kullanıyor.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat yeniden başlatıldı. Bu sayfa hâlâ önceki sürümü kullanıyor.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat durduruldu. Yeniden başlattıktan sonra sayfayı yenileyin.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Bu sayfanın bağlı olduğu Textcast Chat sunucusu artık çalışmıyor. Yeniden çalıştığında sayfa yenilenebilir.",
    "Textcast Chat did not answer.": "Textcast Chat yanıt vermedi.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat kontrole yanıt vermedi, bu yüzden çalışıp çalışmadığı anlaşılamıyor. Birazdan yeniden deneyin.",
    "Textcast Chat could not load this artifact.": "Sayfa yüklenemedi.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat yükleme isteğine yanıt vermedi; genelde sayfa açılırken sunucu yeniden başlamıştır. Yeniden bağlanmak için “Kontrol et ve yeniden yükle”yi kullanın.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat hâlâ yanıt vermiyor. Ajanınızdan yeniden başlatmasını isteyin, sonra “Kontrol et ve yeniden yükle”yi kullanın.",
    "This review is already open in another tab.": "Bu sayfa zaten başka bir sekmede açık.",
    "Textcast Chat is not running.": "Textcast Chat çalışmıyor.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat yeniden başladı ama geri gelmedi. Ajanınızdan yeniden başlatmasını isteyin, sonra sayfayı kontrol edip yenileyin.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat hâlâ çalışmıyor. Ajanınızdan yeniden başlatmasını isteyin, sonra “Kontrol et ve yeniden yükle”yi kullanın.",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat hâlâ çalışmıyor. Yeniden başlatın, sonra “Kontrol et ve yeniden yükle”yi kullanın.",
    "Textcast Chat could not finish loading.": "Yükleme tamamlanamadı.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat arayüz betiği yüklenmedi; genelde sayfa açılırken sunucu yeniden başlamıştır. Yeniden bağlanmak için “Kontrol et ve yeniden yükle”yi kullanın.",
    "Now playing": "Oynatılıyor",
    "Close player": "Oynatıcıyı kapat",
    "Play the video when a line is clicked": "Bir cümleye tıklanınca videoyu oynat",
    Ask: "Sor",
    "Ask about this, or say what to change...": "Bununla ilgili sorun ya da neyin değişeceğini yazın…",
    "Tell the agent what to change...": "Ajana neyin değişeceğini söyleyin…",
    "Attach image": "Görsel ekle",
    "Enter to queue · {key}+Enter to send": "Sıraya almak için Enter · göndermek için {key}+Enter",
    Queue: "Sıraya al",
    Send: "Gönder",
    "Annotate <{tag}>": "<{tag}> için not",
  },
};
