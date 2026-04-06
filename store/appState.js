// Exportamos un único objeto de estado para mantener la sincronía de referencias
export const state = {
    todosLosProductos: [],
    carrito: JSON.parse(localStorage.getItem('carritoMercaUP')) || [],
    monedaActual: sessionStorage.getItem('monedaMercaUP') || 'MXN',
    tasasDeCambio: { MXN: 1 }
};

// Mutadores Puros (Modifican la memoria, no la pantalla)
export function initProductos(productos) {
    state.todosLosProductos = productos;
    // Sincronizar stock con el carrito guardado
    state.carrito.forEach(idGuardado => {
        const prod = state.todosLosProductos.find(p => p.productId === idGuardado);
        if (prod && prod.stock > 0) prod.stock -= 1;
    });
}

export function setTasas(tasas) {
    state.tasasDeCambio = tasas;
}

export function setMoneda(moneda) {
    state.monedaActual = moneda;
    sessionStorage.setItem('monedaMercaUP', moneda);
}

export function agregarAlCarrito(productoId) {
    const producto = state.todosLosProductos.find(p => p.productId === productoId);
    if (producto && producto.stock > 0) {
        producto.stock -= 1;
        state.carrito.push(productoId);
        localStorage.setItem('carritoMercaUP', JSON.stringify(state.carrito));
    }
}

export function eliminarDelCarrito(productoId) {
    const cantidadDevuelta = state.carrito.filter(id => id === productoId).length;
    state.carrito = state.carrito.filter(id => id !== productoId);
    localStorage.setItem('carritoMercaUP', JSON.stringify(state.carrito));
    
    const producto = state.todosLosProductos.find(p => p.productId === productoId);
    if (producto) producto.stock += cantidadDevuelta;
}

export function vaciarCarrito() {
    state.carrito.forEach(productoId => {
        const producto = state.todosLosProductos.find(p => p.productId === productoId);
        if (producto) producto.stock += 1;
    });
    state.carrito = [];
    localStorage.setItem('carritoMercaUP', JSON.stringify(state.carrito));
}

export function restarDelCarrito(productoId) {
    const cantidadActual = state.carrito.filter(id => id === productoId).length;
    
    if (cantidadActual <= 1) return; // Si solo hay 1, no hace nada (deben usar eliminar)

    const indexEnCarrito = state.carrito.indexOf(productoId);
    if (indexEnCarrito !== -1) {
        // Quitamos un ID del carrito
        state.carrito.splice(indexEnCarrito, 1);
        localStorage.setItem('carritoMercaUP', JSON.stringify(state.carrito));
        
        // Devolvemos 1 unidad de stock al catálogo
        const productoIndex = state.todosLosProductos.findIndex(p => p.productId === productoId);
        if (productoIndex !== -1) {
            state.todosLosProductos[productoIndex].stock += 1;
        }
    }
}