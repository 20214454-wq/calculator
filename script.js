let displayValue = '';

let audioCtx;

function playClickSound() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // 15ms short burst of white noise creates a sharp click
        const bufferSize = Math.floor(audioCtx.sampleRate * 0.015);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        // A bandpass filter shapes the noise to sound "thocky" or tactile
        const bandpass = audioCtx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1800; // Crisp, high frequency click
        
        // Exponential decay envelope for instant attack and fast decay
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);
        
        noise.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        noise.start();
    } catch (e) {
        // Audio playback failed (e.g. strict autoplay policy or unsupported)
    }
}

function updateDisplay() {
    document.getElementById('calc-display').value = displayValue || '0';
}

function appendNumber(number) {
    playClickSound();
    if (displayValue === 'Error') displayValue = '';
    displayValue += number;
    updateDisplay();
}

function appendOperator(operator) {
    playClickSound();
    if (displayValue === 'Error') displayValue = '';
    if (displayValue === '' && operator !== '-') return;
    
    const lastChar = displayValue.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
        displayValue = displayValue.slice(0, -1) + operator;
    } else {
        displayValue += operator;
    }
    updateDisplay();
}

function clearDisplay() {
    playClickSound();
    displayValue = '';
    updateDisplay();
}

function deleteLast() {
    playClickSound();
    if (displayValue === 'Error') {
        displayValue = '';
    } else {
        displayValue = displayValue.slice(0, -1);
    }
    updateDisplay();
}

function calculate() {
    playClickSound();
    try {
        if (displayValue !== '') {
            // Using Function constructor as a slightly safer alternative to direct eval
            // for simple math expressions. Evaluates mathematically valid strings.
            const result = new Function('return ' + displayValue)();
            displayValue = String(result);
            
            if (displayValue === 'Infinity' || displayValue === 'NaN') {
                displayValue = 'Error';
            }
        }
    } catch (error) {
        displayValue = 'Error';
    }
    updateDisplay();
}

// Initial display setup
updateDisplay();

// Add keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    // Numbers and decimal point
    if (/^[0-9.]$/.test(key)) {
        appendNumber(key);
    } 
    // Operators
    else if (['+', '-', '*', '/'].includes(key)) {
        appendOperator(key);
    }
    // Enter / Equals
    else if (key === 'Enter' || key === '=') {
        event.preventDefault(); // Prevent default behavior
        calculate();
    }
    // Backspace / Delete
    else if (key === 'Backspace') {
        deleteLast();
    }
    // Clear
    else if (key === 'Escape' || key.toLowerCase() === 'c') {
        clearDisplay();
    }
});
