const form = document.getElementById('register-form') as HTMLFormElement | null;

function selectGender(g: string) {
    document.getElementById('gender-male')?.classList.toggle('selected', g === 'male');
    document.getElementById('gender-female')?.classList.toggle('selected', g === 'female');
    const radio = document.querySelector(`input[name="gender"][value="${g}"]`) as HTMLInputElement | null;
    if (radio) radio.checked = true;
}

const maleBtn = document.getElementById('gender-male');

const femaleBtn = document.getElementById('gender-female');

if (maleBtn) {
    maleBtn.addEventListener('click', () => {
        selectGender('male');
    });
}
if (femaleBtn) {
    femaleBtn.addEventListener('click', () => {
        selectGender('female');
    });
}

if (form) {
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();

        const name          = (document.getElementById('name') as HTMLInputElement).value.trim();
        const age           = parseInt((document.getElementById('age') as HTMLInputElement).value, 10);
        const gender        = (document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null)?.value ?? '';
        const participantId = (document.getElementById('participant-id') as HTMLInputElement).value.trim();

        if (!name || isNaN(age)) {
            alert('Please enter your name and age.');
            return;
        }
        if (!gender) {
            alert('Please select a gender.');
            return;
        }

        localStorage.setItem('user', JSON.stringify({ name, age, gender, participantId }));
        // Use relative path to ensure the file is resolved correctly when opened locally
        window.location.href = './consent.html';
    });
}