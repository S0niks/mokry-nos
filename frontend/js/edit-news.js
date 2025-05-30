fetch('/components/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar').innerHTML = data;
        const token = localStorage.getItem('token');
        const authButtons = document.getElementById('auth-buttons');
        if (token) {
          fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
          })
            .then(response => {
              if (!response.ok) throw new Error('Ошибка авторизации');
              return response.json();
            })
            .then(user => {
              if (user.role !== 'admin') {
                document.getElementById('add-animal-container').style.display = 'none';
                alert('У вас нет прав для редактирования новостей. Обратитесь к администратору.');
              } else {
                authButtons.innerHTML = `<a href="/pages/profile.html">Профиль</a>`;
              }
            })
            .catch(err => {
              console.error('Ошибка проверки роли:', err);
              localStorage.removeItem('token');
              window.location.href = '/pages/login.html';
            });
        } else {
          authButtons.innerHTML = `<a href="/pages/login.html">Вход</a>`;
        }
      })
      .catch(err => console.error('Ошибка загрузки навигации:', err));

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/pages/login.html';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    fetch(`/api/news/${newsId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(news => {
        if (!news) {
          alert('Новость не найдена');
          window.location.href = '/';
          return;
        }
        document.getElementById('text').value = news.text;

        const preview = document.getElementById('media-preview');
        if (news.media) {
          if (news.media_type && news.media_type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = news.media;
            img.style.maxWidth = '200px';
            img.style.marginTop = '10px';
            preview.appendChild(img);
          } else if (news.media_type && news.media_type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = news.media;
            video.controls = true;
            video.style.maxWidth = '200px';
            video.style.marginTop = '10px';
            preview.appendChild(video);
          }
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки новости:', err);
        alert('Ошибка загрузки данных новости');
        window.location.href = '/';
      });

    document.getElementById('media').addEventListener('change', (e) => {
      const preview = document.getElementById('media-preview');
      preview.innerHTML = '';
      const file = e.target.files[0];
      if (file) {
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.style.maxWidth = '200px';
          img.style.marginTop = '10px';
          preview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.src = URL.createObjectURL(file);
          video.controls = true;
          video.style.maxWidth = '200px';
          video.style.marginTop = '10px';
          preview.appendChild(video);
        }
      }
    });

    document.getElementById('edit-news-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = document.getElementById('text').value.trim();

      if (!text) {
        alert('Заполните поле текста!');
        return;
      }

      const formData = new FormData();
      formData.append('text', text);
      const mediaInput = document.getElementById('media');
      if (mediaInput.files[0]) {
        formData.append('media', mediaInput.files[0]);
      }

      try {
        const response = await fetch(`/api/news/${newsId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          alert('Новость успешно обновлена!');
          window.location.href = '/';
        } else {
          alert(data.message || 'Ошибка обновления новости');
        }
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Произошла ошибка. Попробуйте снова.');
      }
    });