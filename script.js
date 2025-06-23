// script.js
// Add your JavaScript code here

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const board = document.getElementById('board');
    const modal = document.getElementById('modal');
    const modalImg = document.querySelector('.modal-img');
    const modalClose = document.querySelector('.modal-close');
    let unresolved = [];
    let resolved = [];

    // Persistent storage keys
    const STORAGE_KEY = 'copylist-board';

    function saveBoard() {
        const data = {
            unresolved,
            resolved
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadBoard() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                unresolved = Array.isArray(parsed.unresolved) ? parsed.unresolved : [];
                resolved = Array.isArray(parsed.resolved) ? parsed.resolved : [];
            } catch {
                unresolved = [];
                resolved = [];
            }
        }
    }

    function clearBoard() {
        unresolved = [];
        resolved = [];
        saveBoard();
        renderBoard();
    }

    function updateProgress() {
        const total = unresolved.length + resolved.length;
        const done = resolved.length;
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        progressBar.style.width = percent + '%';
        progressText.textContent = `${done} / ${total} resolved (${percent}%)`;
    }

    function renderBoard() {
        board.innerHTML = '';
        unresolved.forEach((imgObj, idx) => {
            const card = createImageCard(imgObj, idx, false);
            board.appendChild(card);
        });
        resolved.forEach((imgObj, idx) => {
            const card = createImageCard(imgObj, idx, true);
            board.appendChild(card);
        });
        saveBoard();
        updateProgress();
    }

    function openModal(src) {
        modalImg.src = src;
        modal.classList.add('open');
    }
    function closeModal() {
        modal.classList.remove('open');
        modalImg.src = '';
    }
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('open') && (e.key === 'Escape' || e.key === 'Esc')) closeModal();
    });

    function createImageCard(imgObj, idx, isResolved) {
        const card = document.createElement('div');
        card.className = 'image-card' + (isResolved ? ' resolved' : '');
        const img = document.createElement('img');
        img.src = imgObj.src;
        img.style.cursor = 'pointer';
        img.onclick = () => openModal(imgObj.src);
        card.appendChild(img);
        if (!isResolved) {
            const resolveBtn = document.createElement('button');
            resolveBtn.textContent = 'Resolve';
            resolveBtn.onclick = () => {
                resolved.push(imgObj);
                unresolved.splice(idx, 1);
                renderBoard();
            };
            card.appendChild(resolveBtn);
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.style.background = '#718096';
            removeBtn.style.marginLeft = '8px';
            removeBtn.onclick = () => {
                unresolved.splice(idx, 1);
                renderBoard();
            };
            card.appendChild(removeBtn);
        } else {
            const unresolveBtn = document.createElement('button');
            unresolveBtn.textContent = 'Resolved';
            unresolveBtn.style.marginLeft = 'auto';
            unresolveBtn.onclick = () => {
                unresolved.push(imgObj);
                resolved.splice(idx, 1);
                renderBoard();
            };
            card.appendChild(unresolveBtn);
        }
        return card;
    }

    function handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    unresolved.push({ src: e.target.result });
                    renderBoard();
                };
                reader.readAsDataURL(file);
            }
        }
    }

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    dropArea.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                handleFiles([file]);
            }
        }
    });

    // Add a clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Board';
    clearBtn.className = 'clear-btn';
    clearBtn.style.margin = '16px 0';
    clearBtn.onclick = clearBoard;
    dropArea.parentNode.insertBefore(clearBtn, board.nextSibling);

    // On load, restore board from storage
    loadBoard();
    renderBoard();
    updateProgress();
});
