// State Variables
let allGifts = [];
let filteredGifts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 3;

const recipientGroup = document.getElementById('recipient-group');
const budgetGroup = document.getElementById('budget-group');
const styleGroup = document.getElementById('style-group');
const giftList = document.getElementById('gift-list');
const countText = document.getElementById('results-count-text');

// Fetch dynamic data
async function loadGifts() {
    try {
        const response = await fetch('gifts.json');
        const data = await response.json();
        allGifts = data.gifts || [];
        updateResults();
    } catch (err) {
        console.error("Error loading gifts.json: ", err);
        renderFallback();
    }
}

// Get selected radio value
function getSelectedValue(group) {
    const checkedInput = group.querySelector('input[type="radio"]:checked');
    return checkedInput ? checkedInput.value : '';
}

// Update results based on filters
function updateResults() {
    const selectedRecipient = getSelectedValue(recipientGroup);
    const selectedBudget = getSelectedValue(budgetGroup);
    const selectedStyle = getSelectedValue(styleGroup);
    
    // Filter items
    filteredGifts = allGifts.filter(gift => {
        const matchRecipient = gift.recipient === selectedRecipient;
        const matchBudget = gift.budget === selectedBudget;
        const matchStyle = selectedStyle === 'tumu' || gift.style === selectedStyle;
        return matchRecipient && matchBudget && matchStyle;
    });

    currentPage = 1;
    renderResults();
}

// Render filtered page
function renderResults() {
    // Render count
    countText.textContent = `Şu an seçtiğiniz kriterlere uygun ${filteredGifts.length} harika alternatif listeleniyor.`;

    const totalPages = Math.ceil(filteredGifts.length / ITEMS_PER_PAGE);
    
    // Slice items for current page
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filteredGifts.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    // Render cards
    renderGiftCards(pageItems);

    // Render pagination controls
    renderPagination(totalPages);
}

// Render filtered cards
function renderGiftCards(items) {
    giftList.innerHTML = '';
    
    if (items.length === 0) {
        giftList.innerHTML = `
            <div class="gift-item-placeholder">
                <i class="fa-solid fa-face-frown" style="font-size: 1.5rem; color: var(--accent-gold); margin-bottom: 10px;"></i>
                <br>Seçilen kriterlere uygun hediye bulunamadı. Lütfen başka bir bütçe veya kişi seçin.
            </div>
        `;
        return;
    }

    const activeQuizInterest = localStorage.getItem('gift_quiz_interest');

    items.forEach(gift => {
        const card = document.createElement('div');
        
        let isMatch = false;
        if (activeQuizInterest) {
            const lowerTitle = gift.title.toLowerCase();
            if (activeQuizInterest === 'teknoloji' && (lowerTitle.includes('klavye') || lowerTitle.includes('hoparlör') || lowerTitle.includes('mouse') || lowerTitle.includes('şarj') || lowerTitle.includes('kablosuz') || lowerTitle.includes('kulaklık') || lowerTitle.includes('saat'))) {
                isMatch = true;
            } else if (activeQuizInterest === 'kahve' && (lowerTitle.includes('fincan') || lowerTitle.includes('kahve') || lowerTitle.includes('termos') || lowerTitle.includes('kupa') || lowerTitle.includes('mug') || lowerTitle.includes('seti'))) {
                isMatch = true;
            } else if (activeQuizInterest === 'kitap' && (lowerTitle.includes('kitap') || lowerTitle.includes('kalem') || lowerTitle.includes('ayraç') || lowerTitle.includes('defter') || lowerTitle.includes('ajanda'))) {
                isMatch = true;
            } else if (activeQuizInterest === 'sade' && (lowerTitle.includes('kartlık') || lowerTitle.includes('terlik') || lowerTitle.includes('cüzdan') || lowerTitle.includes('kemer') || lowerTitle.includes('minimalist') || lowerTitle.includes('gece lambası') || lowerTitle.includes('fincan'))) {
                isMatch = true;
            }
        }
        
        card.className = `gift-card ${isMatch ? 'highlight-match' : ''}`;
        
        card.innerHTML = `
            <div class="gift-image-wrapper">
                ${isMatch ? '<span class="gift-card-badge">✨ Önerilen</span>' : ''}
                <img src="${gift.image_url || 'https://via.placeholder.com/150'}" alt="${gift.title}" class="gift-img">
            </div>
            <div class="gift-details">
                <div>
                    <div class="gift-meta">
                        <h4 class="gift-title">${gift.title}</h4>
                        <span class="gift-price">${gift.price}</span>
                    </div>
                    <p class="gift-desc">${gift.desc}</p>
                </div>
                <div class="gift-actions-row">
                    <a href="${gift.affiliate_link || '#'}" target="_blank" class="gift-action-btn">
                        İncele <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                    <button class="add-plan-btn" onclick="addGiftToPlan('${escapeHtml(gift.title)}', '${gift.price}', '${escapeHtml(gift.image_url || '')}', '${gift.affiliate_link || '#'}')">
                        <i class="fa-solid fa-plus"></i> Plana Ekle
                    </button>
                </div>
            </div>
        `;
        giftList.appendChild(card);
    });
}

