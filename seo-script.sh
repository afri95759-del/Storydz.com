#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║     سكريبت تحسين محركات البحث (SEO) الشامل                 ║
# ║     لملفات HTML الثابتة - Termux / Android                  ║
# ╚══════════════════════════════════════════════════════════════╝

# ============================================================
# المتغيرات العامة
# ============================================================
BASE_DIR="/storage/emulated/0/Download/Afric"
DOMAIN="https://storydz.com"
SITE_NAME_AR="قصص أونلاين"
SITE_NAME_EN="Stories Online"
SITE_NAME_FR="Histoires en Ligne"

# عدادات للتقرير النهائي
TOTAL_FILES=0
LANG_UPDATED=0
INTERNAL_LINKS_ADDED=0
SCHEMA_ADDED=0
SKIPPED_FILES=0
AR_FILES=0
EN_FILES=0
FR_FILES=0

# ألوان للطباعة
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

# ============================================================
# وظيفة: طباعة رأس السكريبت
# ============================================================
print_header() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BLUE}║${RESET}     ${YELLOW}سكريبت تحسين محركات البحث (SEO) الشامل${RESET}             ${BLUE}║${RESET}"
    echo -e "${BLUE}║${RESET}     ${CYAN}Termux / Android - Bash Script${RESET}                     ${BLUE}║${RESET}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

# ============================================================
# وظيفة: التحقق من وجود المجلد الأساسي
# ============================================================
check_directory() {
    if [ ! -d "$BASE_DIR" ]; then
        echo -e "${RED}❌ خطأ: المجلد غير موجود: $BASE_DIR${RESET}"
        exit 1
    fi
    echo -e "${GREEN}✅ تم العثور على المجلد: $BASE_DIR${RESET}"
}

# ============================================================
# وظيفة: استنتاج لغة الملف من مساره
# ============================================================
get_language() {
    local file_path="$1"
    if [[ "$file_path" == *"/en/"* ]] || [[ "$file_path" == *"/EN/"* ]]; then
        echo "en"
    elif [[ "$file_path" == *"/fr/"* ]] || [[ "$file_path" == *"/FR/"* ]]; then
        echo "fr"
    else
        echo "ar"
    fi
}

# ============================================================
# وظيفة: استخراج عنوان الصفحة من وسم <title>
# ============================================================
get_title() {
    local file="$1"
    grep -oP '<title>\K[^<]+' "$file" 2>/dev/null | head -1
}

# ============================================================
# وظيفة: استخراج وصف الصفحة من meta description
# ============================================================
get_description() {
    local file="$1"
    grep -oP '<meta[^>]*name="description"[^>]*content="\K[^"]+' "$file" 2>/dev/null | head -1
}

# ============================================================
# وظيفة: الحصول على المسار النسبي للملف
# ============================================================
get_relative_path() {
    local file="$1"
    realpath --relative-to="$BASE_DIR" "$file" 2>/dev/null || echo "$(basename "$file")"
}

# ============================================================
# وظيفة: الحصول على اتجاه النص حسب اللغة
# ============================================================
get_direction() {
    local lang="$1"
    if [ "$lang" == "ar" ]; then
        echo "rtl"
    else
        echo "ltr"
    fi
}

# ============================================================
# وظيفة: الحصول على اسم الموقع حسب اللغة
# ============================================================
get_site_name() {
    local lang="$1"
    case "$lang" in
        "ar") echo "$SITE_NAME_AR" ;;
        "en") echo "$SITE_NAME_EN" ;;
        "fr") echo "$SITE_NAME_FR" ;;
        *)    echo "$SITE_NAME_AR" ;;
    esac
}

# ============================================================
# وظيفة: الحصول على وصف افتراضي حسب اللغة
# ============================================================
get_default_description() {
    local lang="$1"
    case "$lang" in
        "ar") echo "أرشيف قصص أونلاين - قصص تاريخية مشوقة وحصرية من مختلف العصور" ;;
        "en") echo "Stories Online Archive - Engaging and exclusive historical stories from different eras" ;;
        "fr") echo "Archive Histoires en Ligne - Histoires historiques captivantes et exclusives" ;;
        *)    echo "أرشيف قصص أونلاين - قصص تاريخية مشوقة وحصرية" ;;
    esac
}

# ============================================================
# الوظيفة الأساسية 1: تصحيح وسم <html lang> و dir
# ============================================================
fix_html_lang() {
    local file="$1"
    local lang=$(get_language "$file")
    local direction=$(get_direction "$lang")
    
    # استخراج اللغة الحالية من وسم html
    local current_lang=$(grep -oP '<html[^>]*lang="\K[^"]+' "$file" | head -1)
    local current_dir=$(grep -oP '<html[^>]*dir="\K[^"]+' "$file" | head -1)
    
    # التحقق مما إذا كانت اللغة والاتجاه صحيحين
    if [ "$current_lang" == "$lang" ] && [ "$current_dir" == "$direction" ]; then
        return 0
    fi
    
    # تصحيح أو إضافة lang و dir
    if grep -q '<html[^>]*>' "$file"; then
        if grep -q '<html[^>]*lang=' "$file"; then
            sed -i "s|lang=\"[^\"]*\"|lang=\"$lang\"|" "$file"
        else
            sed -i "s|<html|<html lang=\"$lang\"|" "$file"
        fi
        
        if grep -q '<html[^>]*dir=' "$file"; then
            sed -i "s|dir=\"[^\"]*\"|dir=\"$direction\"|" "$file"
        else
            sed -i "s|<html|<html dir=\"$direction\"|" "$file"
        fi
    fi
    
    LANG_UPDATED=$((LANG_UPDATED + 1))
    echo -e "   ${CYAN}🔤 تم تصحيح lang=\"$lang\" dir=\"$direction\"${RESET}"
    return 1
}

