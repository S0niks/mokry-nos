// Загрузка навигации
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

    document.addEventListener('DOMContentLoaded', () => {
      const token = localStorage.getItem('token');
      const profileContent = document.getElementById('profile-content');
      const userEventsSection = document.getElementById('user-events-section');
      const userEventsList = document.getElementById('user-events');
      const adminVolunteers = document.getElementById('admin-volunteers');
      const volunteersList = document.getElementById('volunteers-list');
      const logoutButton = document.getElementById('logout-button');

      if (!token) {
        window.location.href = '/pages/login.html';
        return;
      }

      // Функция для загрузки мероприятий
      const loadUserEvents = () => {
        fetch('/api/events/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(response => {
            if (response.status === 401) {
              localStorage.removeItem('token');
              window.location.href = '/pages/login.html';
              throw new Error('Требуется повторный вход');
            }
            if (!response.ok) throw new Error('Ошибка загрузки мероприятий');
            return response.json();
          })
          .then(events => {
            userEventsList.innerHTML = '';
            if (events.length === 0) {
              userEventsList.innerHTML = '<p>Вы пока не выбрали ни одного мероприятия.</p>';
            } else {
              events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                  <h3>${event.title}</h3>
                  <p>${event.description}</p>
                  <p>Дата: ${new Date(event.event_date).toLocaleDateString('ru-RU')}</p>
                  ${event.media ? (event.media.endsWith('.mp4') ?
                    `<video src="${event.media}" controls style="max-width: 100%;"></video>` :
                    `<img src="${event.media}" alt="${event.title}" style="max-width: 100%;">`) : ''}
                  <button onclick="unlikeEvent(${event.id})">Убрать лайк</button>
                `;
                userEventsList.appendChild(eventCard);
              });
            }
          })
          .catch(error => {
            console.error('Ошибка:', error);
            userEventsList.innerHTML = '<p>Не удалось загрузить мероприятия.</p>';
          });
      };

      // Функция для удаления лайка
      window.unlikeEvent = async (eventId) => {
        try {
          const response = await fetch(`/api/events/${eventId}/like`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) throw new Error('Ошибка удаления лайка');
          const data = await response.json();
          alert(data.message); // Например, "Лайк удален"
          loadUserEvents(); // Перезагрузка списка мероприятий
        } catch (err) {
          console.error('Ошибка:', err);
          alert('Произошла ошибка при удалении лайка');
        }
      };

      // Загрузка данных профиля
      fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(response => {
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) throw new Error('Ошибка загрузки профиля');
          return response.json();
        })
        .then(data => {
          profileContent.innerHTML = `
            <p>Имя: ${data.name}</p>
            <p>Email: ${data.email}</p>
            <p>Телефон: ${data.phone || 'Не указан'}</p>
            <p>Роль: ${data.role === 'admin' ? 'Администратор' : 'Волонтер'}</p>
          `;

          // Показать секцию мероприятий только для не-администраторов
          if (data.role !== 'admin') {
            userEventsSection.style.display = 'block';
            loadUserEvents();
          }

          // Загрузка списка волонтеров для админа
          if (data.role === 'admin') {
            adminVolunteers.style.display = 'block';
            fetch('/api/users/volunteers', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(response => {
                if (response.status === 401) {
                  localStorage.removeItem('token');
                  window.location.href = '/pages/login.html';
                  throw new Error('Требуется повторный вход');
                }
                if (!response.ok) throw new Error('Ошибка загрузки волонтеров');
                return response.json();
              })
              .then(volunteers => {
                volunteersList.innerHTML = volunteers.map(user => `
                  <div class="volunteer-item">
                    <p>Имя: ${user.name}</p>
                    <p>Email: ${user.email}</p>
                    <p>Телефон: ${user.phone || 'Не указан'}</p>
                    <p>Роль: ${user.role === 'admin' ? 'Администратор' : 'Волонтер'}</p>
                    <button onclick="updateRole(${user.id}, 'admin')">Сделать администратором</button>
                  </div>
                `).join('');
              })
              .catch(err => console.error('Ошибка загрузки волонтеров:', err));
          }

          // Обработчик загрузки аватара
          document.getElementById('upload-avatar-button').addEventListener('click', async () => {
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
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              });
              if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/pages/login.html';
                throw new Error('Требуется повторный вход');
              }
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
        .catch(err => {
          console.error('Ошибка загрузки профиля:', err);
          alert('Не удалось загрузить данные профиля');
        });

      // Обработчик выхода
      logoutButton.addEventListener('click', () => {
        console.log('Кнопка выхода нажата');
        localStorage.removeItem('token');
        alert('Вы вышли из профиля!');
        window.location.href = '/pages/login.html';
      });

      // Обновление роли пользователя
      window.updateRole = async (userId, newRole) => {
        if (confirm(`Сделать пользователя с ID ${userId} администратором?`)) {
          try {
            const response = await fetch(`/api/users/role/${userId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ role: newRole })
            });
            if (response.status === 401) {
              localStorage.removeItem('token');
              window.location.href = '/pages/login.html';
              throw new Error('Требуется повторный вход');
            }
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
    });