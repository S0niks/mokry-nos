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
  let phone = document.getElementById('phone').value.trim();
  const name = document.getElementById('name').value.trim();
  const password = document.getElementById('password').value.trim();

  // Валидация телефона
  phone = phone.replace(/[^0-9+]/g, ''); // Удаляем все, кроме цифр и +
  if (!phone.startsWith('+7')) {
    phone = '+7' + phone.replace(/^\+?8?/, '').slice(0, 10);
  }
  if (!phone.match(/^\+7[0-9]{10}$/)) {
    alert('Введите корректный номер телефона (например, +79001234567)');
    return;
  }

  const payload = { email, phone, name, password };
  console.log('Отправляемые данные:', payload); // Лог для отладки

  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Ответ сервера:', data); // Лог для отладки
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