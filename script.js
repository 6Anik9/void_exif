const sfxBtn = document.getElementById('sfx-click');
const sfxBoot = document.getElementById('sfx-boot');
const terminal = document.getElementById('terminal');

// 1. Matrix Background Logic
const canvas = document.getElementById('hexBg');
const ctx = canvas.getContext('2d');
let width, height, columns;
const chars = "01VOID6ANIK9";
const drops = [];

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / 20);
    for(let i=0; i<columns; i++) drops[i] = 1;
}

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#00ff41";
    ctx.font = "15px monospace";
    for(let i=0; i<drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);
        if(drops[i] * 20 > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
}
window.addEventListener('resize', initCanvas);
initCanvas();
setInterval(drawMatrix, 50);

// 2. Boot Sequence Logic
const msgs = ["Decrypting Modules...", "Bypassing Security...", "Allocating Memory...", "EXIF_Kernel_Loaded...", "VOiD_Core_Active."];
window.onload = () => {
    let i = 0, p = 0;
    const log = document.getElementById('bootLog');
    const bar = document.getElementById('progressBar');
    const pct = document.getElementById('loadPercent');
    
    const timer = setInterval(() => {
        p += 20;
        if(bar) bar.style.width = p + "%";
        if(pct) pct.innerText = p + "%";
        if(msgs[i] && log) log.innerHTML += `<div>> ${msgs[i]}</div>`;
        if(log) log.scrollTop = log.scrollHeight;
        i++;
        if(p >= 100) {
            clearInterval(timer);
            document.getElementById('launchBtn').classList.remove('hidden');
        }
    }, 500);
};

document.getElementById('launchBtn').onclick = () => {
    sfxBoot.play();
    document.getElementById('bootScreen').style.display = 'none';
    document.getElementById('appUI').classList.remove('hidden');
    addLog("SYSTEM_READY. AWAITING_PAYLOAD.");
};

// 3. The Power Engine (Functional Core)
let currentImageData = ""; 

document.getElementById('fileIn').onchange = (e) => {
    sfxBtn.play();
    const file = e.target.files[0];
    if(!file) return;

    addLog(`READING: ${file.name.toUpperCase()}`);
    const reader = new FileReader();
    reader.onload = (re) => {
        currentImageData = re.target.result;
        document.getElementById('imgPreview').src = currentImageData;
        document.getElementById('controls').classList.remove('hidden');
        
        try {
            const existing = piexif.load(currentImageData);
            const model = existing["0th"][piexif.ImageIFD.Model] || "NULL";
            addLog(`EXIF_DATA_DETECTED. MODEL: ${model}`);
        } catch(err) {
            addLog("NO_EXIF_DETECTED_IN_SOURCE.");
        }
    };
    reader.readAsDataURL(file);
};

function addLog(m) {
    terminal.innerHTML += `<div>>> ${m}</div>`;
    terminal.scrollTop = terminal.scrollHeight;
}

function copyLog() {
    navigator.clipboard.writeText(terminal.innerText);
    addLog("BUFFER_COPIED.");
}

function injectData() {
    if(!currentImageData) return addLog("ERROR: NO_PAYLOAD.");
    sfxBtn.play();
    addLog("INITIALIZING_INJECTION...");

    try {
        let exifObj = {"0th":{}, "Exif":{}, "GPS":{}};
        try { exifObj = piexif.load(currentImageData); } catch(e){}

        exifObj["0th"][piexif.ImageIFD.Model] = document.getElementById('tagModel').value || "6ANIK9_VOID";
        exifObj["0th"][piexif.ImageIFD.Software] = document.getElementById('tagSoft').value || "VOiD_v4.0";
        exifObj["0th"][piexif.ImageIFD.DateTime] = document.getElementById('tagDate').value || "2026:01:01 00:00:00";

        const gpsInput = document.getElementById('tagGPS').value;
        if(gpsInput.includes(",")) {
            const coords = gpsInput.split(",");
            const lat = parseFloat(coords[0]);
            const lon = parseFloat(coords[1]);
            exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
            exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToExif(Math.abs(lat));
            exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lon >= 0 ? 'E' : 'W';
            exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToExif(Math.abs(lon));
            addLog("GPS_MAPPED.");
        }

        const bytes = piexif.dump(exifObj);
        const final = piexif.insert(bytes, currentImageData);
        
        triggerDownload(final, "VOID_MODIFIED.jpg");
        addLog("STRIKE_SUCCESSFUL.");
    } catch(e) { 
        addLog(`FATAL_ERROR: ${e.message}`);
    }
}

function nukeData() {
    if(!currentImageData) return addLog("ERROR: NO_TARGET.");
    sfxBtn.play();
    addLog("PURGING_ALL_METADATA...");
    try {
        const clean = piexif.remove(currentImageData);
        triggerDownload(clean, "VOID_CLEAN.jpg");
        addLog("PURGE_COMPLETE.");
    } catch(e) { 
        addLog("IMAGE_ALREADY_VOID."); 
    }
}

function triggerDownload(base64, name) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
