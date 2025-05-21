document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  let userRole = null;

  // Навигация
  fetch('/components/navbar.html')
    .then(res => {
      if (!res.ok) throw new Error('Навигация не загружена');
      return res.text();
    })
    .then(data => {
      document.getElementById('navbar').innerHTML = data;
      const auth = document.getElementById('auth-buttons');
      auth.innerHTML = token
        ? `<a href="/pages/profile.html">Профиль</a>`
        : `<a href="/pages/login.html">Вход</a>`;
    })
    .catch(err => {
      console.error('Ошибка навигации:', err);
      document.getElementById('navbar').innerHTML = '<p>Ошибка загрузки</p>';
    });

  // Роль пользователя
  if (token) {
    fetch('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/pages/login.html';
          throw new Error('Нужен вход');
        }
        if (!r.ok) throw new Error('Ошибка профиля');
        return r.json();
      })
      .then(user => {
        userRole = user.role;
        if (userRole === 'admin') {
          document.getElementById('admin-news-controls').style.display = 'block';
        }
        loadNews();
      })
      .catch(err => {
        console.error('Ошибка профиля:', err);
        loadNews();
      });
  } else {
    loadNews();
  }

  // Загрузка новостей
  async function loadNews() {
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Ошибка загрузки новостей');
      const news = await res.json();
      const container = document.getElementById('news-list');
      if (!news.length) {
        container.innerHTML = '<p>Новостей пока нет.</p>';
        return;
      }

      container.innerHTML = news.map((item, idx) => {
        let mediaHTML = '';
        let mediaArray = [];

        try {
          const parsed = JSON.parse(item.media);
          if (Array.isArray(parsed)) {
            mediaArray = parsed;
          } else if (typeof parsed === 'string') {
            mediaArray = [parsed];
          }
        } catch {
          if (item.media) mediaArray = [item.media];
        }

        if (mediaArray.length === 1) {
          const m = mediaArray[0];
          mediaHTML = m.endsWith('.mp4')
            ? `<video src="${m}" controls style="max-width:100%"></video>`
            : `<img src="${m}" alt="Новость" style="max-width:100%">`;
        } else if (mediaArray.length > 1) {
          mediaHTML = `
            <div class="swiper-container" id="swiper-${idx}">
              <div class="swiper-wrapper">
                ${mediaArray.map(m => `
                  <div class="swiper-slide">
                    ${m.endsWith('.mp4') ? `<video src="${m}" controls></video>` : `<img src="${m}" alt="Новость">`}
                  </div>`).join('')}
              </div>
              <div class="swiper-pagination"></div>
              <div class="swiper-button-prev"></div>
              <div class="swiper-button-next"></div>
            </div>`;
        }

        return `
          <div class="news-item">
            <p>${item.text.replace(/\n/g, '<br>')}</p>
            ${mediaHTML}
            <div class="news-meta">Опубликовано: ${new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
            ${userRole === 'admin' ? `
              <div class="news-actions">
                <button onclick="openEditNewsModal(${item.id})">Редактировать</button>
                <button onclick="openDeleteNewsModal(${item.id}, '${item.text.replace(/'/g, "\\'").slice(0, 50)}')">Удалить</button>
              </div>` : ''}
          </div>`;
      }).join('');

      document.querySelectorAll('.swiper-container').forEach(swiperEl => {
        new Swiper(`#${swiperEl.id}`, {
          loop: true,
          pagination: {
            el: `#${swiperEl.id} .swiper-pagination`,
            clickable: true,
          },
          navigation: {
            nextEl: `#${swiperEl.id} .swiper-button-next`,
            prevEl: `#${swiperEl.id} .swiper-button-prev`,
          }
        });
      });
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err);
      document.getElementById('news-list').innerHTML = '<p>Ошибка загрузки.</p>';
    }
  }

  // Анимация собаки
  const dog = document.getElementById('dog-image');
  if (dog) {
    window.addEventListener('scroll', () => {
      dog.style.transform = `translateX(${-window.scrollY * 0.4}px)`;
    });
  }

  // Анимация кота
  const cat = document.getElementById('cat-image');
  if (cat) {
    window.addEventListener('scroll', () => {
      cat.style.transform = `translateX(${window.scrollY * 0.4}px)`;
    });
  }

  // Модальные окна
  let activeModal = null;

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
    activeModal = modal;
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    document.body.style.overflow = '';
    activeModal = null;
  }

  document.getElementById('add-news-button')?.addEventListener('click', () => {
    openModal('add-news-modal');
    document.getElementById('add-news-form').reset();
  });

  window.openEditNewsModal = async function (id) {
    try {
      const res = await fetch(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/pages/login.html';
        throw new Error('Нужен вход');
      }
      const data = await res.json();
      document.getElementById('edit-news-id').value = data.id;
      document.getElementById('edit-news-text').value = data.text;
      document.getElementById('edit-current-media').textContent = data.media || 'Отсутствует';
      openModal('edit-news-modal');
    } catch (e) {
      alert('Ошибка загрузки новости');
    }
  };

  window.openDeleteNewsModal = function (id, text) {
    document.getElementById('delete-news-id').value = id;
    document.getElementById('delete-news-text').textContent = text;
    openModal('delete-news-modal');
  };

  document.querySelectorAll('.modal-close, .cancel-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => closeModal(m.id));
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target.id);
    }
  });

  // Добавление новости
  document.getElementById('add-news-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('text', document.getElementById('add-news-text').value);
    const file = document.getElementById('add-news-media').files[0];
    if (file) formData.append('media', file);

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/pages/login.html';
        return;
      }
      const result = await res.json();
      alert('Новость добавлена!');
      closeModal('add-news-modal');
      loadNews();
    } catch (e) {
      alert('Ошибка добавления новости');
    }
  });

  // Редактирование
  document.getElementById('edit-news-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('edit-news-id').value;
    const formData = new FormData();
    formData.append('text', document.getElementById('edit-news-text').value);
    const file = document.getElementById('edit-news-media').files[0];
    if (file) formData.append('media', file);
    else {
      const currentMedia = document.getElementById('edit-current-media').textContent;
      formData.append('currentMedia', currentMedia);
    }


    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/pages/login.html';
        return;
      }
      alert('Новость обновлена!');
      closeModal('edit-news-modal');
      loadNews();
    } catch (e) {
      alert('Ошибка редактирования');
    }
  });

  // Удаление
  document.getElementById('confirm-delete-button')?.addEventListener('click', async () => {
    const id = document.getElementById('delete-news-id').value;
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/pages/login.html';
        return;
      }
      alert('Новость удалена!');
      closeModal('delete-news-modal');
      loadNews();
    } catch (e) {
      alert('Ошибка удаления');
    }
  });
});
