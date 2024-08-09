import { fetchAndStoreCountries, getCountriesFromDB, populateCountrySelect } from './fetchCountries.js';

window.addEventListener('load', async () => {
    if (navigator.onLine) {
        await fetchAndStoreCountries();                   
    } else {
        const countries = await getCountriesFromDB();
        if (countries.length > 0) {
            populateCountrySelect(countries);
        }                
    }
    renderOlympics(); // Renderizar a lista ao carregar a página    
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('olympicsForm');    
    let isEditing = false; // Variável para verificar se estamos no modo de edição
    let currentEditId = null; // Armazena o ID do item que está sendo editado

    async function addOlympic(olympic) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('olympics', 'readwrite');
            const store = transaction.objectStore('olympics');
            const request = store.add(olympic);

            request.onsuccess = () => {
                resolve();
                renderOlympics(); // Renderizar a lista após adicionar
            };
            request.onerror = () => reject(request.error);
        });
    }

    async function deleteOlympic(id) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('olympics', 'readwrite');
            const store = transaction.objectStore('olympics');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
                renderOlympics(); // Renderizar a lista após excluir
            };
            request.onerror = () => reject(request.error);
        });
    }

    async function updateOlympic(id, updatedOlympic) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('olympics', 'readwrite');
            const store = transaction.objectStore('olympics');
            const request = store.put({ ...updatedOlympic, id });

            request.onsuccess = () => {
                resolve();
                renderOlympics(); // Renderizar a lista após atualizar
            };
            request.onerror = () => reject(request.error);
        });
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        const olympic = {
            year: document.getElementById('year').value,
            country: document.getElementById('country').value,
            sport: document.getElementById('sport').value,
            athlete: document.getElementById('athlete').value,
            medal: document.getElementById('medal').value,
            medalCount: parseInt(document.getElementById('medalCount').value, 10)
        };

        if (isEditing) {
            updateOlympic(currentEditId, olympic); // Atualizar item
            isEditing = false;
            currentEditId = null;
        } else {
            addOlympic(olympic); // Adicionar novo item
        }

        form.reset();
    });

    window.deleteOlympic = deleteOlympic; // Tornar deleteOlympic acessível globalmente

    window.editOlympic = (id, year, country, sport, athlete, medal, medalCount) => {
        document.getElementById('year').value = year;
        document.getElementById('country').value = country;
        document.getElementById('sport').value = sport;
        document.getElementById('athlete').value = athlete;
        document.getElementById('medal').value = medal;
        document.getElementById('medalCount').value = medalCount;

        isEditing = true;
        currentEditId = id;
    };

    renderOlympics(); // Renderizar a lista ao carregar a página
});

let dbPromise;

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('olympics-db', 1);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('olympics')) {
                db.createObjectStore('olympics', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
}

async function getDB() {
    if (!dbPromise) {
        dbPromise = await openDB();
    }
    return dbPromise;
}

async function getOlympics() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('olympics', 'readonly');
        const store = transaction.objectStore('olympics');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function renderOlympics() {
    const olympicsList = document.getElementById('olympicsList');
    olympicsList.innerHTML = ''; // Limpa a lista antes de renderizar novamente

    const olympics = await getOlympics();
    olympics.forEach((olympic) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Ano">${olympic.year}</td>
            <td data-label="País">${olympic.country}</td>
            <td data-label="Modalidade">${olympic.sport}</td>
            <td data-label="Nome do Atleta">${olympic.athlete}</td>
            <td data-label="Medalha">${olympic.medal}</td>
            <td data-label="Quantidade de Medalhas">${olympic.medalCount}</td>
            <td data-label="Ações" class="action-buttons">                    
                <button onclick="editOlympic(${olympic.id}, '${olympic.year}', '${olympic.country}', '${olympic.sport}', '${olympic.athlete}', '${olympic.medal}', ${olympic.medalCount})">Editar</button>
                <button onclick="deleteOlympic(${olympic.id})">Excluir</button>
            </td>
        `;
        olympicsList.appendChild(tr);
    });
}