// Render pagination navigation
function renderPagination(totalPages) {
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        paginationContainer.className = 'pagination-container';
        giftList.parentNode.appendChild(paginationContainer);
    }
    
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderResults();
            window.scrollTo({ top: giftList.offsetTop - 100, behavior: 'smooth' });
        }
    });

    // Page Info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `${currentPage} / ${totalPages}`;

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderResults();
            window.scrollTo({ top: giftList.offsetTop - 100, behavior: 'smooth' });
        }
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextBtn);
}

// Render fallback items on load error
function renderFallback() {
    allGifts = [
        {
            title: "Minimalist Deri Keçe Sümen (Masa Pedi)",
            desc: "Çalışma alanına şıklık katmak isteyenler için suni deri ve keçe karışımı premium masa pedi.",
            price: "299 TL",
            image_url: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300",
            affiliate_link: "https://www.amazon.com.tr/s?k=deri+masa+pedi+sumen&tag=aurafocus-21",
            recipient: "sevgili",
            budget: "cuzi",
            style: "sade"
        },
        {
            title: "Minimalist Ahşap Kitap Ayracı",
            desc: "Doğal ahşaptan el yapımı olarak üretilmiş şık kitap ayracı.",
            price: "149 TL",
            image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300",
            affiliate_link: "https://www.amazon.com.tr/s?k=ahşap+kitap+ayracı&tag=aurafocus-21",
            recipient: "kitap",
            budget: "cuzi",
            style: "sade"
        },
        {
            title: "Premium Mekanik Klavye (Gateron Switch)",
            desc: "Yazılımcılar ve teknoloji meraklıları için üst düzey yazma hissine sahip mekanik klavye.",
            price: "1.799 TL",
            image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300",
            affiliate_link: "https://www.amazon.com.tr/s?k=mekanik+klavye+gateron&tag=aurafocus-21",
            recipient: "sevgili",
            budget: "luks",
            style: "modern"
        }
    ];
    updateResults();
}

// Gift Personality Matcher State
let quizAnswers = { q1: null, q2: null, q3: null };

// Modal elements
const quizModal = document.getElementById('quiz-modal');
const quizTriggerBtn = document.getElementById('quiz-trigger-btn');
const quizModalClose = document.getElementById('quiz-modal-close');
const quizSteps = document.querySelectorAll('.quiz-step');
const quizOptBtns = document.querySelectorAll('.quiz-opt-btn');
const quizResultCard = document.getElementById('quiz-result-card');
const quizStepsContainer = document.querySelector('.quiz-steps-container');
const quizResultTitle = document.getElementById('quiz-result-title');
const quizResultDesc = document.getElementById('quiz-result-desc');
const quizRestartBtn = document.getElementById('quiz-restart-btn');

