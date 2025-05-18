fetch('/components/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar').innerHTML = data;
        const authButtons = document.getElementById('auth-buttons');
        authButtons.innerHTML = `<a href="/pages/login.html">Вход</a>`;
      })
      .catch(err => console.error('Ошибка загрузки навигации:', err));

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          alert('Вход успешен!');
          window.location.href = '/pages/profile.html';
        } else {
          alert(data.message || 'Ошибка входа');
        }
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Произошла ошибка. Попробуйте снова.');
      }
    });