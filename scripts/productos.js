const API_URL = './scripts/productos.json'; 
const catalogContainer = document.getElementById('catalogo');

let todosLosProductos = [];
let carrito = JSON.parse(localStorage.getItem('carritoMercaUP')) || [];

 async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error de Red: ${response.status}`);

        const jsonPayload = await response.json();
        if (jsonPayload.metadata.status !== 200) throw new Error('Estado de API comprometido.');

        todosLosProductos = jsonPayload.data;
        renderCatalog(todosLosProductos);

    } catch (error) {
        console.error('[Zero Trust] Caída de conexión:', error);
        catalogContainer.innerHTML = '<p>Error de conexión con el Servidor Principal.</p>';
    }
}

// 3. Capa de UI (Renderizado Determinístico sin Inline CSS/JS)
function renderCatalog(productsArray) {
    catalogContainer.innerHTML = ''; 
    const fragment = document.createDocumentFragment();

    productsArray.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const imageFile = product.imagePath.replace('.png', '.jpg');
        const hayExistencias = product.stock > 0;
        
        const buttonClass = hayExistencias ? 'btn-agregar' : 'btn-agotado';
        const buttonText = hayExistencias ? 'Agregar al carrito' : 'Agotado';
        const disableAttr = hayExistencias ? '' : 'disabled';

        productCard.innerHTML = `
            <img src="${imageFile}" alt="${product.name}" style="max-width: 100%; border-radius: 8px;">
            <h3>${product.name}</h3>
            <p>Categoría: ${product.category}</p>
            <p>Stock: ${product.stock}</p>
            <p><strong>Precio: $${product.price.toFixed(2)} ${product.currency}</strong></p>
            <button class="${buttonClass}" data-id="${product.productId}" ${disableAttr}>
                ${buttonText}
            </button>
        `;

        fragment.appendChild(productCard);
    });

    catalogContainer.appendChild(fragment);
}

catalogContainer.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && !event.target.disabled) {
        const productoId = event.target.getAttribute('data-id');
        agregarAlCarrito(productoId);
    }
});

function agregarAlCarrito(productoId) {
    carrito.push(productoId); 
    localStorage.setItem('carritoMercaUP', JSON.stringify(carrito));
    console.log(`[Store] Producto ${productoId} en carrito. Total: ${carrito.length}`);
    alert("¡Producto añadido al carrito!");
}

function filtrarCatalogo(termino){
    const terminoMinusculas = termino.toLowerCase().trim();
    const productosFiltrados = todosLosProductos.filter(producto => {
        return producto.name.toLowerCase().includes(terminoMinusculas) || 
               producto.category.toLowerCase().includes(terminoMinusculas);
    });
    renderCatalog(productosFiltrados);
}

document.addEventListener('DOMContentLoaded', fetchProducts);