function openQuiz() {
    quizAnswers = { q1: null, q2: null, q3: null };
    quizSteps.forEach((step, idx) => {
        if (idx === 0) step.classList.add('active');
        else step.classList.remove('active');
    });
    quizStepsContainer.style.display = 'block';
    quizResultCard.style.display = 'none';
    quizModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQuiz() {
    quizModal.classList.remove('active');
    document.body.style.overflow = '';
}

function selectQuizOption(questionNum, val) {
    quizAnswers[`q${questionNum}`] = val;
    
    const nextStepNum = questionNum + 1;
    const currentStep = document.getElementById(`quiz-step-${questionNum}`);
    const nextStep = document.getElementById(`quiz-step-${nextStepNum}`);
    
    if (currentStep) currentStep.classList.remove('active');
    
    if (nextStep) {
        nextStep.classList.add('active');
    } else {
        calculateQuizResult();
    }
}

function calculateQuizResult() {
    const { q1, q2, q3 } = quizAnswers;
    
    let title = '';
    let desc = '';
    
    if (q2 === 'teknoloji') {
        title = 'Gelişmiş Teknoloji Sever';
        desc = 'Sevdikleriniz için pratikliği ve üst düzey teknolojik zevkleri birleştiren minimalist cihazlar ve masaüstü aksesuarları en iyi seçim olacaktır.';
    } else if (q2 === 'kahve') {
        title = 'Gurme Kahve & Gusto Sever';
        desc = 'Özgün el yapımı seramikler, şık paslanmaz çelik termoslar ve lezzetli kahve demleme setleri sevdiklerinize her yudumda sizi hatırlatacak.';
    } else if (q2 === 'kitap') {
        title = 'Entelektüel & Kültür Sanat Sever';
        desc = 'Kişiye özel ahşap kitap ayraçları, nostaljik dolma kalem setleri ve şık çalışma odası detayları sevdiklerinizin sanatsal ruhunu besleyecek.';
    } else {
        title = 'Sade & Minimalist Yaşam Sever';
        desc = 'Göz yormayan sade çizgiler, hakiki deri minimalist kartlıklar ve ev sıcaklığını hissettirecek doğal detaylar sevdiklerinize en uygun hediye alternatifleridir.';
    }
    
    // Save choices to localStorage
    localStorage.setItem('gift_quiz_interest', q2);
    
    // Set matching radios in main UI programmatically
    const recRadio = document.querySelector(`input[name="recipient"][value="${q1}"]`) || document.querySelector(`input[name="recipient"][value="${q2}"]`);
    if (recRadio) recRadio.checked = true;
    
    const budRadio = document.querySelector(`input[name="budget"][value="${q3}"]`);
    if (budRadio) budRadio.checked = true;
    
    const styVal = (q2 === 'sade') ? 'sade' : 'tumu';
    const styRadio = document.querySelector(`input[name="style"][value="${styVal}"]`);
    if (styRadio) styRadio.checked = true;
    
    // Update main count/results
    updateResults();
    
    quizResultTitle.textContent = title;
    quizResultDesc.textContent = desc;
    
    quizStepsContainer.style.display = 'none';
    quizResultCard.style.display = 'flex';
}

// Event Listeners
recipientGroup.addEventListener('change', updateResults);
budgetGroup.addEventListener('change', updateResults);
styleGroup.addEventListener('change', updateResults);

// Quiz Listeners
quizTriggerBtn.addEventListener('click', openQuiz);
quizModalClose.addEventListener('click', closeQuiz);
quizModal.addEventListener('click', (e) => {
    if (e.target === quizModal) closeQuiz();
});

quizOptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const q = parseInt(btn.dataset.q);
        const val = btn.dataset.val;
        selectQuizOption(q, val);
    });
});

quizRestartBtn.addEventListener('click', () => {
    openQuiz();
});

