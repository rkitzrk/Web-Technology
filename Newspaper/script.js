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

        viewer.appendChild(wrapper);
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
