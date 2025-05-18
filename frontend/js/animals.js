let userRole = null;

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
        .then(response => response.json())
        .then(user => {
          userRole = user.role;
          if (userRole === 'admin') {
            document.getElementById('admin-actions').style.display = 'block';
          }
          authButtons.innerHTML = `<a href="/pages/profile.html">Профиль</a>`;
          loadAnimals();
        })
        .catch(err => console.error('Ошибка проверки роли:', err));
    } else {
      authButtons.innerHTML = `<a href="/pages/login.html">Вход</a>`;
      loadAnimals();
    }
  })
  .catch(err => console.error('Ошибка загрузки навигации:', err));

function loadAnimals() {
  const token = localStorage.getItem('token');
  const name = document.getElementById('name-filter').value;
  const species = Array.from(document.getElementById('species-filter').selectedOptions).map(opt => opt.value).filter(v => v);
  const gender = Array.from(document.getElementById('gender-filter').selectedOptions).map(opt => opt.value).filter(v => v);
  const status = Array.from(document.getElementById('status-filter').selectedOptions).map(opt => opt.value).filter(v => v);

  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (species.length) params.append('species', species.join(','));
  if (gender.length) params.append('gender', gender.join(','));
  if (status.length) params.append('status', status.join(','));

  fetch(`/api/animals?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token || ''}`,
    },
  })
    .then(response => response.json())
    .then(animals => {
      const animalsList = document.getElementById('animals-list');
      animalsList.innerHTML = animals.map(animals => `
        <div class="animal-item">
          <h3>${animal.name.charAt(0).toUpperCase() + animal.name.slice(1)}</h3>
          <p>Вид: ${animal.species === 'cat' ? 'Кошка' : 'Собака'}</p>
          <p>Пол: ${animal.gender === 'male' ? 'Мужской' : 'Женский'}</p>
          <p>Статус: ${animal.status}</p>
          <p>Описание: ${animal.description || 'Нет описания'}</p>
          ${animal.image ? `<img src="${animal.image}" alt="${animal.name}" style="max-width: 200px;">` : ''}
          <div class="admin-buttons" style="display: ${userRole === 'admin' ? 'block' : 'none'};">
            <button onclick="editAnimal(${animal.id})">Редактировать</button>
            <button onclick="deleteAnimal(${animal.id})">Удалить</button>
          </div>
        </div>
      `).join('');
    })
    .catch(err => console.error('Ошибка загрузки животных:', err));
}

function clearFilters() {
  document.getElementById('name-filter').value = '';
  document.getElementById('species-filter').selectedIndex = 0;
  document.getElementById('gender-filter').selectedIndex = 0;
  document.getElementById('status-filter').selectedIndex = 0;
  loadAnimals();
}

function editAnimal(id) {
  window.location.href = `/pages/edit-animal.html?id=${id}`;
}

async function deleteAnimal(id) {
  if (confirm('Вы уверены, что хотите удалить это животное?')) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert('Животное удалено!');
        loadAnimals();
      } else {
        alert(data.message || 'Ошибка удаления животного');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Произошла ошибка. Попробуйте снова.');
    }
  }
}

window.onload = () => {
  if (!userRole && localStorage.getItem('token')) {
    fetch('/api/users/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
      .then(response => response.json())
      .then(user => {
        userRole = user.role;
        if (userRole === 'admin') {
          document.getElementById('admin-actions').style.display = 'block';
        }
        loadAnimals();
      })
      .catch(err => console.error('Ошибка проверки роли:', err));
  } else {
    loadAnimals();
  }
};