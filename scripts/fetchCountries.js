const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all'; // API Restcountries
const COUNTRIES_API_URL = 'https://countriesnow.space/api/v0.1/countries'; // API Countries API

// Abrir ou criar um banco de dados IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('countries-db', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('countries')) {
                db.createObjectStore('countries', { keyPath: 'code' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Buscar a lista de países da API Restcountries
async function fetchFromRestCountries() {
    const response = await fetch(REST_COUNTRIES_URL);
    if (!response.ok) {
        throw new Error('Error fetching countries from Restcountries');
    }
    return response.json();
}

// Buscar a lista de países da API Countries API
async function fetchFromCountriesAPI() {
    const response = await fetch(COUNTRIES_API_URL);
    if (!response.ok) {
        throw new Error('Error fetching countries from  Countries API');
    }
    return response.json();
}

// Armazenar a lista de países no IndexedDB
async function storeCountriesInDB(countries) {
    const db = await openDB();

    const transaction = db.transaction('countries', 'readwrite');
    const store = transaction.objectStore('countries');

    countries.forEach(country => {
        store.put(country);
    });

    await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = (event) => reject(event.target.error);
    });
}

// Buscar a lista de países do IndexedDB
async function getCountriesFromDB() {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('countries', 'readonly');
        const store = transaction.objectStore('countries');
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Preencher o campo de seleção de países
function populateCountrySelect(countries) {
    const countrySelect = document.getElementById('country');
    countrySelect.innerHTML = '<option value="">Selecione um país</option>'; // Limpa o select antes de preencher

    // países em ordem alfabética
    countries.sort((a, b) => a.name.localeCompare(b.name));

    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
}

// Buscar e armazenar a lista de países
async function fetchAndStoreCountries() {
    try {
        let countryList = [];

        try {
            // Tenta buscar a lista de países da Restcountries
            const data = await fetchFromRestCountries();
            countryList = data.map(country => ({
                name: country.name.common,
                code: country.cca2
            }));
        } catch (error) {
            console.error('Restcountries has failed! Trying Countries API:', error);
            try {
                // Tenta buscar a lista de países da Countries API
                const data = await fetchFromCountriesAPI();
                countryList = data.data.map(country => ({
                    name: country.name,
                    code: country.countryCode
                }));
            } catch (error) {
                console.error('Countries API has failed! Trying to fetch data from IndexedDB:', error);
                countryList = await getCountriesFromDB();
            }
        }

        // Armazena a lista de países no IndexedDB
        if (countryList.length > 0) {
            await storeCountriesInDB(countryList);
        }

        // Preenche o campo de seleção de países
        populateCountrySelect(countryList);
    } catch (error) {
        console.error('Error fetching and storing countries:', error);
    }
}

export { fetchAndStoreCountries, getCountriesFromDB, populateCountrySelect };
