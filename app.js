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

    items.forEach(gift => {
        const card = document.createElement('a');
        card.href = gift.affiliate_link || '#';
        card.target = '_blank';
        card.className = 'gift-card';
        
        card.innerHTML = `
            <div class="gift-image-wrapper">
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
                <div class="gift-action">
                    <span>Amazon'da İncele</span>
                    <i class="fa-solid fa-chevron-right"></i>
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

// Event Listeners
recipientGroup.addEventListener('change', updateResults);
budgetGroup.addEventListener('change', updateResults);
styleGroup.addEventListener('change', updateResults);

// Initialize
loadGifts();
