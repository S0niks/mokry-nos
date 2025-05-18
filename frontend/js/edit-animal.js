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
                alert('У вас нет прав для редактирования животных. Обратитесь к администратору.');
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
    const animalId = urlParams.get('id');

    fetch(`/api/animals/${animalId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(animal => {
        if (!animal) {
          alert('Животное не найдено');
          window.location.href = '/pages/animals.html';
          return;
        }
        document.getElementById('name').value = animal.name.charAt(0).toUpperCase() + animal.name.slice(1);
        document.getElementById('description').value = animal.description;
        document.getElementById('species').value = animal.species;
        document.getElementById('gender').value = animal.gender;
        document.getElementById('status').value = animal.status;

        const preview = document.getElementById('image-preview');
        if (animal.image) {
          const img = document.createElement('img');
          img.src = animal.image; // Путь теперь из базы
          img.style.maxWidth = '200px';
          img.style.marginTop = '10px';
          preview.appendChild(img);
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки животного:', err);
        alert('Ошибка загрузки данных животного');
        window.location.href = '/pages/animals.html';
      });

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

    document.getElementById('edit-animal-form').addEventListener('submit', async (e) => {
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
        const response = await fetch(`/api/animals/${animalId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          alert('Животное успешно обновлено!');
          window.location.href = '/pages/animals.html';
        } else {
          alert(data.message || 'Ошибка обновления животного');
        }
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Произошла ошибка. Попробуйте снова.');
      }
    });