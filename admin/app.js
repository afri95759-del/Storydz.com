// ==========================================
// 1. الإعدادات الأساسية
// ==========================================
const GITHUB_TOKEN = "ghp_ضع_التوكن_هنا"; // ⚠️ ضع التوكن الخاص بك هنا
const REPO_OWNER = "afri95759-del";
const REPO_NAME = "Storydz.com";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

let allStories = [];
let currentStoryPath = null;
let currentStorySha = null;

// تهيئة محرر النصوص
const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'اكتب محتوى القصة هنا...',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    }
});

// ==========================================
// 2. أدوات مساعدة (UI & Settings)
// ==========================================
function switchTab(tabId, el) {
    document.getElementById('ai-tab').style.display = tabId === 'ai-tab' ? 'block' : 'none';
    document.getElementById('stories-tab').style.display = tabId === 'stories-tab' ? 'block' : 'none';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => toast.className = 'toast', 3000);
}

function toggleTheme() {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        document.querySelector('.theme-toggle').innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.querySelector('.theme-toggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

// استرجاع الثيم والمفتاح المحفوظ
if (localStorage.getItem('theme') === 'dark') toggleTheme();
if (localStorage.getItem('gemini_key')) document.getElementById('gemini-api-key').value = localStorage.getItem('gemini_key');

function saveApiKey() {
    localStorage.setItem('gemini_key', document.getElementById('gemini-api-key').value);
    showToast("تم حفظ مفتاح API بنجاح!");
}

// ==========================================
// 3. جلب القصص من GitHub
// ==========================================
async function fetchStories() {
    const dropdown = document.getElementById('story-dropdown');
    allStories = [];
    dropdown.innerHTML = '<option value="">-- جارٍ التحميل... --</option>';
    
    try {
        const rootRes = await fetch(`${API_BASE}`, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
        if (!rootRes.ok) throw new Error("تأكد من التوكن");
        const rootDirs = await rootRes.json();

        for (let dir of rootDirs) {
            if (dir.type === 'dir' && ['ar', 'en', 'fr'].includes(dir.name)) {
                const langRes = await fetch(`${API_BASE}/${dir.name}`, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
                const subDirs = await langRes.json();

                for (let subDir of subDirs) {
                    if (subDir.type === 'dir') {
                        const filesRes = await fetch(`${API_BASE}/${dir.name}/${subDir.name}`, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
                        const files = await filesRes.json();
                        for (let file of files) {
                            if (file.name.endsWith('.html')) {
                                allStories.push({ name: file.name, path: file.path, sha: file.sha, lang: dir.name, category: subDir.name });
                            }
                        }
                    }
                }
            }
        }

        allStories.sort((a, b) => a.name.localeCompare(b.name));
        dropdown.innerHTML = '<option value="">-- اختر قصة لتعديلها --</option>';
        allStories.forEach((story, index) => {
            dropdown.innerHTML += `<option value="${index}">${story.name.replace('.html', '')} (${story.lang} - ${story.category})</option>`;
        });
        showToast(`تم تحميل ${allStories.length} قصة.`);

    } catch (error) {
        dropdown.innerHTML = `<option value="">خطأ في التحميل</option>`;
        showToast(`خطأ: ${error.message}`, true);
    }
}

// ==========================================
// 4. تحميل بيانات القصة
// ==========================================
async function loadStoryData() {
    const index = document.getElementById('story-dropdown').value;
    if (index === "") return;
    
    const story = allStories[index];
    currentStoryPath = story.path;
    currentStorySha = story.sha;
    
    showToast("جارٍ التحميل...");
    
    try {
        const res = await fetch(`${API_BASE}/${story.path}`, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
        const data = await res.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        
        const title = doc.querySelector('title')?.innerText || '';
        const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        
        // استخراج المحتوى (داخل article أو main)
        const bodyContent = doc.querySelector('article')?.innerHTML || doc.querySelector('main')?.innerHTML || doc.querySelector('body')?.innerHTML;

        document.getElementById('story-lang').value = story.lang;
        document.getElementById('story-category').value = story.category;
        document.getElementById('story-filename').value = story.name.replace('.html', '');
        document.getElementById('story-title').value = title;
        document.getElementById('story-desc').value = desc;
        
        // تعيين محتوى المحرر
        quill.root.innerHTML = bodyContent;
        
        // الصور والفيديو
        document.getElementById('story-img-url').value = doc.querySelector('img')?.getAttribute('src') || '';
        document.getElementById('story-video-url').value = doc.querySelector('iframe')?.getAttribute('src') || '';
        
        previewImage();
        previewVideo();
        showToast("تم التحميل.");
    } catch (error) {
        showToast(`فشل التحميل: ${error.message}`, true);
    }
}

// ==========================================
// 5. المعاينة
// ==========================================
function previewImage() {
    let url = document.getElementById('story-img-url').value;
    const box = document.getElementById('img-preview');
    if (url) {
        if (url.includes('drive.google.com/file/d/')) {
            const id = url.split('/d/')[1].split('/')[0];
            url = `https://lh3.googleusercontent.com/d/${id}`;
        }
        box.innerHTML = `<img src="${url}" onerror="this.src='https://via.placeholder.com/150?text=Error'">`;
    } else { box.innerHTML = 'لا توجد صورة'; }
}

function previewVideo() {
    const url = document.getElementById('story-video-url').value;
    const box = document.getElementById('video-preview');
    if (url) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let id = url.split('v=')[1] || url.split('youtu.be/')[1];
            if (id) id = id.split('&')[0];
            box.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
        } else { box.innerHTML = `<p>فيديو (سيتم معالجته)</p>`; }
    } else { box.innerHTML = 'لا يوجد فيديو'; }
}

// ==========================================
// 6. حفظ القصة في GitHub
// ==========================================
async function saveStoryToGitHub() {
    const title = document.getElementById('story-title').value;
    const content = quill.root.innerHTML;
    const filename = document.getElementById('story-filename').value.trim();
    const lang = document.getElementById('story-lang').value;
    const category = document.getElementById('story-category').value;
    
    if (!title || !filename || content === '<p><br></p>') {
        showToast("املأ العنوان، اسم الملف، والمحتوى.", true);
        return;
    }

    const btn = document.getElementById('save-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الحفظ...';
    btn.disabled = true;

    // بناء ملف HTML متكامل
    const htmlContent = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${document.getElementById('story-desc').value}">
</head>
<body>
    ${document.getElementById('story-img-url').value ? `<img src="${document.getElementById('story-img-url').value}" alt="${title}" style="max-width:100%;">` : ''}
    ${document.getElementById('story-video-url').value ? `<iframe src="${document.getElementById('story-video-url').value}" allowfullscreen style="width:100%; aspect-ratio:16/9;"></iframe>` : ''}
    <article>
        ${content}
    </article>
</body>
</html>`;

    const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
    const path = currentStoryPath || `${lang}/${category}/${filename}.html`;

    const body = {
        message: `تحديث قصة: ${title}`,
        content: base64Content,
        sha: currentStorySha
    };

    try {
        const res = await fetch(`${API_BASE}/${path}`, {
            method: 'PUT',
            headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast("تم الحفظ بنجاح في GitHub!");
            setTimeout(() => { fetchStories(); resetForm(); }, 1500);
        } else {
            const err = await res.json();
            showToast(`فشل: ${err.message}`, true);
        }
    } catch (error) {
        showToast(`خطأ: ${error.message}`, true);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-save"></i> حفظ التعديلات في GitHub';
        btn.disabled = false;
    }
}

// ==========================================
// 7. رفع الصور إلى GitHub
// ==========================================
async function uploadImageToGitHub(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    // تحويل الصورة إلى Base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result.split(',')[1];
        const filename = `img-${Date.now()}.${file.name.split('.').pop()}`;
        const path = `images/${filename}`;

        showToast("جارٍ رفع الصورة إلى GitHub...");

        try {
            const res = await fetch(`${API_BASE}/${path}`, {
                method: 'PUT',
                headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `رفع صورة: ${filename}`,
                    content: base64Data
                })
            });

            if (res.ok) {
                const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`;
                document.getElementById('story-img-url').value = rawUrl;
                previewImage();
                showToast("تم رفع الصورة بنجاح!");
            } else {
                showToast("فشل رفع الصورة.", true);
            }
        } catch (error) {
            showToast(`خطأ في الرفع: ${error.message}`, true);
        }
    };
    reader.readAsDataURL(file);
}

// ==========================================
// 8. المساعد الذكي (Gemini API)
// ==========================================
async function sendMessage() {
    const apiKey = document.getElementById('gemini-api-key').value;
    const input = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');
    const userMsg = input.value.trim();
    
    if (!apiKey) { showToast("أدخل مفتاح Gemini API أولاً.", true); return; }
    if (!userMsg) return;

    // إضافة رسالة المستخدم
    chatWindow.innerHTML += `<div class="chat-msg user">${userMsg}</div>`;
    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // إضافة مؤشر التفكير
    const loadingId = 'loading-' + Date.now();
    chatWindow.innerHTML += `<div class="chat-msg ai" id="${loadingId}"><i class="fa-solid fa-spinner fa-spin"></i> جارٍ التفكير...</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // جلب محتوى القصة الحالية لإعطائها للمساعد كسياق
    const currentContent = quill.getText();

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `أنت مساعد ذكي لموقع قصص. هذا هو النص الحالي للقصة: "${currentContent}". بناءً على طلب المستخدم: "${userMsg}". أجب باختصار أو قدم النص المعدل مباشرة.` }]
                }]
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.candidates && data.candidates[0].content) {
            const aiReply = data.candidates[0].content.parts[0].text;
            chatWindow.innerHTML += `<div class="chat-msg ai">${aiReply}</div>`;
        } else {
            chatWindow.innerHTML += `<div class="chat-msg ai" style="color:red;">حدث خطأ في الاتصال بـ Gemini.</div>`;
        }
    } catch (error) {
        document.getElementById(loadingId).remove();
        chatWindow.innerHTML += `<div class="chat-msg ai" style="color:red;">خطأ في الشبكة: ${error.message}</div>`;
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function resetForm() {
    currentStoryPath = null;
    currentStorySha = null;
    document.getElementById('story-dropdown').value = '';
    document.getElementById('story-filename').value = '';
    document.getElementById('story-title').value = '';
    document.getElementById('story-desc').value = '';
    document.getElementById('story-img-url').value = '';
    document.getElementById('story-video-url').value = '';
    quill.root.innerHTML = '';
    previewImage();
    previewVideo();
}

// تشغيل الجلب عند التحميل
window.onload = fetchStories;
