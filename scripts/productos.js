const API_URL = './scripts/productos.JSON';
const catalogContainer = document.getElementById('catalogo');

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Error de Red: ${response.status}`);
        }

        const jsonPayload = await response.json();

        if (jsonPayload.metadata.status !== 200) {
            throw new Error('La API retornó un estado comprometido.');
        }

        renderCatalog(jsonPayload.data);

    } catch (error) {
        console.error('[Zero Trust] Caída de conexión:', error);
        catalogContainer.innerHTML = '<p>Error de conexión con el Servidor Principal.</p>';
    }
}

function renderCatalog(productsArray) {
    catalogContainer.innerHTML = ''; 
    
    const fragment = document.createDocumentFragment();

    productsArray.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const imageFile = product.imagePath.replace('.png', '.jpg');

        productCard.innerHTML = `
            <img src="${imageFile}" alt="${product.name}" style="max-width: 100%; border-radius: 8px;">
            <h3>${product.name}</h3>
            <p>Categoría: ${product.category}</p>
            <p><strong>Precio: $${product.price.toFixed(2)} ${product.currency}</strong></p>
        `;
        
        fragment.appendChild(productCard);
    });

    catalogContainer.appendChild(fragment);
}

document.addEventListener('DOMContentLoaded', fetchProducts);