import { cartFullComponent, cartEmptyComponent } from './cart.js'; 
import { enviarCheckout } from '../services/apiServices.js';
import { state, vaciarCarrito } from '../store/appState.js';

const catalogContainer = document.getElementById('catalogo');
const cartContainer = document.querySelector('.cart-container');

export function renderCatalog(productsArray) {
    catalogContainer.innerHTML = ''; 
    if (productsArray.length === 0) {
        catalogContainer.innerHTML = '<p style="grid-column: 1 / -1;">No se encontraron productos.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    productsArray.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const imageFile = product.imagePath.replace('.png', '.jpg');
        const hayExistencias = product.stock > 0;
        
        const buttonClass = hayExistencias ? 'btn-agregar' : 'btn-agotado';
        const buttonText = hayExistencias ? 'Agregar al carrito' : 'Agotado';

        const tasa = state.tasasDeCambio[state.monedaActual] || 1;
        const precioConvertido = product.price * tasa;
        const precioFormateado = precioConvertido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const stockText = hayExistencias
            ? (product.stock <= 5 ? `<span style="color: #ff4d4d; font-weight: bold;">¡Solo quedan ${product.stock}!</span>` : `<strong>${product.stock}</strong>`)
            : '<span style="color: red; font-weight: bold;">Agotado</span>';

        productCard.innerHTML = `
            <img src="${imageFile}" alt="${product.name}" style="max-width: 100%; border-radius: 8px;">
            <h3>${product.name}</h3>
            <p><strong>Precio: $${precioFormateado} ${state.monedaActual}</strong></p>
            <p>Categoría: ${product.category}</p>
            <p>Stock Disponible: ${stockText}</p>
            <ul>
                ${Object.entries(product.specs).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
            </ul>
            <button class="${buttonClass}" data-id="${product.productId}" ${hayExistencias ? '' : 'disabled'}>
                ${buttonText}
            </button>
        `;
        fragment.appendChild(productCard);
    });
    catalogContainer.appendChild(fragment);
}

export function actualizarHUDCarrito() {
    if (cartContainer) {
        cartContainer.innerHTML = state.carrito.length > 0 ? cartFullComponent : cartEmptyComponent;
    }
    renderizarDrawerCarrito();
}

function renderizarDrawerCarrito() {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    if (!container) return;

    if (state.carrito.length === 0) {
        container.innerHTML = '<p>Tu carrito está vacío.</p>';
        totalElement.innerText = `0.00 ${state.monedaActual}`;
        return;
    }

    let html = '';
    let total = 0;
    const tasa = state.tasasDeCambio[state.monedaActual] || 1;

    // FIX ARCHITECTURE: Iteramos sobre el catálogo original para garantizar un orden determinístico,
    // ignorando el orden en el que fueron agregados al array del carrito.
    state.todosLosProductos.forEach(p => {
        // Contamos cuántas veces aparece este ID en el carrito
        const cantidad = state.carrito.filter(id => id === p.productId).length;
        
        if (cantidad > 0) {
            const subtotal = (p.price * tasa) * cantidad;
            total += subtotal;
            html += `
                <div class="cart-item-row" style="align-items: center;">
                    <span style="flex-grow: 1;">${p.name}</span>
                    <div style="display: flex; align-items: center; gap: 5px; margin-right: 15px;">
                        <button class="btn-restar" data-id="${p.productId}" ${cantidad <= 1 ? 'disabled' : ''} style="padding: 2px 6px; cursor: ${cantidad <= 1 ? 'not-allowed' : 'pointer'}; border: 1px solid #ccc; background: ${cantidad <= 1 ? '#eee' : '#fff'}; color: ${cantidad <= 1 ? '#aaa' : '#000'};">-</button>
                        <strong>${cantidad}</strong>
                        <button class="btn-sumar" data-id="${p.productId}" ${p.stock <= 0 ? 'disabled' : ''} style="padding: 2px 6px; cursor: ${p.stock <= 0 ? 'not-allowed' : 'pointer'}; border: 1px solid #ccc; background: ${p.stock <= 0 ? '#eee' : '#fff'}; color: ${p.stock <= 0 ? '#aaa' : '#000'};">+</button>
                    </div>
                    <span style="margin-right: 15px;">$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <button class="btn-eliminar" data-id="${p.productId}" style="background: none; border: none; cursor: pointer; color: red; font-size: 1.2rem;">🗑️</button>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    totalElement.innerText = `${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${state.monedaActual}`;
}

export function abrirModalPago() {
    if (state.carrito.length === 0) return alert("Tu carrito está vacío.");
    
    document.getElementById('cart-drawer').classList.remove('open');

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'modal-pago-activo';

    modalOverlay.innerHTML = `
        <div class="payment-modal" style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; margin: 10vh auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <h2>Pago con Tarjeta</h2>
            <div id="payment-error" style="color: red; margin-bottom: 10px; min-height: 20px;"></div>
            <input type="text" id="card-name" placeholder="Titular" style="width: 100%; margin-bottom: 10px; padding: 8px;">
            <input type="text" id="card-number" placeholder="0000 0000 0000 0000" maxlength="19" style="width: 100%; margin-bottom: 10px; padding: 8px;">
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <input type="text" id="card-expiry" placeholder="MM/AA" maxlength="5" style="width: 50%; padding: 8px;">
                <input type="password" id="card-cvv" placeholder="CVV" maxlength="4" style="width: 50%; padding: 8px;">
            </div>
            <div style="display: flex; justify-content: space-between;">
                <button id="btn-cancelar-pago" style="padding: 10px; cursor: pointer;">Cancelar</button>
                <button id="btn-confirmar-pago" style="padding: 10px; background: var(--yinmn-blue); color: white; cursor: pointer;">Pagar Ahora</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // Formateo de inputs
    document.getElementById('card-number').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
    });
    document.getElementById('card-expiry').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 2) this.value = this.value.substring(0, 2) + '/' + this.value.substring(2, 4);
    });

    document.getElementById('btn-cancelar-pago').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });

    document.getElementById('btn-confirmar-pago').addEventListener('click', async () => {
        const name = document.getElementById('card-name').value.trim();
        const number = document.getElementById('card-number').value.replace(/\s+/g, '');
        const errorDiv = document.getElementById('payment-error');

        if (name.length < 3 || number.length !== 16) {
            return errorDiv.innerText = "Datos de tarjeta inválidos.";
        }

        const datosPedido = { cliente: name, tarjeta: number.slice(-4), articulos: state.carrito };

        try {
            errorDiv.style.color = "blue";
            errorDiv.innerText = "Procesando en Subred Privada...";

            // Llamada al servicio
            const result = await enviarCheckout(datosPedido);

            // Éxito
            modalOverlay.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 8px; text-align: center; margin: 10vh auto; max-width: 400px;">
                    <h2 style="color: green;">¡Compra Exitosa!</h2>
                    <p>Pedido <strong>#${result.orderId}</strong> procesado.</p>
                    <button id="btn-cerrar-exito" style="padding: 10px 20px; background: var(--yinmn-blue); color: white; cursor: pointer; margin-top: 15px;">Aceptar</button>
                </div>
            `;

            document.getElementById('btn-cerrar-exito').addEventListener('click', () => {
                document.body.classList.remove('drawer-is-open');
                document.body.removeChild(modalOverlay);
            });

            // Limpiamos el estado GLOBAL
            vaciarCarrito();
            actualizarHUDCarrito();

        } catch (error) {
            errorDiv.style.color = "red";
            errorDiv.innerText = "Error en el servidor. Intenta de nuevo.";
        }
    });
}