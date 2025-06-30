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
        // Hamburger drag handle
        if (!isResolved) {
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '&#9776;'; // Unicode hamburger
            dragHandle.draggable = true;
            dragHandle.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', idx);
                card.classList.add('dragging');
            });
            dragHandle.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            card.appendChild(dragHandle);
            card.setAttribute('draggable', 'true');
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', idx);
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });
            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (fromIdx !== idx) {
                    const moved = unresolved.splice(fromIdx, 1)[0];
                    unresolved.splice(idx, 0, moved);
                    renderBoard();
                }
            });
        }
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
            removeBtn.style.background = 'var(--button-remove-bg)';
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

    // On load, restore board from storage
    loadBoard();
    renderBoard();
    updateProgress();

    document.getElementById('export-btn').addEventListener('click', async () => {
        console.log("Initiating export sequence...");

        const data = JSON.parse(localStorage.getItem('copylist-board')) || { unresolved: [], resolved: [] };

        if (data.unresolved.length === 0 && data.resolved.length === 0) {
            alert("No images to export.");
            return;
        }

        const zip = new JSZip();
        const unresolvedFolder = zip.folder("Unresolved");
        const resolvedFolder = zip.folder("Resolved");

        for (let i = 0; i < data.unresolved.length; i++) {
            const imgObj = data.unresolved[i];
            try {
                const response = await fetch(imgObj.src);
                const blob = await response.blob();
                const name = `image_${i + 1}.${blob.type.split('/')[1] || 'png'}`;
                unresolvedFolder.file(name, blob);
            } catch (error) {
                console.error(`Failed to fetch unresolved image: ${imgObj.src}`, error);
            }
        }

        for (let i = 0; i < data.resolved.length; i++) {
            const imgObj = data.resolved[i];
            try {
                const response = await fetch(imgObj.src);
                const blob = await response.blob();
                const name = `image_${i + 1}.${blob.type.split('/')[1] || 'png'}`;
                resolvedFolder.file(name, blob);
            } catch (error) {
                console.error(`Failed to fetch resolved image: ${imgObj.src}`, error);
            }
        }

        zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
            const zipUrl = URL.createObjectURL(zipBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = zipUrl;
            downloadLink.download = 'CopyList_Images.zip';
            downloadLink.click();
            URL.revokeObjectURL(zipUrl);
        }).catch(err => {
            console.error("Failed to generate ZIP:", err);
            alert("Something went wrong during ZIP creation.");
        });
    });

    document.getElementById('clear-board').addEventListener('click', () => {
        unresolved = [];
        resolved = [];
        renderBoard();
        updateProgress();
        localStorage.removeItem(STORAGE_KEY);
    });
});
