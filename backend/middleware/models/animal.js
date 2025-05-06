async function addAnimal() {
    const name = document.getElementById('animal-name').value;
    const species = document.getElementById('animal-species').value;
    const gender = document.getElementById('animal-gender').value;
    const description = document.getElementById('animal-description').value;
    const status = document.getElementById('animal-status').value;
    const image = document.getElementById('animal-image').value;
  
    const response = await fetch('/api/animals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ name, species, gender, description, status, image }),
    });
  
    if (response.ok) {
      alert('Животное добавлено');
      window.location.href = 'animals.html';
    } else {
      alert('Ошибка при добавлении животного');
    }
  }async function addAnimal() {
    const name = document.getElementById('animal-name').value;
    const species = document.getElementById('animal-species').value;
    const gender = document.getElementById('animal-gender').value;
    const description = document.getElementById('animal-description').value;
    const status = document.getElementById('animal-status').value;
    const image = document.getElementById('animal-image').value;
  
    const response = await fetch('/api/animals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ name, species, gender, description, status, image }),
    });
  
    if (response.ok) {
      alert('Животное добавлено');
      window.location.href = 'animals.html';
    } else {
      alert('Ошибка при добавлении животного');
    }
  }