# ============================================================
# الوظيفة الأساسية 2: إضافة Internal Linking Schema
# ============================================================
add_internal_linking_schema() {
    local file="$1"
    
    # التحقق من عدم وجود Internal Linking Schema مسبقاً
    if grep -q '"name": "internalLinks"' "$file" 2>/dev/null; then
        return 0
    fi
    
    # استخراج الروابط الداخلية (أول 10 روابط فريدة)
    local links=$(grep -oP 'href="\K[^"]+\.html' "$file" 2>/dev/null | \
                  grep -v '^http' | \
                  grep -v '^#' | \
                  sort -u | \
                  head -10)
    
    if [ -z "$links" ]; then
        return 0
    fi
    
    # بناء مصفوفة JSON للروابط
    local json_items=""
    local count=1
    
    while IFS= read -r link; do
        [ -z "$link" ] && continue
        
        local link_name=$(basename "$link" .html | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
        local full_url="${DOMAIN}/${link}"
        
        if [ $count -gt 1 ]; then
            json_items+=","
        fi
        
        json_items+="
        {
          \"@type\": \"ListItem\",
          \"position\": $count,
          \"name\": \"$link_name\",
          \"url\": \"$full_url\"
        }"
        
        count=$((count + 1))
    done <<< "$links"
    
    if [ $count -le 2 ]; then
        return 0
    fi
    
    # إنشاء كود JSON-LD
    local internal_schema='<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "internalLinks",
  "description": "روابط داخلية للتصفح",
  "numberOfItems": '$((count - 1))',
  "itemListElement": ['"$json_items"'
  ]
}
</script>'
    
    sed -i "s|</head>|${internal_schema}\n</head>|" "$file"
    
    INTERNAL_LINKS_ADDED=$((INTERNAL_LINKS_ADDED + 1))
    echo -e "   ${YELLOW}🔗 تم إضافة Internal Linking Schema ($((count - 1)) روابط)${RESET}"
    return 1
}

