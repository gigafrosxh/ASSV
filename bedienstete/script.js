document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const startScannerBtn = document.getElementById('start-scanner');
    const stopScannerBtn = document.getElementById('stop-scanner');
    const switchCameraBtn = document.getElementById('switch-camera');
    const scannerStatus = document.getElementById('scanner-status');

    // Scanner-Variablen
    let scannerActive = false;
    let currentCamera = 'environment';
    let stream = null;

    // Datenbank der autorisierten Benutzer
    const authorizedUsers = {
        '572001': { firstName: 'Maximilian', lastName: 'Amort' },
        '604004': { firstName: 'Daniel', lastName: 'Naderer' },
        '257005': { firstName: 'Christian', lastName: 'Hahnl' },
        '846002': { firstName: 'Andreas', lastName: 'Klehr' },
        '193003': { firstName: 'Oliver', lastName: 'Ferkschneider' },
        '918006': { firstName: 'Thomas', lastName: 'Rhomberg' },
        '760008': { firstName: 'Clemens', lastName: 'Haase' },
        '341007': { firstName: 'Felix', lastName: 'Pöckl' }
    };

    // Formular-Submit-Event für manuelle Anmeldung
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const pin = document.getElementById('pin').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();

        // Formular validieren
        if (!pin || !firstName || !lastName) {
            showMessage('Bitte füllen Sie alle Felder aus.', 'error');
            return;
        }

        // PIN-Validierung - muss 6-stellig sein
        if (!/^\d{6}$/.test(pin)) {
            showMessage('Die Personenidentifikationsnummer muss genau 6 Ziffern enthalten.', 'error');
            return;
        }

        // Einfache Validierung: Prüfen ob PIN existiert und Name übereinstimmt
        const isValid = validateSimpleLogin(pin, firstName, lastName);

        if (isValid) {
            const user = authorizedUsers[pin];
            showMessage(`Anmeldung erfolgreich! Willkommen ${user.firstName} ${user.lastName}. Sie werden weitergeleitet...`, 'success');

            // Weiterleitung zur persönlichen Seite
            setTimeout(function() {
                // In einer echten Anwendung:
                window.location.href = `${pin}`;

                // Für Demo-Zwecke:
                console.log(`Weiterleitung zu: /bediensteten/${pin}/index.html`);
                alert(`Erfolgreich angemeldet als ${user.firstName} ${user.lastName} (PIN: ${pin})`);
            }, 2000);
        } else {
            showMessage('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Personenidentifikationsnummer und Namen.', 'error');
        }
    });

    // Scanner-Buttons Events
    startScannerBtn.addEventListener('click', startScanner);
    stopScannerBtn.addEventListener('click', stopScanner);
    switchCameraBtn.addEventListener('click', switchCamera);

    // Scanner-Funktionen
    async function startScanner() {
        if (scannerActive) return;

        try {
            showMessage('Scanner wird initialisiert...', 'warning');
            scannerStatus.textContent = 'Scanner wird initialisiert...';

            // Kamerazugriff anfordern
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // QuaggaJS Scanner initialisieren
            await Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector('#interactive'),
                    constraints: {
                        width: 640,
                        height: 480,
                        facingMode: currentCamera
                    }
                },
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "upc_reader"
                    ]
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                }
            }, function(err) {
                if (err) {
                    console.error(err);
                    showMessage('Scanner-Fehler: ' + err.message, 'error');
                    scannerStatus.textContent = 'Scanner-Fehler';
                    return;
                }

                Quagga.start();
                scannerActive = true;

                startScannerBtn.style.display = 'none';
                stopScannerBtn.style.display = 'inline-block';

                showMessage('Scanner bereit. Barcode scannen...', 'success');
                scannerStatus.textContent = 'Scanner aktiv - Bitte Barcode scannen';
                scannerStatus.classList.add('scanning');
            });

            // Barcode-Erkennung
            Quagga.onDetected(function(result) {
                if (!scannerActive) return;

                const code = result.codeResult.code;
                console.log("Barcode erkannt:", code);

                // Barcode validieren und verarbeiten
                processScannedBarcode(code);
            });

        } catch (error) {
            console.error('Kamera-Fehler:', error);

            // Fallback: Scanner-Simulation für Entwicklung ohne Kamera
            if (error.name === 'NotFoundError' || error.name === 'NotAllowedError') {
                showMessage('Kamera nicht verfügbar. Scanner-Simulation wird gestartet.', 'warning');
                startScannerSimulation();
            } else {
                showMessage('Kamera-Fehler: ' + error.message, 'error');
                scannerStatus.textContent = 'Kamera-Fehler';
            }
        }
    }

    // Scanner-Simulation für Entwicklung ohne Kamera
    function startScannerSimulation() {
        scannerActive = true;

        startScannerBtn.style.display = 'none';
        stopScannerBtn.style.display = 'inline-block';

        showMessage('Scanner-Simulation aktiv. Klicken Sie auf "Barcode simulieren".', 'warning');
        scannerStatus.textContent = 'Scanner-Simulation aktiv';
        scannerStatus.classList.add('scanning');

        // Simulierten Barcode-Button erstellen
        const simulateBtn = document.createElement('button');
        simulateBtn.textContent = 'Barcode simulieren';
        simulateBtn.className = 'btn btn-secondary';
        simulateBtn.type = 'button';
        simulateBtn.style.marginTop = '10px';

        simulateBtn.addEventListener('click', function() {
            // Zufälligen gültigen Barcode auswählen
            const pins = Object.keys(authorizedUsers);
            const randomPin = pins[Math.floor(Math.random() * pins.length)];
            processScannedBarcode(randomPin);
        });

        document.querySelector('.scanner-controls').appendChild(simulateBtn);
    }

    function stopScanner() {
        if (!scannerActive) return;

        if (typeof Quagga !== 'undefined' && Quagga.stop) {
            Quagga.stop();
        }
        scannerActive = false;

        // Kamera-Stream stoppen
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        startScannerBtn.style.display = 'inline-block';
        stopScannerBtn.style.display = 'none';

        scannerStatus.textContent = 'Scanner gestoppt';
        scannerStatus.classList.remove('scanning');
        showMessage('Scanner gestoppt', 'warning');

        // Simulierten Button entfernen falls vorhanden
        const simulateBtn = document.querySelector('[style*="margin-top: 10px"]');
        if (simulateBtn) {
            simulateBtn.remove();
        }
    }

    function switchCamera() {
        if (scannerActive) {
            stopScanner();
        }

        currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
        showMessage(`Kamera gewechselt zu: ${currentCamera === 'environment' ? 'Hauptkamera' : 'Frontkamera'}`, 'warning');

        // Scanner mit neuer Kamera neu starten
        setTimeout(startScanner, 500);
    }

    function processScannedBarcode(barcode) {
        // Barcode validieren (6-stellige Nummer erwarten)
        if (!/^\d{6}$/.test(barcode)) {
            showMessage('Ungültiger Barcode. Erwartet: 6-stellige Nummer', 'error');
            return;
        }

        // Überprüfen ob Benutzer existiert
        if (!authorizedUsers[barcode]) {
            showMessage('Unbekannte Personenidentifikationsnummer', 'error');
            return;
        }

        // Benutzerdaten ausfüllen
        const user = authorizedUsers[barcode];
        document.getElementById('pin').value = barcode;
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;

        showMessage(`Barcode für ${user.firstName} ${user.lastName} erkannt. Bitte klicken Sie auf "Anmelden".`, 'success');

        // Scanner automatisch stoppen nach erfolgreichem Scan
        setTimeout(stopScanner, 3000);
    }

    // Einfache Validierungsfunktion - prüft nur ob PIN und Name übereinstimmen
    function validateSimpleLogin(pin, firstName, lastName) {
        // Überprüfung, ob die PIN in der Datenbank existiert
        if (!authorizedUsers[pin]) {
            return false;
        }

        // Überprüfung, ob Vor- und Nachname mit der PIN übereinstimmen
        const user = authorizedUsers[pin];
        return user.firstName.toLowerCase() === firstName.toLowerCase() &&
            user.lastName.toLowerCase() === lastName.toLowerCase();
    }

    // Nachricht anzeigen
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Nachricht nach 5 Sekunden ausblenden (außer bei Erfolg)
        if (type !== 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Beim Verlassen der Seite Scanner stoppen
    window.addEventListener('beforeunload', function() {
        if (scannerActive) {
            stopScanner();
        }
    });

    // Demo-Informationen in der Konsole
    console.log('Autorisierte Benutzer:');
    Object.keys(authorizedUsers).forEach(pin => {
        const user = authorizedUsers[pin];
        console.log(`- PIN: ${pin} => ${user.firstName} ${user.lastName}`);
    });
    /*function createDemoButtons() {
        const demoContainer = document.createElement('div');
        demoContainer.className = 'demo-buttons';
        demoContainer.style.marginTop = '1rem';
        demoContainer.style.padding = '1rem';
        demoContainer.style.backgroundColor = '#f8f9fa';
        demoContainer.style.borderRadius = '4px';

        const demoTitle = document.createElement('h4');
        demoTitle.textContent = 'Demo-Zugänge:';
        demoTitle.style.marginBottom = '0.5rem';
        demoTitle.style.color = 'var(--primary-color)';

        demoContainer.appendChild(demoTitle);

        // Für jeden Benutzer einen Demo-Button erstellen
        Object.keys(authorizedUsers).forEach(pin => {
            const user = authorizedUsers[pin];
            const demoBtn = document.createElement('button');
            demoBtn.textContent = `${user.firstName} ${user.lastName}`;
            demoBtn.className = 'btn btn-secondary';
            demoBtn.type = 'button';
            demoBtn.style.margin = '0.25rem';
            demoBtn.style.fontSize = '0.85rem';

            demoBtn.addEventListener('click', () => {
                document.getElementById('pin').value = pin;

                    document.getElementById('firstName').value = user.firstName;
                document.getElementById('lastName').value = user.lastName;
                showMessage(`Demo-Daten für ${user.firstName} ${user.lastName} geladen. Klicken Sie auf "Anmelden".`, 'success');
            });

            demoContainer.appendChild(demoBtn);
        });

        document.querySelector('.login-form').appendChild(demoContainer);
    }

    // Demo-Buttons erstellen
    createDemoButtons();*/
});