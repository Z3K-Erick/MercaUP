import { obtenerProductos, obtenerTasasCambio } from './services/apiServices.js';
import { state, initProductos, setTasas, setMoneda, agregarAlCarrito, restarDelCarrito, eliminarDelCarrito, vaciarCarrito } from './store/appState.js';
import { renderCatalog, actualizarHUDCarrito, abrirModalPago } from './components/uiRenderer.js';

const catalogContainer = document.getElementById('catalogo');
const searchBar = document.getElementById('search-bar');
const cartContainer = document.querySelector('.cart-container');

let debounceTimer;

async function inicializarApp() {
    try {
        const [productosRaw, tasasRaw] = await Promise.all([
            obtenerProductos(),
            obtenerTasasCambio()
        ]);
        
        initProductos(productosRaw);
        setTasas(tasasRaw);
    } catch (error) {
        console.error('[Boot Error]', error);
        catalogContainer.innerHTML = '<p class="error" style="color: red;">Fallo crítico al conectar con el Servidor Principal en AWS.</p>';
        return;
    }

    // Inyectar Drawer inicial
    document.body.insertAdjacentHTML('beforeend', `
        <div id="cart-drawer" class="cart-drawer">
            <div class="cart-header">
                <h3>Resumen de Compra</h3>
                <select id="currency-selector" style="margin-left: auto; margin-right: 15px;">
                    <option value="MXN" ${state.monedaActual === 'MXN' ? 'selected' : ''}>MXN</option>
                    <option value="USD" ${state.monedaActual === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="EUR" ${state.monedaActual === 'EUR' ? 'selected' : ''}>EUR</option>
                </select>
                <button class="close-cart-btn" id="close-drawer">✕</button>
            </div>
            <div id="cart-items-container" class="cart-items-container"></div>
            <div class="cart-footer">
                <p>Total: <strong id="cart-total-price">0.00</strong></p>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-vaciar" style="background-color: #ff4d4d; color: white; border: none; padding: 10px; cursor: pointer; flex: 1;">Vaciar</button>
                    <button class="btn-checkout" id="btn-checkout" style="flex: 2;">Pagar</button>
                </div>
            </div>
        </div>
    `);

    renderCatalog(state.todosLosProductos);
    actualizarHUDCarrito();
    anclarEventosGlobales();
}

function anclarEventosGlobales() {
    // 1. Catálogo
    catalogContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
            agregarAlCarrito(e.target.getAttribute('data-id'));
            renderCatalog(state.todosLosProductos);
            actualizarHUDCarrito();
        }
    });

    // 2. Buscador
    searchBar.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const termino = e.target.value.toLowerCase().trim();
            const filtrados = state.todosLosProductos.filter(p => 
                p.name.toLowerCase().includes(termino) || p.category.toLowerCase().includes(termino)
            );
            renderCatalog(filtrados);
        }, 300);
    });

    // 3. Drawer y Moneda (Restauramos drawer-is-open)
    cartContainer.addEventListener('click', () => {
        document.getElementById('cart-drawer').classList.add('open');
        document.body.classList.add('drawer-is-open'); // FIX: Devuelve el scroll-lock
    });
    
    document.getElementById('close-drawer').addEventListener('click', () => {
        document.getElementById('cart-drawer').classList.remove('open');
        document.body.classList.remove('drawer-is-open'); // FIX
    });

    // 4. Carrito Interno (Añadimos delegación para sumar y restar)
    document.getElementById('cart-items-container').addEventListener('click', (e) => {
        const btnEliminar = e.target.closest('.btn-eliminar');
        const btnSumar = e.target.closest('.btn-sumar');
        const btnRestar = e.target.closest('.btn-restar');

        if (btnEliminar) {
            eliminarDelCarrito(btnEliminar.getAttribute('data-id'));
        } else if (btnSumar) {
            agregarAlCarrito(btnSumar.getAttribute('data-id'));
        } else if (btnRestar) {
            restarDelCarrito(btnRestar.getAttribute('data-id'));
        } else {
            return; // Si no hizo clic en ningún botón, abortamos.
        }
        
        // Repintamos solo si se ejecutó alguna acción
        renderCatalog(state.todosLosProductos);
        actualizarHUDCarrito();
    });

    const currencySelector = document.getElementById('currency-selector');
    if (currencySelector) {
        currencySelector.addEventListener('change', (e) => {
            setMoneda(e.target.value);
            renderCatalog(state.todosLosProductos);
            actualizarHUDCarrito();
        });
    }

    document.getElementById('btn-vaciar').addEventListener('click', () => {
        vaciarCarrito();
        renderCatalog(state.todosLosProductos);
        actualizarHUDCarrito();
    });

    document.getElementById('btn-checkout').addEventListener('click', () => {
        abrirModalPago();
    });
}

document.addEventListener('DOMContentLoaded', inicializarApp);