// Hediye Planım State & Helpers
let wishlist = JSON.parse(localStorage.getItem('gift_wishlist')) || [];

function saveWishlist() {
    localStorage.setItem('gift_wishlist', JSON.stringify(wishlist));
}

function parseGiftPrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/\./g, '').replace(/[^0-9]/g, '');
    return parseFloat(cleaned) || 0;
}

function formatTRY(value) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

window.addGiftToPlan = function(title, price, imageUrl, affiliateLink) {
    const exists = wishlist.some(item => item.title === title);
    if (exists) {
        alert('Bu ürün zaten hediye planınızda mevcut.');
        return;
    }
    
    wishlist.push({ title, price, imageUrl, affiliateLink });
    saveWishlist();
    renderWishlist();
    
    sendNotificationBanner('Plana Eklendi 🎁', `"${title}" ürünü başarıyla hediye planınıza eklendi.`);
};

window.deleteGiftFromPlan = function(title) {
    wishlist = wishlist.filter(item => item.title !== title);
    saveWishlist();
    renderWishlist();
};

function renderWishlist() {
    const content = document.getElementById('wishlist-content');
    const summary = document.getElementById('wishlist-summary');
    const totalVal = document.getElementById('wishlist-total-price');
    if (!content || !summary || !totalVal) return;
    
    content.innerHTML = '';
    
    if (wishlist.length === 0) {
        content.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 10px 0;">Henüz plana eklenen hediye yok.</p>`;
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'flex';
    
    let totalCost = 0;
    
    wishlist.forEach(item => {
        totalCost += parseGiftPrice(item.price);
        
        const row = document.createElement('div');
        row.className = 'wishlist-item';
        
        row.innerHTML = `
            <img src="${item.imageUrl || 'https://via.placeholder.com/150'}" alt="${item.title}" class="wishlist-item-img">
            <div class="wishlist-item-details">
                <span class="wishlist-item-title" title="${item.title}">${item.title}</span>
                <span class="wishlist-item-price">${item.price}</span>
            </div>
            <div class="wishlist-item-actions">
                <a href="${item.affiliateLink}" target="_blank" class="wishlist-item-link" title="İncele">
                    <i class="fa-solid fa-cart-shopping"></i>
                </a>
                <button class="wishlist-item-delete" onclick="deleteGiftFromPlan('${escapeHtml(item.title)}')" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        content.appendChild(row);
    });
    
    totalVal.textContent = formatTRY(totalCost);
}

function exportWishlist() {
    if (wishlist.length === 0) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let text = `GIFT AURA - HEDİYE PLANI & BÜTÇE RAPORU\n`;
    text += `=======================================\n`;
    text += `Oluşturulma Tarihi: ${dateStr}\n\n`;
    text += `SEÇİLEN HEDİYE ALTERNATİFLERİ:\n`;
    
    let total = 0;
    wishlist.forEach((item, index) => {
        const cost = parseGiftPrice(item.price);
        total += cost;
        text += `${index + 1}. ${item.title} (${item.price})\n`;
        text += `   İnceleme Linki: ${item.affiliateLink}\n\n`;
    });
    
    text += `=======================================\n`;
    text += `TOPLAM PLANLANAN BÜTÇE: ${formatTRY(total)}\n\n`;
    text += `GiftAura ile sevdiklerinize en estetik ve anlamlı hediyeleri seçin.\n`;
    text += `noble.vision.tr\n`;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `GiftAura-Hediye-Planim-${now.toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sendNotificationBanner(title, body) {
    // UI Banner alert
    const banner = document.createElement('div');
    banner.className = 'custom-alert-banner';
    banner.innerHTML = `<i class="fa-solid fa-bell"></i> <span><strong>${title}</strong>: ${body}</span>`;
    document.body.appendChild(banner);
    
    setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 500);
    }, 6000);
}

// Initialize
const exportBtn = document.getElementById('export-wishlist-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', exportWishlist);
}

loadGifts();
renderWishlist();

