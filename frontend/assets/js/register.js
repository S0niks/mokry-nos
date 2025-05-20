fetch('/components/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar').innerHTML = data;
        const token = localStorage.getItem('token');
        const authButtons = document.getElementById('auth-buttons');
        if (token) {
          console.log('Пользователь авторизован, показываем Профиль');
          authButtons.innerHTML = `<a href="/pages/profile.html">Профиль</a>`;
        } else {
          console.log('Пользователь не авторизован, показываем Вход');
          authButtons.innerHTML = `<a href="/pages/login.html">Вход</a>`;
        }
      })
      .catch(err => console.error('Ошибка загрузки навигации:', err));

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const name = document.getElementById('name').value.trim();
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, phone, name, password }),
        });

        const data = await response.json();
        if (response.ok) {
          alert('Регистрация успешна! Теперь вы волонтер. Войдите в систему.');
          window.location.href = '/pages/login.html';
        } else {
          alert(data.message || 'Ошибка регистрации');
        }
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Произошла ошибка. Попробуйте снова.');
      }
    });