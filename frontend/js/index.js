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
  
    let userRole = null;
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => {
          if (!response.ok) throw new Error('Не удалось загрузить профиль');
          return response.json();
        })
        .then(data => {
          userRole = data.role;
          console.log('Роль пользователя:', userRole);
          if (userRole === 'admin') {
            document.getElementById('admin-news-controls').style.display = 'block';
          }
        })
        .catch(err => {
          console.error('Ошибка загрузки профиля:', err);
        });
    }
  
    fetch('/api/news')
      .then(response => response.json())
      .then(news => {
        const newsList = document.getElementById('news-list');
        if (news.length === 0) {
          newsList.innerHTML = '<p>Новостей пока нет.</p>';
        } else {
          newsList.innerHTML = news.map(item => {
            console.log('Медиа для новости:', item.media);
            return `
              <div class="news-item">
                <p>${item.text}</p>
                ${item.media ? (item.media.endsWith('.mp4') ? 
                  `<video src="${item.media}" controls style="max-width: 100%;"></video>` : 
                  `<img src="${item.media}" alt="Media" style="max-width: 100%;" onerror="this.style.display='none';console.log('Ошибка загрузки медиа:', '${item.media}')">`) : ''}
                <p class="news-meta">Добавлено: ${new Date(item.created_at).toLocaleString('ru-RU')}</p>
                ${token && userRole === 'admin' ? `
                  <div class="news-actions">
                    <button onclick="editNews(${item.id}, '${item.text}', '${item.media || ''}')">Редактировать</button>
                    <button onclick="deleteNews(${item.id})">Удалить</button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('');
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки новостей:', err);
        document.getElementById('news-list').innerHTML = '<p>Ошибка загрузки новостей.</p>';
      });
  
    document.getElementById('help-button').addEventListener('click', () => {
      window.location.href = '/pages/help.html';
    });
  
    document.getElementById('add-news-button')?.addEventListener('click', () => {
      window.location.href = '/pages/add-news.html';
    });
  
    window.editNews = function(id, text, media) {
      const newText = prompt('Введите новый текст новости:', text);
      const mediaPrompt = confirm('Хотите загрузить новое медиа?');
      let newMedia = null;
  
      if (newText) {
        const formData = new FormData();
        formData.append('text', newText);
  
        if (mediaPrompt) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/jpeg,image/jpg,image/png,video/mp4';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              formData.append('media', file);
            }
            sendEditRequest(id, formData);
          };
          input.click();
        } else {
          formData.append('media', media);
          sendEditRequest(id, formData);
        }
      }
    };
  
    function sendEditRequest(id, formData) {
      fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message);
          window.location.reload();
        })
        .catch(err => {
          console.error('Ошибка редактирования:', err);
          alert('Ошибка редактирования новости');
        });
    }
  
    window.deleteNews = function(id) {
      if (confirm('Вы уверены, что хотите удалить эту новость?')) {
        fetch(`/api/news/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
          .then(response => response.json())
          .then(data => {
            alert(data.message);
            window.location.reload();
          })
          .catch(err => {
            console.error('Ошибка удаления:', err);
            alert('Ошибка удаления новости');
          });
      }
    };