import React, { useRef, useState, useEffect } from 'react';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { FaLocationArrow, FaBars, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import './app.css';

function App() {
  // Cargar la API de Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [mapa, setMapa] = useState(null);
  const [respostaDireccions, setRespostaDireccions] = useState(null);
  const [ubicacioUsuario, setUbicacioUsuario] = useState(null);
  const [rutesGuardades, setRutesGuardades] = useState([]);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [puntsIntermitjos, setPuntsIntermitjos] = useState([]);
  const origenRef = useRef();
  const destiRef = useRef();
  const nomRutaRef = useRef();

  // Obtener ubicación actual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUbicacioUsuario({ lat: latitude, lng: longitude });
          if (mapa) {
            mapa.panTo({ lat: latitude, lng: longitude });
            new window.google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: mapa,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: 'blue',
                fillOpacity: 1,
                strokeWeight: 0,
              },
            });
          }
        },
        () => {
          console.error('Error obteniendo geolocalización');
        }
      );
    }
  }, [mapa]);

  // Cargar rutas guardadas al inicio
  useEffect(() => {
    const routes = JSON.parse(localStorage.getItem('rutesGuardades')) || [];
    setRutesGuardades(routes);
  }, []);
  
  if (loadError) {
    return <div>Error cargando mapas</div>;
  }

  if (!isLoaded) {
    return <div>Cargando...</div>;
  }

  // Establecer origen a ubicación actual
  function establirOrigenUbicacio() {
    if (ubicacioUsuario) {
      origenRef.current.value = `${ubicacioUsuario.lat},${ubicacioUsuario.lng}`;
    }
  }
  
  // Calcular ruta
  async function calcularRuta() {
    if (!origenRef.current.value || !destiRef.current.value) {
      return;
    }
    const serveiDireccions = new window.google.maps.DirectionsService();
    const resultats = await serveiDireccions.route({
      origin: origenRef.current.value,
      destination: destiRef.current.value,
      travelMode: window.google.maps.TravelMode.BICYCLING,//modo bicicleta para rutas rapidas
      waypoints: puntsIntermitjos.map(punt => ({ location: punt })),
    });
    setRespostaDireccions(resultats);
  }
  
  // Limpiar ruta
  function limpiarRuta() {
    setRespostaDireccions(null);
    origenRef.current.value = '';
    destiRef.current.value = '';
    setPuntsIntermitjos([]);
  }
  
  // Guardar ruta
  function guardarRuta() {
    const ruta = {
      name: nomRutaRef.current.value || 'Ruta sin nombre',
      origin: origenRef.current.value,
      destination: destiRef.current.value,
      waypoints: puntsIntermitjos,
    };
    const rutesActualitzades = [...rutesGuardades, ruta];
    setRutesGuardades(rutesActualitzades);
    localStorage.setItem('rutesGuardades', JSON.stringify(rutesActualitzades));
    nomRutaRef.current.value = '';
  }
  
  // Cargar ruta guardada
  function cargarRuta(ruta) {
    origenRef.current.value = ruta.origin;
    destiRef.current.value = ruta.destination;
    setPuntsIntermitjos(ruta.waypoints);
    setMostrarMenu(false);
  }

  // Eliminar ruta guardada
  function eliminarRuta(index) {
    const rutesActualitzades = rutesGuardades.filter((_, i) => i !== index);
    setRutesGuardades(rutesActualitzades);
    localStorage.setItem('rutesGuardades', JSON.stringify(rutesActualitzades));
  }
  
  // Añadir punto intermedio
  function afegirPuntIntermig() {
    const punt = prompt('Introduce una parada:');
    if (punt) {
      setPuntsIntermitjos([...puntsIntermitjos, punt]);
    }
  }
  
  return (
    <div className="contenedor-app">
      <div className="contenedor-mapa">
        <GoogleMap
          center={ubicacioUsuario}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(mapa) => {
            setMapa(mapa);
            limpiarRuta(); // Limpiar rutas al cargar un nuevo mapa
          }}
        >
          {ubicacioUsuario && (
            <Marker position={ubicacioUsuario} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: 'blue', fillOpacity: 1, strokeWeight: 0 }} />
          )}
          {puntsIntermitjos.map((punt, index) => (
            <Marker key={index} position={{ lat: Number(punt.lat), lng: Number(punt.lng) }} />
          ))}
          {respostaDireccions && (
            <DirectionsRenderer directions={respostaDireccions} />
          )}
        </GoogleMap>
      </div>
      <div className={`menu-ruta ${mostrarMenu ? 'menu-expanded' : ''}`}>
        <div className="toggle-menu">
          <button onClick={() => setMostrarMenu(!mostrarMenu)} style={{ border: 'none', background: 'none' }}>
            <FaBars />
          </button>
        </div>
        <div className="desplegable-menu" style={{ display: mostrarMenu ? 'block' : 'none' }}>
          <div className="rutas-guardadas">
            <p style={{ margin: '0', fontWeight: 'bold' }}>Rutas guardadas</p>
            {rutesGuardades.length === 0 ? (
              <p>No hay rutas guardadas</p>
            ) : (
              rutesGuardades.map((ruta, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>{ruta.name}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => cargarRuta(ruta)} className="boton-ruta">
                      Cargar
                    </button>
                    <button onClick={() => eliminarRuta(index)} className="boton-ruta" style={{ backgroundColor: '#E53E3E' }}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="opciones-ruta">
            <p style={{ margin: '0', fontWeight: 'bold' }}>Opciones de ruta</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button onClick={afegirPuntIntermig} className="boton-ruta">
                <FaPlus />
                Añadir parada
              </button>
              <button onClick={limpiarRuta} className="boton-ruta">
                Limpiar ruta
              </button>
            </div>
            <div>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Guardar ruta</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="text" ref={nomRutaRef} placeholder="Nombre de la ruta" className="input-autocomplete" />
                <button onClick={guardarRuta} className="boton-ruta">
                  <FaSave />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="inputs-autocomplete">
          <Autocomplete>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type='text' placeholder='Origen' ref={origenRef} className="input-autocomplete" />
              <button onClick={establirOrigenUbicacio} className="boton-ruta" style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#3182CE', color: 'white', border: 'none' }}>
                <FaLocationArrow />
              </button>
            </div>
          </Autocomplete>
          <Autocomplete>
            <input type='text' placeholder='Destino' ref={destiRef} className="input-autocomplete" />
          </Autocomplete>
          <button onClick={calcularRuta} className="boton-ruta">
            Calcular ruta
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
