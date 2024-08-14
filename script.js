
function showEncryptForm() {
    document.getElementById('encryptForm').style.display = 'block';
    document.getElementById('decryptForm').style.display = 'none';
}

function showDecryptForm() {
    document.getElementById('encryptForm').style.display = 'none';
    document.getElementById('decryptForm').style.display = 'block';
}


function encryptImage() {
    const fileInput = document.getElementById('encryptFile');
    const text = document.getElementById('encryptText').value;
    const key = document.getElementById('encryptKey').value;
    const canvas = document.getElementById('encryptCanvas');
    const ctx = canvas.getContext('2d');

    if (fileInput.files.length === 0 || text === '' || key === '') {
        alert('Please fill in all fields.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            embedText(ctx, text, key);

            // Convert the canvas content to a Blob and generate a downloadable link
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const downloadLink = document.getElementById('downloadEncrypted');
                downloadLink.href = url;
                downloadLink.download = 'encrypted.png'; // Set the default file name
                downloadLink.style.display = 'inline-block'; // Make the link visible
            }, 'image/png');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}




function embedText(ctx, text, key) {
    const textBin = text.length.toString(2).padStart(16, '0') + text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    let idx = 0;
    for (let i = 0; i < ctx.canvas.width; i++) {
        for (let j = 0; j < ctx.canvas.height; j++) {
            const pixel = ctx.getImageData(i, j, 1, 1);
            if (idx < textBin.length) {
                const bin = pixel.data[0].toString(2).padStart(8, '0');
                pixel.data[0] = parseInt(bin.slice(0, -1) + textBin[idx], 2);
                ctx.putImageData(pixel, i, j);
                idx++;
            } else {
                return;
            }
        }
    }
}

function decryptImage() {
    const fileInput = document.getElementById('decryptFile');
    const key = document.getElementById('decryptKey').value;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (fileInput.files.length === 0 || key === '') {
        alert('Please fill in all fields.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            try {
                const decryptedText = extractText(ctx, key);  // No need to specify text length
                document.getElementById('decryptedText').innerText = 'Decrypted Text: ' + decryptedText;
            } catch (error) {
                document.getElementById('decryptedText').innerText = 'Error: ' + error.message;
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function extractText(ctx, key) {
    let textBin = '';
    let idx = 0;
    let textLen = 0;
    let lengthRead = false;

    for (let i = 0; i < ctx.canvas.width; i++) {
        for (let j = 0; j < ctx.canvas.height; j++) {
            const pixel = ctx.getImageData(i, j, 1, 1);
            textBin += (pixel.data[0] & 1).toString();
            idx++;

            // Read the length prefix (first 16 bits)
            if (!lengthRead && idx === 16) {
                textLen = parseInt(textBin, 2);
                textBin = '';
                lengthRead = true;
            }

            // Read the actual text based on the length
            if (lengthRead && idx >= 16 + textLen * 8) {
                const chars = [];
                for (let k = 0; k < textBin.length; k += 8) {
                    chars.push(String.fromCharCode(parseInt(textBin.slice(k, k + 8), 2)));
                }
                const message = chars.join('');
                if (message.trim().length === 0) {
                    throw new Error('No hidden message found in the image.');
                }
                return message;
            }
        }
    }
    throw new Error('No hidden message found in the image.');
}