 fetch('/components/navbar.html')
      .then(response => response.text())
      .then(data => { 
        document.getElementById('navbar').innerHTML = data;
      // Добавляем логику отображения кнопок
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