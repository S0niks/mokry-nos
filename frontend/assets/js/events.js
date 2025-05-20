// Загрузка навигации
    fetch('/components/navbar.html')
      .then(response => {
        if (!response.ok) throw new Error('Не удалось загрузить навигацию');
        return response.text();
      })
      .then(data => {
        document.getElementById('navbar').innerHTML = data;
        const token = localStorage.getItem('token');
        const authButtons = document.getElementById('auth-buttons');
        if (token) {
          authButtons.innerHTML = `<a href="/pages/profile.html">Профиль</a>`;
        } else {
          authButtons.innerHTML = `<a href="/pages/login.html">Вход</a>`;
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки навигации:', err);
        document.getElementById('navbar').innerHTML = '<p>Ошибка загрузки навигации</p>';
      });

    document.addEventListener('DOMContentLoaded', () => {
      const token = localStorage.getItem('token');
      const unauthorizedMessage = document.getElementById('unauthorized-message');
      const authorizedContent = document.getElementById('authorized-content');
      let userRole = null;

      if (!token) {
        unauthorizedMessage.style.display = 'block';
        return;
      }

      authorizedContent.style.display = 'block';

      // Проверка роли пользователя
      fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(response => {
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) throw new Error('Не удалось загрузить профиль');
          return response.json();
        })
        .then(data => {
          userRole = data.role;
          if (userRole === 'admin') {
            document.getElementById('admin-event-controls').style.display = 'block';
          }
          loadEvents();
        })
        .catch(err => {
          console.error('Ошибка загрузки профиля:', err);
          loadEvents();
        });

      // Загрузка мероприятий
      async function loadEvents() {
        try {
          const eventsResponse = await fetch('/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (eventsResponse.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!eventsResponse.ok) throw new Error('Ошибка загрузки мероприятий');
          let events = await eventsResponse.json();

          let likedEventIds = [];
          if (userRole !== 'admin') {
            const likedEventsResponse = await fetch('/api/events/user', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (likedEventsResponse.status === 401) {
              localStorage.removeItem('token');
              window.location.href = '/pages/login.html';
              throw new Error('Требуется повторный вход');
            }
            if (!likedEventsResponse.ok) throw new Error('Ошибка загрузки лайкнутых мероприятий');
            const likedEvents = await likedEventsResponse.json();
            likedEventIds = likedEvents.map(event => event.id);
          }

          // Получение значения фильтра по дате проведения
          const sortEventDate = document.getElementById('sort-event-date').value;

          // Сортировка мероприятий по дате проведения
          events = events.sort((a, b) => {
            const dateA = new Date(a.event_date);
            const dateB = new Date(b.event_date);
            if (sortEventDate === 'newest') {
              return dateB - dateA;
            } else {
              return dateA - dateB;
            }
          });

          const eventList = document.getElementById('event-list');
          if (events.length === 0) {
            eventList.innerHTML = '<p>Мероприятий пока нет.</p>';
          } else {
            eventList.innerHTML = events.map(event => {
              const isLiked = likedEventIds.includes(event.id);
              return `
                <div class="event-card">
                  <h3>${event.title}</h3>
                  <p>${event.description}</p>
                  <p>Дата: ${new Date(event.event_date).toLocaleDateString('ru-RU')}</p>
                  ${event.media ? (event.media.endsWith('.mp4') ?
                    `<video src="${event.media}" controls style="max-width: 100%;"></video>` :
                    `<img src="${event.media}" alt="${event.title}" style="max-width: 100%;" onerror="this.style.display='none';">`) : ''}
                  ${token && userRole !== 'admin' ? `
                    <button class="like-button" onclick="likeEvent(${event.id})" style="display: ${isLiked ? 'none' : 'inline-block'};">Лайк</button>
                    <button class="unlike-button" onclick="unlikeEvent(${event.id})" style="display: ${isLiked ? 'inline-block' : 'none'};">Убрать лайк</button>
                  ` : ''}
                  ${userRole === 'admin' ? `
                    <div class="event-actions">
                      <button onclick="openEditEventModal(${event.id})">Редактировать</button>
                      <button onclick="openDeleteEventModal(${event.id}, '${event.title}')">Удалить</button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('');
          }
        } catch (err) {
          console.error('Ошибка загрузки мероприятий:', err);
          document.getElementById('event-list').innerHTML = '<p>Ошибка загрузки мероприятий.</p>';
        }
      }

      // Обработчик изменения фильтра
      document.getElementById('sort-event-date').addEventListener('change', loadEvents);

      // Функции для управления модальными окнами
      let activeModal = null;

      function openModal(modalId) {
        if (activeModal) {
          console.log(`Модальное окно ${activeModal.id} уже открыто, игнорируем`);
          return;
        }
        const modal = document.getElementById(modalId);
        if (modal) {
          console.log(`Открытие модального окна: ${modalId}`);
          modal.classList.add('active');
          modal.style.display = 'flex';
          modal.style.visibility = 'visible';
          modal.style.opacity = '1';
          document.body.style.overflow = 'hidden';
          activeModal = modal;
        } else {
          console.error(`Модальное окно с ID ${modalId} не найдено`);
        }
      }

      function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
          console.log(`Закрытие модального окна: ${modalId}`);
          modal.classList.remove('active');
          modal.style.display = 'none';
          modal.style.visibility = 'hidden';
          modal.style.opacity = '0';
          document.body.style.overflow = '';
          activeModal = null;
        } else {
          console.error(`Модальное окно с ID ${modalId} не найдено`);
        }
      }

      // Открытие модального окна для добавления
      document.getElementById('add-event-button')?.addEventListener('click', () => {
        openModal('add-event-modal');
        document.getElementById('add-event-form').reset();
      });

      // Открытие модального окна для редактирования
      window.openEditEventModal = async function(eventId) {
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) throw new Error('Ошибка загрузки мероприятия');
          const event = await response.json();

          document.getElementById('edit-event-id').value = event.id;
          document.getElementById('edit-title').value = event.title;
          document.getElementById('edit-description').value = event.description;
          document.getElementById('edit-event-date').value = event.event_date.split('T')[0];
          document.getElementById('edit-current-media').textContent = event.media ? event.media : 'Отсутствует';
          openModal('edit-event-modal');
        } catch (err) {
          console.error('Ошибка:', err);
          alert('Не удалось загрузить данные мероприятия');
        }
      };

      // Открытие модального окна для удаления
      window.openDeleteEventModal = function(eventId, eventTitle) {
        document.getElementById('delete-event-id').value = eventId;
        document.getElementById('delete-event-title').textContent = eventTitle;
        openModal('delete-event-modal');
      };

      // Закрытие модальных окон
      document.querySelectorAll('.modal-close, .cancel-button').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelectorAll('.modal').forEach(modal => {
            closeModal(modal.id);
          });
        });
      });

      // Закрытие модального окна при клике вне контента
      window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
          closeModal(event.target.id);
        }
      });

      // Добавление мероприятия
      document.getElementById('add-event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', document.getElementById('add-title').value);
        formData.append('description', document.getElementById('add-description').value);
        formData.append('event_date', document.getElementById('add-event-date').value);
        const mediaFile = document.getElementById('add-media').files[0];
        if (mediaFile) {
          formData.append('media', mediaFile);
        }

        try {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка добавления мероприятия');
          }
          const data = await response.json();
          alert('Мероприятие добавлено!');
          closeModal('add-event-modal');
          loadEvents();
        } catch (err) {
          console.error('Ошибка:', err);
          alert(err.message || 'Произошла ошибка при добавлении мероприятия');
        }
      });

      // Редактирование мероприятия
      document.getElementById('edit-event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = document.getElementById('edit-event-id').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('edit-title').value);
        formData.append('description', document.getElementById('edit-description').value);
        formData.append('event_date', document.getElementById('edit-event-date').value);
        const mediaFile = document.getElementById('edit-media').files[0];
        if (mediaFile) {
          formData.append('media', mediaFile);
        }

        try {
          const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка редактирования мероприятия');
          }
          const data = await response.json();
          alert(data.message || 'Мероприятие обновлено!');
          closeModal('edit-event-modal');
          loadEvents();
        } catch (err) {
          console.error('Ошибка:', err);
          alert(err.message || 'Произошла ошибка при редактировании мероприятия');
        }
      });

      // Удаление мероприятия
      document.getElementById('confirm-delete-button').addEventListener('click', async () => {
        const eventId = document.getElementById('delete-event-id').value;
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка удаления мероприятия');
          }
          const data = await response.json();
          alert(data.message || 'Мероприятие удалено!');
          closeModal('delete-event-modal');
          loadEvents();
        } catch (err) {
          console.error('Ошибка:', err);
          alert(err.message || 'Произошла ошибка при удалении мероприятия');
        }
      });

      // Добавление лайка
      window.likeEvent = async function(eventId) {
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
          if (!response.ok) throw new Error('Ошибка добавления лайка');
          const data = await response.json();
          alert(data.message);
          loadEvents();
        } catch (err) {
          console.error('Ошибка:', err);
          alert('Произошла ошибка при добавлении лайка');
        }
      };

      // Удаление лайка
      window.unlikeEvent = async function(eventId) {
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
          alert(data.message);
          loadEvents();
        } catch (err) {
          console.error('Ошибка:', err);
          alert('Произошла ошибка при удалении лайка');
        }
      };
    });