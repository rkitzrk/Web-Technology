const pdfUrl = "newspaper.pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let pdfDoc = null;
let currentPage = 1;
let mode = "single";

const viewer = document.getElementById("viewer");
const pageInfo = document.getElementById("pageInfo");
const nav = document.getElementById("nav");

/* Load PDF */
pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
    pdfDoc = pdf;
    render();
});

/* Mode switch */
function setMode(m) {
    mode = m;
    currentPage = 1;
    render();
}

/* Render based on mode */
function render() {
    viewer.innerHTML = "";
    viewer.className = "";
    nav.style.display = (mode === "single") ? "block" : "none";

    if (mode === "single") {
        renderPage(currentPage, 1.3);
        pageInfo.textContent = `Page ${currentPage} / ${pdfDoc.numPages}`;
    }

    else if (mode === "scroll") {
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            renderPage(i, 1.2);
        }
    }

    else if (mode === "cards") {
        viewer.className = "cards";
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            renderPage(i, 0.9);
        }
    }
}

/* Render a single PDF page */
function renderPage(pageNumber, scale) {
    pdfDoc.getPage(pageNumber).then(page => {
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        page.render({
            canvasContext: ctx,
            viewport: viewport
        });

        const wrapper = document.createElement("div");
        wrapper.className = "page";
        wrapper.appendChild(canvas);

        // Add notes section
        const notesDiv = document.createElement("div");
        notesDiv.className = "notes";
        notesDiv.innerHTML = `
            <h4>Notes for Page ${pageNumber}</h4>
            <div id="notes-list-${pageNumber}"></div>
            <form onsubmit="addNote(event, ${pageNumber})">
                <input type="text" placeholder="Your name (optional)" id="author-${pageNumber}">
                <textarea placeholder="Add a note..." id="note-${pageNumber}" required></textarea>
                <button type="submit">Add Note</button>
            </form>
        `;
        wrapper.appendChild(notesDiv);

        viewer.appendChild(wrapper);

        // Load existing notes
        loadNotes(pageNumber);
    });
}

/* Navigation */
function nextPage() {
    if (currentPage < pdfDoc.numPages) {
        currentPage++;
        render();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        render();
    }
}

/* Notes functions */
async function loadNotes(pageNumber) {
    try {
        const response = await fetch(`/api/notes/${pageNumber}`);
        const notes = await response.json();
        const notesList = document.getElementById(`notes-list-${pageNumber}`);
        notesList.innerHTML = notes.map(note => `
            <div class="note">
                <strong>${note.author}</strong> (${new Date(note.createdAt).toLocaleString()}): ${note.note}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

async function addNote(event, pageNumber) {
    event.preventDefault();
    const author = document.getElementById(`author-${pageNumber}`).value.trim() || 'Anonymous';
    const note = document.getElementById(`note-${pageNumber}`).value.trim();

    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageNumber, note, author }),
        });

        if (response.ok) {
            document.getElementById(`note-${pageNumber}`).value = '';
            loadNotes(pageNumber);
        } else {
            alert('Error adding note.');
        }
    } catch (error) {
        alert('Error adding note.');
    }
}