# ============================================================
# الوظيفة الأساسية 3: إضافة Schema Markup الرئيسي
# ============================================================
add_main_schema() {
    local file="$1"
    local lang=$(get_language "$file")
    
    # التحقق من عدم وجود Schema Markup رئيسي مسبقاً
    if grep -q '"@type":\s*"WebPage"' "$file" 2>/dev/null || \
       grep -q '"@type":\s*"CollectionPage"' "$file" 2>/dev/null; then
        return 0
    fi
    
    # استخراج البيانات من الملف
    local title=$(get_title "$file")
    local desc=$(get_description "$file")
    local rel_path=$(get_relative_path "$file")
    local filename=$(basename "$file")
    local url="${DOMAIN}/${rel_path}"
    local site_name=$(get_site_name "$lang")
    
    if [ -z "$title" ]; then
        title="$site_name"
    fi
    
    if [ -z "$desc" ]; then
        desc=$(get_default_description "$lang")
    fi
    
    # تحديد نوع Schema
    local schema_type="WebPage"
    if [[ "$filename" == "index.html" ]]; then
        schema_type="CollectionPage"
    fi
    
    # اسم القسم لـ Breadcrumb
    local category=""
    if [[ "$rel_path" == *"/"* ]]; then
        category=$(echo "$rel_path" | cut -d'/' -f1 | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
    fi
    
    # بناء BreadcrumbList
    local breadcrumb='{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "'"$site_name"'",
            "item": "'"${DOMAIN}/"'"
          }'
    
    if [ -n "$category" ] && [[ "$filename" != "index.html" ]]; then
        breadcrumb+=',
          {
            "@type": "ListItem",
            "position": 2,
            "name": "'"$category"'",
            "item": "'"${DOMAIN}/${rel_path%%/*}/"'"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "'"$title"'",
            "item": "'"$url"'"
          }'
    else
        breadcrumb+=',
          {
            "@type": "ListItem",
            "position": 2,
            "name": "'"$title"'",
            "item": "'"$url"'"
          }'
    fi
    
    breadcrumb+='
        ]
      }'
    
    # إنشاء كود JSON-LD الكامل
    local main_schema='<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "'"$schema_type"'",
  "name": "'"$title"'",
  "description": "'"$desc"'",
  "url": "'"$url"'",
  "inLanguage": "'"$lang"'",
  "isAccessibleForFree": true,
  "publisher": {
    "@type": "Organization",
    "name": "'"$site_name"'",
    "url": "'"${DOMAIN}/"'",
    "logo": {
      "@type": "ImageObject",
      "url": "'"${DOMAIN}/favicon.png"'"
    }
  },
  "breadcrumb": '"$breadcrumb"'
}
</script>'
    
    # حقن الكود قبل وسم </head>
    if grep -q 'application/ld+json' "$file" 2>/dev/null; then
        sed -i "s|<script type=\"application/ld+json\">|${main_schema}\n<script type=\"application/ld+json\">|" "$file"
    else
        sed -i "s|</head>|${main_schema}\n</head>|" "$file"
    fi
    
    SCHEMA_ADDED=$((SCHEMA_ADDED + 1))
    echo -e "   ${GREEN}📋 تم إضافة Schema Markup ($schema_type)${RESET}"
    return 1
}

# ============================================================
# الوظيفة الأساسية 4: معالجة ملف واحد
# ============================================================
process_file() {
    local file="$1"
    local lang=$(get_language "$file")
    local rel_path=$(get_relative_path "$file")
    
    echo -e "${BLUE}📄 [$lang] $rel_path${RESET}"
    
    fix_html_lang "$file"
    add_internal_linking_schema "$file"
    add_main_schema "$file"
    
    case "$lang" in
        "ar") AR_FILES=$((AR_FILES + 1)) ;;
        "en") EN_FILES=$((EN_FILES + 1)) ;;
        "fr") FR_FILES=$((FR_FILES + 1)) ;;
    esac
}

# ============================================================
# وظيفة: عرض شريط التقدم
# ============================================================
show_progress() {
    local current=$1
    local total=$2
    local percent=$((current * 100 / total))
    local filled=$((percent / 5))
    local empty=$((20 - filled))
    
    local bar="["
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=0; i<empty; i++)); do bar+="░"; done
    bar+="]"
    
    printf "\r${CYAN}⏳ %s %3d%% (%d/%d)${RESET}" "$bar" "$percent" "$current" "$total"
}

# ============================================================
# وظيفة: طباعة التقرير النهائي
# ============================================================
print_report() {
    echo ""
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BLUE}║${RESET}              ${GREEN}📊 التقرير النهائي${RESET}                         ${BLUE}║${RESET}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${CYAN}📁 إحصائيات الملفات:${RESET}"
    echo -e "   ├─ إجمالي الملفات:                ${YELLOW}$TOTAL_FILES${RESET}"
    echo -e "   └─ الملفات التي تمت معالجتها:     ${GREEN}$((TOTAL_FILES - SKIPPED_FILES))${RESET}"
    echo ""
    echo -e "${CYAN}🔤 تصحيح وسوم اللغة (lang & dir):${RESET}"
    echo -e "   └─ عدد الملفات المحدثة:           ${GREEN}$LANG_UPDATED${RESET}"
    echo ""
    echo -e "${CYAN}🔗 الروابط الداخلية (Internal Linking):${RESET}"
    echo -e "   └─ عدد الملفات المضاف لها:        ${GREEN}$INTERNAL_LINKS_ADDED${RESET}"
    echo ""
    echo -e "${CYAN}📋 Schema Markup:${RESET}"
    echo -e "   └─ عدد الملفات المضاف لها:        ${GREEN}$SCHEMA_ADDED${RESET}"
    echo ""
    echo -e "${CYAN}🌍 توزيع الملفات حسب اللغة:${RESET}"
    echo -e "   ├─ 🇸🇦 العربية:                     ${GREEN}$AR_FILES${RESET} ملف"
    echo -e "   ├─ 🇬🇧 الإنجليزية:                 ${GREEN}$EN_FILES${RESET} ملف"
    echo -e "   └─ 🇫🇷 الفرنسية:                   ${GREEN}$FR_FILES${RESET} ملف"
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${RESET}"
    echo -e "${GREEN}✅ تم الانتهاء بنجاح!${RESET}"
    echo ""
}

# ============================================================
# الوظيفة الرئيسية
# ============================================================
main() {
    print_header
    
    echo -e "${CYAN}🔍 جاري التحقق من المسار...${RESET}"
    check_directory
    echo ""
    
    echo -e "${CYAN}🔍 جاري البحث عن ملفات HTML...${RESET}"
    
    local all_files=()
    while IFS= read -r -d '' file; do
        all_files+=("$file")
        TOTAL_FILES=$((TOTAL_FILES + 1))
    done < <(find "$BASE_DIR" -type f -name "*.html" -print0)
    
    if [ $TOTAL_FILES -eq 0 ]; then
        echo -e "${RED}❌ لم يتم العثور على أي ملفات HTML${RESET}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ تم العثور على $TOTAL_FILES ملف HTML${RESET}"
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${RESET}"
    echo ""
    
    local current=0
    for file in "${all_files[@]}"; do
        current=$((current + 1))
        show_progress "$current" "$TOTAL_FILES"
        echo ""
        process_file "$file"
    done
    
    print_report
}

# تشغيل الدالة الرئيسية
main "$@"
