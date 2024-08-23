function searchPapers() {
    const input = document.getElementById('search-input').value.toLowerCase();
    const ul = document.querySelector('ul');
    const li = ul.getElementsByTagName('li');
    
    for (let i = 0; i < li.length; i++) {
        const year = li[i].getAttribute('data-year');
        const name = li[i].getAttribute('data-name').toLowerCase();
        
        if (year.includes(input) || name.includes(input)) {
            li[i].style.display = '';
        } else {
            li[i].style.display = 'none';
        }
    }
}
