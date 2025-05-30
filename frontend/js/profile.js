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

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/pages/login.html';
    }

    // Загрузка данных профиля
    fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        document.getElementById('profile-content').innerHTML = `
          <p>Имя: ${data.name}</p>
          <p>Email: ${data.email}</p>
          <p>Телефон: ${data.phone}</p>
          <p>Роль: ${data.role === 'admin' ? 'Администратор' : 'Волонтер'}</p>
          <div id="avatar-section">
            <img id="avatar-img" src="${data.avatar || ''}" alt="Аватар" style="max-width: 150px; ${data.avatar ? '' : 'display: none;'}">
            <input type="file" id="avatar-upload" accept="image/jpeg,image/jpg,image/png">
            <button id="upload-avatar-button">Загрузить аватар</button>
          </div>
        `;

        // Загрузка списка волонтеров для админа
        if (data.role === 'admin') {
          document.getElementById('admin-volunteers').style.display = 'block';
          fetch('/api/users/volunteers', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
            .then(response => response.json())
            .then(volunteers => {
              const volunteersList = document.getElementById('volunteers-list');
              volunteersList.innerHTML = volunteers.map(user => `
                <div class="volunteer-item">
                  <p>Имя: ${user.name}</p>
                  <p>Email: ${user.email}</p>
                  <p>Телефон: ${user.phone}</p>
                  <p>Роль: ${user.role === 'admin' ? 'Администратор' : 'Волонтер'}</p>
                  <button onclick="updateRole(${user.id}, 'admin')">Сделать администратором</button>
                </div>
              `).join('');
            })
            .catch(err => console.error('Ошибка загрузки волонтеров:', err));
        }

        // Привязка обработчика для загрузки аватарки
        document.getElementById('upload-avatar-button').addEventListener('click', async () => {
          const avatarInput = document.getElementById('avatar-upload');
          const file = avatarInput.files[0];
          if (!file) {
            alert('Выберите файл для загрузки!');
            return;
          }
          const formData = new FormData();
          formData.append('avatar', file);
          try {
            const response = await fetch('/api/users/avatar', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });
            const data = await response.json();
            if (response.ok) {
              alert('Аватар успешно загружен!');
              document.getElementById('avatar-img').src = data.avatar;
              document.getElementById('avatar-img').style.display = 'block';
            } else {
              alert(data.message || 'Ошибка загрузки аватара');
            }
          } catch (err) {
            console.error('Ошибка:', err);
            alert('Произошла ошибка. Попробуйте снова.');
          }
        });
      })
      .catch(err => console.error('Ошибка загрузки профиля:', err));

    // Обработчик выхода
    document.getElementById('logout-button').addEventListener('click', () => {
      console.log('Кнопка выхода нажата');
      localStorage.removeItem('token');
      alert('Вы вышли из профиля!');
      window.location.href = '/pages/login.html';
    });

    window.updateRole = async (userId, newRole) => {
      if (confirm(`Сделать пользователя с ID ${userId} администратором?`)) {
        try {
          const response = await fetch(`/api/users/role/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: newRole }),
          });
          const data = await response.json();
          if (response.ok) {
            alert('Роль обновлена!');
            window.location.reload();
          } else {
            alert(data.message || 'Ошибка изменения роли');
          }
        } catch (err) {
          console.error('Ошибка:', err);
          alert('Произошла ошибка. Попробуйте снова.');
        }
      }
    };