// ── Slideshow ──────────────────────────────────────────────────────────────
const slideshowImages = [
    'images/slideshow/slide1.jpg',
    'images/slideshow/slide2.jpg',
    'images/slideshow/slide3.jpg',
    'images/slideshow/slide4.jpg'
];

const slide1 = document.getElementById('slide1');
const slide2 = document.getElementById('slide2');

let currentIndex = 0;
let activeSlide = slide1;
let inactiveSlide = slide2;

function changeSlide() {
    currentIndex = (currentIndex + 1) % slideshowImages.length;
    inactiveSlide.style.backgroundImage = `url('${slideshowImages[currentIndex]}')`;
    activeSlide.style.opacity = '0';
    inactiveSlide.style.opacity = '0.35';
    [activeSlide, inactiveSlide] = [inactiveSlide, activeSlide];
}

// Set and fade in first image on load
slide1.style.backgroundImage = `url('${slideshowImages[0]}')`;
setTimeout(() => { slide1.style.opacity = '0.35'; }, 100);

setInterval(changeSlide, 5000);


// ── SPA Router ─────────────────────────────────────────────────────────────
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');

function navigateTo(pageId, pushState = true) {
    // Update URL hash without triggering a reload
    if (pushState) {
        history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    // Update title
    const titles = {
        home: 'Portfolio - Home',
        content: 'Portfolio - Content Creation',
        development: 'Portfolio - Development',
        staff: 'Portfolio - Staff'
    };
    document.title = titles[pageId] || 'Portfolio';

    // Reset scroll position
    window.scrollTo(0, 0);

    // Swap active page — CSS transition handles the fade
    pages.forEach(page => page.classList.remove('active'));

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.classList.add('active');
        bindExperienceItems(target);
    }

    // Update active nav link
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageId);
    });
}

// Nav link clicks
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) navigateTo(page);
    });
});

// Browser back/forward
window.addEventListener('popstate', e => {
    const page = (e.state && e.state.page) || 'home';
    navigateTo(page, false);
});

// On load — read hash to set initial page
function getInitialPage() {
    const hash = window.location.hash.replace('#', '');
    const valid = ['home', 'content', 'development', 'staff'];
    return valid.includes(hash) ? hash : 'home';
}

const initialPage = getInitialPage();
if (initialPage !== 'home') {
    // If not home, switch immediately (no animation on first load)
    navigateTo(initialPage, false);
}


// ── Experience item links ───────────────────────────────────────────────────
function bindExperienceItems(scope = document) {
    scope.querySelectorAll('.experience-item[data-href]').forEach(item => {
        // Avoid double-binding
        if (item.dataset.bound) return;
        item.dataset.bound = 'true';
        item.addEventListener('click', () => {
            window.open(item.dataset.href, '_blank');
        });
    });
}

bindExperienceItems();


// ── Development Cards: Collapsible + Carousel ──────────────────────────────

// Image extensions to try, in order
const IMG_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

// Attempt to discover images in a folder by probing filenames 1.ext, 2.ext, ...
// Since browsers can't list directories, we probe up to MAX images per card.
const MAX_IMAGES = 20;

async function probeImages(folder) {
    const found = [];
    for (let i = 1; i <= MAX_IMAGES; i++) {
        let hit = null;
        for (const ext of IMG_EXTS) {
            const url = `${folder}/${i}.${ext}`;
            try {
                const res = await fetch(url, { method: 'HEAD' });
                if (res.ok) { hit = url; break; }
            } catch (_) {}
        }
        if (hit) {
            found.push(hit);
        } else {
            break; // stop at first gap
        }
    }
    return found;
}

function buildCarousel(carousel, images) {
    const track = carousel.querySelector('.dev-carousel-track');
    const indicators = carousel.querySelector('.dev-carousel-indicators');
    const prevBtn = carousel.querySelector('.dev-carousel-prev');
    const nextBtn = carousel.querySelector('.dev-carousel-next');

    if (!images.length) {
        track.innerHTML = `<div style="padding:2rem;color:rgba(255,255,255,0.35);font-size:0.9rem;width:100%;text-align:center;">No images found in this folder.</div>`;
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        return;
    }

    // Build slides
    images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Screenshot ${i + 1}`;
        img.draggable = false;
        track.appendChild(img);
    });

    // Build dots
    images.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dev-carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to image ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        indicators.appendChild(dot);
    });

    let current = 0;

    function goTo(index) {
        current = index;
        track.style.transform = `translateX(-${100 * current}%)`;
        indicators.querySelectorAll('.dev-carousel-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === images.length - 1;
    }

    prevBtn.addEventListener('click', () => { if (current > 0) goTo(current - 1); });
    nextBtn.addEventListener('click', () => { if (current < images.length - 1) goTo(current + 1); });

    goTo(0);
}

function initDevCards() {
    document.querySelectorAll('.dev-card').forEach(card => {
        if (card.dataset.devInit) return;
        card.dataset.devInit = 'true';

        const header = card.querySelector('.dev-card-header');
        const body = card.querySelector('.dev-card-body');
        const carousel = card.querySelector('.dev-carousel');
        const folder = carousel.dataset.folder;

        let imagesLoaded = false;

        header.addEventListener('click', async () => {
            const isOpen = header.getAttribute('aria-expanded') === 'true';

            if (isOpen) {
                header.setAttribute('aria-expanded', 'false');
                body.classList.remove('open');
            } else {
                header.setAttribute('aria-expanded', 'true');
                body.classList.add('open');

                // Load images once on first open
                if (!imagesLoaded) {
                    imagesLoaded = true;
                    carousel.querySelector('.dev-carousel-track').innerHTML =
                        `<div style="padding:2rem;color:rgba(255,255,255,0.35);font-size:0.9rem;width:100%;text-align:center;">Loading images…</div>`;
                    const images = await probeImages(folder);
                    carousel.querySelector('.dev-carousel-track').innerHTML = '';
                    buildCarousel(carousel, images);
                }
            }
        });
    });
}

initDevCards();

