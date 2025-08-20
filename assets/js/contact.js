// assets/js/contact.js
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const statusDiv = document.getElementById('contact-form-status');
            const submitButton = contactForm.querySelector('input[type="submit"]');

            statusDiv.textContent = 'A enviar...';
            submitButton.disabled = true;

            try {
                // ****** IMPORTANTE: Use a mesma URL do seu Web App! ******
                const webAppUrl = 'URL_DA_SUA_APLICAÇÃO_WEB_AQUI';

                const payload = {
                    action: 'handleContact', // << Ação para o nosso "router"
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    message: document.getElementById('message').value
                };

                const response = await fetch(webAppUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });

                const data = await response.json();

                if (data.status === 'success') {
                    statusDiv.textContent = data.message;
                    statusDiv.style.color = 'green';
                    contactForm.reset();
                } else {
                    throw new Error(data.message);
                }

            } catch (error) {
                statusDiv.textContent = 'Erro: ' + error.message;
                statusDiv.style.color = 'red';
            } finally {
                submitButton.disabled = false;
            }
        });
    }
});