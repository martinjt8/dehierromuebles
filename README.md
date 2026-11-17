# De Hierro Muebles

Página web de De Hierro Muebles: muebles de hierro y madera hechos a medida en Santa Fe.

Es un sitio estático de un solo archivo (`index.html`) publicado con GitHub Pages.

## Cómo editar

- **Datos de contacto y nombre:** objeto `CONFIG` al principio del `<script>` en `index.html`.
- **Catálogo:** array `PRODUCTOS` en el mismo script (nombre, descripción, medidas, materiales y foto).
- **Fotos:** carpeta `img/`, con nombres descriptivos (por ejemplo `mesa-ratonera-living.jpg`). Si una foto falta, se muestra un dibujo de referencia.

## WhatsApp

`CONFIG.whatsapp` está vacío: mientras no haya número, los botones de consulta llevan al chat de Instagram y el formulario ofrece Instagram o mail. Al cargar el número (ej. `5493421234567`) y `whatsappVisible`, todo vuelve a WhatsApp solo.
