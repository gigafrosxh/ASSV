document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const startCameraBtn = document.getElementById('start-camera');

    // Datenbank der autorisierten Benutzer
    const authorizedUsers = {
        '572001': { firstName: 'Maximillian', lastName: 'Amort' },
        '604004': { firstName: 'Daniel', lastName: 'Naderer' },
        '257005': { firstName: 'Christian', lastName: 'Hahnl' },
        '846002': { firstName: 'Andreas', lastName: 'Klehr' },
        '193003': { firstName: 'Oliver', lastName: 'Ferkschneider' },
        '918006': { firstName: 'Thomas', lastName: 'Rhomberg' },
        '760008': { firstName: 'Clemens', lastName: 'Haase' },
        '341007': { firstName: 'Felix', lastName: 'Pöckl' }
    };

    // Beispiel-PIN für Demo
    const examplePIN = '345001';

    // Formular-Submit-Event
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const pin = document.getElementById('pin').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;

        messageDiv.style.display = 'none';
        messageDiv.className = 'message';

        // Komplexe Validierung
        if (validateLogin(pin, firstName, lastName)) {
            showMessage('Anmeldung erfolgreich! Sie werden weitergeleitet...', 'success');

            // Weiterleitung zur persönlichen Seite
            setTimeout(function() {
                window.location.href = `/bediensteten/${pin}/index.html`;
            }, 2000);
        } else {
            showMessage('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.', 'error');
        }
    });

    // Kamera-Button-Event (simuliert)
    startCameraBtn.addEventListener('click', function() {
        showMessage('Barcode-Scan wird simuliert... Bitte verwenden Sie stattdessen die manuelle Eingabe.', 'error');

        // Simulierte Barcode-Erkennung nach 3 Sekunden
        setTimeout(function() {
            // Zufälligen Benutzer auswählen für Demo
            const pins = Object.keys(authorizedUsers);
            const randomPin = pins[Math.floor(Math.random() * pins.length)];
            const user = authorizedUsers[randomPin];

            // Formular automatisch ausfüllen
            document.getElementById('pin').value = randomPin;
            document.getElementById('firstName').value = user.firstName;
            document.getElementById('lastName').value = user.lastName;

            showMessage(`Barcode für ${user.firstName} ${user.lastName} erkannt. Bitte klicken Sie auf "Anmelden".`, 'success');
        }, 3000);
    });

    // Validierungsfunktion
    function validateLogin(pin, firstName, lastName) {
        // Überprüfung, ob die PIN genau 6 Ziffern enthält
        if (!/^\d{6}$/.test(pin)) {
            return false;
        }

        // Überprüfung, ob der Benutzer in der Datenbank existiert
        if (!authorizedUsers[pin]) {
            return false;
        }

        // Überprüfung, ob Vor- und Nachname mit der PIN übereinstimmen
        const user = authorizedUsers[pin];
        if (user.firstName.toLowerCase() !== firstName.toLowerCase() ||
            user.lastName.toLowerCase() !== lastName.toLowerCase()) {
            return false;
        }

        // Komplexe PIN-Validierung
        return validatePIN(pin);
    }

    // Komplexe PIN-Validierung
    function validatePIN(pin) {
        // Konvertierung der PIN in ein Array von Ziffern
        const digits = pin.split('').map(Number);

        // Komplexe Bedingung 1: Die ersten drei Ziffern müssen bestimmte Eigenschaften haben
        const firstThree = digits.slice(0, 3);
        const firstThreeSum = firstThree.reduce((a, b) => a + b, 0);
        const firstThreeProduct = firstThree.reduce((a, b) => a * b, 1);

        // Die Summe der ersten drei Ziffern muss durch 3 teilbar sein
        // UND das Produkt muss größer als 10 sein
        if (firstThreeSum % 3 !== 0 || firstThreeProduct <= 10) {
            return false;
        }

        // Komplexe Bedingung 2: Die letzten drei Ziffern müssen fortlaufend sein
        const lastThree = digits.slice(3);

        // Überprüfung, ob die letzten drei Ziffern fortlaufend sind (aufsteigend oder absteigend)
        const isAscending =
            lastThree[0] + 1 === lastThree[1] &&
            lastThree[1] + 1 === lastThree[2];

        const isDescending =
            lastThree[0] - 1 === lastThree[1] &&
            lastThree[1] - 1 === lastThree[2];

        if (!isAscending && !isDescending) {
            return false;
        }

        // Komplexe Bedingung 3: Die Quersumme der PIN muss bestimmte Eigenschaften haben
        const digitSum = digits.reduce((a, b) => a + b, 0);

        // Die Quersumme muss eine Primzahl sein
        if (!isPrime(digitSum)) {
            return false;
        }

        // Komplexe Bedingung 4: Die Ziffern an ungeraden Positionen müssen bestimmte Eigenschaften haben
        const oddPositionDigits = digits.filter((_, index) => (index + 1) % 2 === 1);
        const oddPositionSum = oddPositionDigits.reduce((a, b) => a + b, 0);

        // Die Summe der Ziffern an ungeraden Positionen muss größer sein als die an geraden Positionen
        const evenPositionDigits = digits.filter((_, index) => (index + 1) % 2 === 0);
        const evenPositionSum = evenPositionDigits.reduce((a, b) => a + b, 0);

        if (oddPositionSum <= evenPositionSum) {
            return false;
        }

        // Komplexe Bedingung 5: Die PIN darf keine aufeinanderfolgenden gleichen Ziffern enthalten
        for (let i = 0; i < digits.length - 1; i++) {
            if (digits[i] === digits[i + 1]) {
                return false;
            }
        }

        // Komplexe Bedingung 6: Die PIN muss bestimmte mathematische Eigenschaften erfüllen
        // Die Summe der Quadrate der Ziffern muss durch 7 teilbar sein
        const sumOfSquares = digits.reduce((sum, digit) => sum + digit * digit, 0);
        if (sumOfSquares % 7 !== 0) {
            return false;
        }

        // Komplexe Bedingung 7: Die PIN muss bestimmte Ziffernkombinationen enthalten
        // Die PIN muss mindestens eine Ziffer größer als 5 und mindestens eine Ziffer kleiner als 3 enthalten
        const hasDigitGreaterThan5 = digits.some(digit => digit > 5);
        const hasDigitLessThan3 = digits.some(digit => digit < 3);

        if (!hasDigitGreaterThan5 || !hasDigitLessThan3) {
            return false;
        }

        // Wenn alle Bedingungen erfüllt sind, ist die PIN gültig
        return true;
    }

    // Hilfsfunktion zur Überprüfung, ob eine Zahl eine Primzahl ist
    function isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;

        if (num % 2 === 0 || num % 3 === 0) return false;

        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }

        return true;
    }

    // Nachricht anzeigen
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }

    // Demo: Beispiel-PIN und Name für Testzwecke anzeigen
    console.log('Demo-Zugangsdaten:');
    console.log('PIN: 345001 (Beispiel)');
    console.log('Gültige PINs:', Object.keys(authorizedUsers));
});