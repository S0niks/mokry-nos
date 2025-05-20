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
      let userRole = null;

      // Проверка роли пользователя
      if (token) {
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
              document.getElementById('admin-news-controls').style.display = 'block';
            }
            loadNews();
          })
          .catch(err => {
            console.error('Ошибка загрузки профиля:', err);
            loadNews();
          });
      } else {
        loadNews();
      }

      // Загрузка новостей
      async function loadNews() {
        try {
          const newsResponse = await fetch('/api/news');
          if (!newsResponse.ok) throw new Error('Ошибка загрузки новостей');
          const news = await newsResponse.json();

          const newsList = document.getElementById('news-list');
          if (news.length === 0) {
            newsList.innerHTML = '<p>Новостей пока нет.</p>';
          } else {
           newsList.innerHTML = news.map((item, index) => {
            let mediaHTML = '';

            // Преобразуем поле media в массив
            let mediaArray = [];
            if (item.media) {
              try {
                const parsed = JSON.parse(item.media);
                if (Array.isArray(parsed)) {
                  mediaArray = parsed;
                } else if (typeof parsed === 'string') {
                  mediaArray = [parsed];
                }
              } catch (e) {
                mediaArray = [item.media]; // обычная строка, не JSON
              }
            }


            // Если одно изображение
            if (mediaArray.length === 1) {
              const media = mediaArray[0];
              mediaHTML = media.endsWith('.mp4')
                ? `<video src="${media}" controls style="max-width: 100%;"></video>`
                : `<img src="${media}" alt="Новость" style="max-width: 100%;">`;
            }

            // Если несколько — слайдер
            else if (mediaArray.length > 1) {
              mediaHTML = `
                <div class="swiper-container" id="swiper-${index}">
                  <div class="swiper-wrapper">
                    ${mediaArray.map(m =>
                      `<div class="swiper-slide">
                        ${m.endsWith('.mp4')
                          ? `<video src="${m}" controls></video>`
                          : `<img src="${m}" alt="Новость">`}
                      </div>`
                    ).join('')}
                  </div>
                  <div class="swiper-pagination"></div>
                  <div class="swiper-button-prev"></div>
                  <div class="swiper-button-next"></div>
                </div>
              `;
            }

            return `
              <div class="news-item">
                <p>${item.text}</p>
                ${mediaHTML}
                <div class="news-meta">Опубликовано: ${new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
                ${userRole === 'admin' ? `
                  <div class="news-actions">
                    <button onclick="openEditNewsModal(${item.id})">Редактировать</button>
                    <button onclick="openDeleteNewsModal(${item.id}, '${item.text.replace(/'/g, "\\'").slice(0, 50)}')">Удалить</button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('');
          // Инициализация Swiper после генерации HTML
          document.querySelectorAll('.swiper-container').forEach(container => {
            new Swiper(`#${container.id}`, {
              loop: true,
              navigation: {
                nextEl: `#${container.id} .swiper-button-next`,
                prevEl: `#${container.id} .swiper-button-prev`,
              },
              pagination: {
                el: `#${container.id} .swiper-pagination`,
                clickable: true,
              },
            });
          });
          }
        } catch (err) {
          console.error('Ошибка загрузки новостей:', err);
          document.getElementById('news-list').innerHTML = '<p>Ошибка загрузки новостей.</p>';
        }
      }

      // Анимация собаки при прокрутке
      const dogImage = document.getElementById('dog-image');
      if (dogImage) {
        window.addEventListener('scroll', () => {
          const scrollY = window.scrollY;
          dogImage.style.transform = `translateX(${scrollY * 0.4}px)`;
        });
      }



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
      document.getElementById('add-news-button')?.addEventListener('click', () => {
        openModal('add-news-modal');
        document.getElementById('add-news-form').reset();
      });

      // Открытие модального окна для редактирования
      window.openEditNewsModal = async function(newsId) {
        try {
          const response = await fetch(`/api/news/${newsId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
            throw new Error('Требуется повторный вход');
          }
          if (!response.ok) throw new Error('Ошибка загрузки новости');
          const news = await response.json();

          document.getElementById('edit-news-id').value = news.id;
          document.getElementById('edit-news-text').value = news.text;
          document.getElementById('edit-current-media').textContent = news.media ? news.media : 'Отсутствует';
          openModal('edit-news-modal');
        } catch (err) {
          console.error('Ошибка:', err);
          alert('Не удалось загрузить данные новости');
        }
      };

      // Открытие модального окна для удаления
      window.openDeleteNewsModal = function(newsId, newsText) {
        document.getElementById('delete-news-id').value = newsId;
        document.getElementById('delete-news-text').textContent = newsText;
        openModal('delete-news-modal');
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

      // Добавление новости
      document.getElementById('add-news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('text', document.getElementById('add-news-text').value);
        const mediaFile = document.getElementById('add-news-media').files[0];
        if (mediaFile) {
          formData.append('media', mediaFile);
        }

        try {
          const response = await fetch('/api/news', {
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
            throw new Error(errorData.message || 'Ошибка добавления новости');
          }
          const data = await response.json();
          alert('Новость добавлена!');
          closeModal('add-news-modal');
          loadNews();
        } catch (err) {
          console.error('Ошибка:', err);
          alert(err.message || 'Произошла ошибка при добавлении новости');
        }
      });

      // Редактирование новости
      document.getElementById('edit-news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newsId = document.getElementById('edit-news-id').value;
        const formData = new FormData();
        formData.append('text', document.getElementById('edit-news-text').value);
        const mediaFile = document.getElementById('edit-news-media').files[0];
        if (mediaFile) {
          formData.append('media', mediaFile);
        }

        try {
          const response = await fetch(`/api/news/${newsId}`, {
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
            throw new Error(errorData.message || 'Ошибка редактирования новости');
          }
          const data = await response.json();
          alert(data.message || 'Новость обновлена!');
          closeModal('edit-news-modal');
          loadNews();
        } catch (err) {
          console.error('Ошибка:', err);
          alert(err.message || 'Произошла ошибка при редактировании новости');
        }
      });

      // Удаление новости
      document.getElementById('confirm-delete-button').addEventListener('click', async () => {
        const newsId = document.getElementById('delete-news-id').value;
        try {
          const response = await fetch(`/api/news/${newsId}`, {
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
            throw new Error(errorData.message || 'Ошибка удаления новости');
          }
          const data = await response.json();
          alert(data.message || 'Новость удалена!');
          closeModal('delete-news-modal');
          loadNews();
        } catch (err) {
          console.error('Ошибка:', err);
          alert(err.message || 'Произошла ошибка при удалении новости');
        }
      });
    });