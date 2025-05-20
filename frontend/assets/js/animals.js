 // Загрузка навигационной панели
    fetch('../components/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar').innerHTML = data;
        updateAuthButtons();
      });

    // Обновление кнопок авторизации
    function updateAuthButtons() {
      const token = localStorage.getItem('token');
      const authButtons = document.getElementById('auth-buttons');
      if (token) {
        authButtons.innerHTML = `<a href="profile.html">Профиль</a>`;
      } else {
        authButtons.innerHTML = `<a href="login.html">Вход</a>`;
      }
    }

    // Проверка авторизации и роли
    function checkAuth() {
      const token = localStorage.getItem('token');
      if (!token) {
        document.getElementById('admin-actions').style.display = 'none';
        loadAnimals(); // Загружаем животных для неавторизованных
        return;
      }

      fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(response => {
          if (!response.ok) throw new Error('Ошибка авторизации');
          return response.json();
        })
        .then(data => {
          localStorage.setItem('role', data.role); // Сохраняем роль
          if (data.role === 'admin') {
            document.getElementById('admin-actions').style.display = 'block';
          }
          loadAnimals(); // Загружаем животных
        })
        .catch(error => {
          console.error('Ошибка проверки авторизации:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          updateAuthButtons();
          loadAnimals();
        });
    }

    // Загрузка списка животных
    function loadAnimals() {
      const name = document.getElementById('name-filter').value;
      const species = document.getElementById('species-filter').value;
      const gender = document.getElementById('gender-filter').value;
      const status = document.getElementById('status-filter').value;

      let query = '';
      if (name) query += `name=${encodeURIComponent(name)}&`;
      if (species) query += `species=${species}&`;
      if (gender) query += `gender=${gender}&`;
      if (status) query += `status=${status}&`;

      fetch(`/api/animals?${query}`)
        .then(response => response.json())
        .then(animals => {
          const animalList = document.getElementById('animal-list');
          animalList.innerHTML = '';
          animals.forEach(animal => {
            const animalCard = document.createElement('div');
            animalCard.className = 'animal-item';
            animalCard.innerHTML = `
              <h3>${animal.name}</h3>
              <p>Вид: ${animal.species === 'cat' ? 'Кошка' : 'Собака'}</p>
              <p>Пол: ${animal.gender === 'male' ? 'Мужской' : 'Женский'}</p>
              <p>Статус: ${animal.status}</p>
              <p>${animal.description}</p>
              ${animal.image ? `<img src="${animal.image}" alt="${animal.name}">` : ''}
              <div class="animal-actions" ${localStorage.getItem('role') !== 'admin' ? 'style="display: none;"' : ''}>
                <button onclick="openEditAnimalModal(${animal.id})">Редактировать</button>
                <button onclick="openDeleteAnimalModal(${animal.id}, '${animal.name}')">Удалить</button>
              </div>
            `;
            animalList.appendChild(animalCard);
          });
        })
        .catch(error => console.error('Ошибка загрузки животных:', error));
    }

    // Модальные окна
    const addAnimalModal = document.getElementById('add-animal-modal');
    const editAnimalModal = document.getElementById('edit-animal-modal');
    const deleteAnimalModal = document.getElementById('delete-animal-modal');

    function openModal(modal) {
      modal.classList.add('active');
    }

    function closeModal(modal) {
      modal.classList.remove('active');
    }

    document.querySelectorAll('.modal-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        closeModal(closeBtn.closest('.modal'));
      });
    });

    document.getElementById('open-add-animal-modal').addEventListener('click', () => {
      openModal(addAnimalModal);
    });

    // Добавление животного
    document.getElementById('add-animal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('name', document.getElementById('add-animal-name').value);
      formData.append('description', document.getElementById('add-animal-description').value);
      formData.append('species', document.getElementById('add-animal-species').value);
      formData.append('gender', document.getElementById('add-animal-gender').value);
      formData.append('status', document.getElementById('add-animal-status').value);
      const imageFile = document.getElementById('add-animal-image').files[0];
      if (imageFile) formData.append('image', imageFile);

      fetch('/api/animals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Животное добавлено') {
            closeModal(addAnimalModal);
            document.getElementById('add-animal-form').reset();
            loadAnimals();
          } else {
            alert(data.message);
          }
        })
        .catch(error => alert('Ошибка добавления животного: ' + error.message));
    });

    // Открытие модального окна редактирования
    window.openEditAnimalModal = function(id) {
      fetch(`/api/animals/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(response => response.json())
        .then(animal => {
          document.getElementById('edit-animal-id').value = animal.id;
          document.getElementById('edit-animal-name').value = animal.name;
          document.getElementById('edit-animal-description').value = animal.description;
          document.getElementById('edit-animal-species').value = animal.species;
          document.getElementById('edit-animal-gender').value = animal.gender;
          document.getElementById('edit-animal-status').value = animal.status;
          document.getElementById('edit-animal-current-image').textContent = animal.image ? animal.image : 'Нет изображения';
          openModal(editAnimalModal);
        })
        .catch(error => alert('Ошибка загрузки данных животного: ' + error.message));
    };

    // Редактирование животного
    document.getElementById('edit-animal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-animal-id').value;
      const formData = new FormData();
      formData.append('name', document.getElementById('edit-animal-name').value);
      formData.append('description', document.getElementById('edit-animal-description').value);
      formData.append('species', document.getElementById('edit-animal-species').value);
      formData.append('gender', document.getElementById('edit-animal-gender').value);
      formData.append('status', document.getElementById('edit-animal-status').value);
      const imageFile = document.getElementById('edit-animal-image').files[0];
      if (imageFile) formData.append('image', imageFile);

      fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Животное обновлено') {
            closeModal(editAnimalModal);
            loadAnimals();
          } else {
            alert(data.message);
          }
        })
        .catch(error => alert('Ошибка редактирования животного: ' + error.message));
    });

    // Открытие модального окна удаления
    window.openDeleteAnimalModal = function(id, name) {
      document.getElementById('delete-animal-id').value = id;
      document.getElementById('delete-animal-name').textContent = name;
      openModal(deleteAnimalModal);
    };

    // Удаление животного
    document.getElementById('confirm-delete-animal').addEventListener('click', () => {
      const id = document.getElementById('delete-animal-id').value;
      fetch(`/api/animals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Животное удалено') {
            closeModal(deleteAnimalModal);
            loadAnimals();
          } else {
            alert(data.message);
          }
        })
        .catch(error => alert('Ошибка удаления животного: ' + error.message));
    });

    document.querySelectorAll('.cancel-button').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.closest('.modal'));
      });
    });

    // Фильтры
    document.getElementById('name-filter').addEventListener('input', loadAnimals);
    document.getElementById('species-filter').addEventListener('change', loadAnimals);
    document.getElementById('gender-filter').addEventListener('change', loadAnimals);
    document.getElementById('status-filter').addEventListener('change', loadAnimals);
    document.getElementById('reset-filters').addEventListener('click', () => {
      document.getElementById('name-filter').value = '';
      document.getElementById('species-filter').value = '';
      document.getElementById('gender-filter').value = '';
      document.getElementById('status-filter').value = '';
      loadAnimals();
    });

    // Инициализация
    checkAuth();