async function createEvent() {
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const date = document.getElementById('event-date').value;
  
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title, description, date }),
    });
  
    if (response.ok) {
      alert('Мероприятие создано');
      window.location.href = 'profile.html';
    } else {
      alert('Ошибка при создании мероприятия');
    }
  }
  
  async function registerForEvent(event_id) {
    const response = await fetch('/api/events/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ event_id }),
    });
  
    if (response.ok) {
      alert('Вы зарегистрированы на мероприятие');
    } else {
      alert('Ошибка при регистрации');
    }
  }