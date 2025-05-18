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
            alert('У вас нет прав для добавления животных. Обратитесь к администратору.');
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
      window.location.href = '/pages/login.html';
    }
  })
  .catch(err => console.error('Ошибка загрузки навигации:', err));

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/pages/login.html';
}

document.getElementById('image').addEventListener('change', (e) => {
  const preview = document.getElementById('image-preview');
  preview.innerHTML = '';
  const file = e.target.files[0];
  if (file) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.maxWidth = '200px';
    img.style.marginTop = '10px';
    preview.appendChild(img);
  }
});

document.getElementById('add-animal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const species = document.getElementById('species').value;
  const gender = document.getElementById('gender').value;
  const status = document.getElementById('status').value;

  if (!name || !description || !species || !gender || !status) {
    alert('Заполните все поля!');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('species', species);
  formData.append('gender', gender);
  formData.append('status', status);
  const imageInput = document.getElementById('image');
  if (imageInput.files[0]) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    const response = await fetch('/api/animals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      alert('Животное успешно добавлено!');
      window.location.href = '/pages/profile.html';
    } else {
      alert(data.message || 'Ошибка добавления животного');
    }
  } catch (err) {
    console.error('Ошибка:', err);
    alert('Произошла ошибка. Попробуйте снова.');
  }
});