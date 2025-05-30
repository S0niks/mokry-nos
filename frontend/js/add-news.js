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
            alert('У вас нет прав для добавления новости. Обратитесь к администратору.');
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

document.getElementById('add-news-form').addEventListener('submit', async (e) => {
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
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      alert('Новость успешно добавлена!');
      window.location.href = '/';
    } else {
      alert(data.message || 'Ошибка добавления новости');
    }
  } catch (err) {
    console.error('Ошибка:', err);
    alert('Произошла ошибка. Попробуйте снова.');
  }
});