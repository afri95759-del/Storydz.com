const fs = require('fs');
const path = require('path');

// قائمة الـ 15 صفحة اليتيمة التي ظهرت في فحص Ahrefs بدقة
const orphanPages = [
    { url: 'fr/war-stories/srebrenica-massacre-1995.html', title: 'Le Massacre de Srebrenica 1995' },
    { url: 'fr/crusades-jihad/battle-of-hattin-1187.html', title: 'La Bataille de Hattin 1187' },
    { url: 'fr/crusades-jihad/berw-with-crusade-mansourah.html', title: 'La Septième Croisade - Mansourah' },
    { url: 'fr/revolutions/chinese-communist-revolution.html', title: 'Révolution Communiste Chinoise' },
    { url: 'fr/crusades-jihad/crusades-impact-on-east.html', title: 'L\'Impact des Croisades sur l\'Orient' },
    { url: 'fr/crusades-jihad/fourth-crusade-constantinople-1204.html', title: 'La Quatrième Croisade 1204' },
    { url: 'fr/crusades-jihad/children-crusade-myth.html', title: 'La Croisade des Enfants 1212' },
    { url: 'fr/crusades-jihad/templar-knights-history.html', title: 'L\'Ordre des Templiers' },
    { url: 'fr/crusades-jihad/baybars-military-genius.html', title: 'Baybars — Le Génie Militaire' },
    { url: 'fr/crusades-jihad/first-crusade-1095.html', title: 'La Première Croisade 1095' },
    { url: 'fr/crusades-jihad/richard-lionheart-vs-saladin.html', title: 'Richard Cœur de Lion contre Saladin' },
    { url: 'fr/crusades-jihad/mamluk-vs-crusaders.html', title: 'Les Mamelouks contre les Croisés' },
    { url: 'fr/crusades-jihad/saladin-victory-jerusalem.html', title: 'Saladin — La Victoire de Jérusalem' },
    { url: 'fr/crusades-jihad/third-crusade-kings.html', title: 'La Troisième Croisade 1189' },
    { url: 'fr/crusades-jihad/fall-of-acre-1291.html', title: 'La Chute d\'Acre 1291' }
];

// مسار الصفحة الرئيسية للموقع التي سنضع فيها الروابط
const indexPath = './index.html'; 

if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // توليد كود الـ HTML الخاص بالروابط بشكل أنيق للسيو
    let linksHtml = '\n\n<div class="orphan-links-cleaner" style="display:none;">\n';
    orphanPages.forEach(page => {
        linksHtml += `  <a href="./${page.url}">${page.title}</a>\n`;
    });
    linksHtml += '</div>\n';

    // حقن الروابط قبل وسم إغلاق الفوتر مباشرة </footer>
    if (indexContent.includes('</footer>')) {
        // حماية منع التكرار إذا تم تشغيل السكريبت أكثر من مرة
        if (!indexContent.includes('')) {
            indexContent = indexContent.replace('</footer>', `${linksHtml}</footer>`);
            fs.writeFileSync(indexPath, indexContent, 'utf8');
            console.log('✅ تم غرس روابط الصفحات اليتيمة بنجاح داخل فوتر الصفحة الرئيسية index.html!');
        } else {
            console.log('ℹ️ الروابط مضافة بالفعل سابقاً في الصفحة الرئيسية.');
        }
    } else {
        console.log('❌ لم يتم العثور على وسم </footer> في الصفحة الرئيسية.');
    }
} else {
    console.log('❌ ملف index.html الرئيسي غير موجود في هذا المجلد، تأكد من وجوده بجانب السكريبت.');
}
