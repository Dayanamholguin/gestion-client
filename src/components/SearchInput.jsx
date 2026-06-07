function SearchInput({
  busqueda,
  setBusqueda,
}) {

  return (
    <div className="mb-6">

      <input
        type="text"
        placeholder="
          Buscar por nombre,
          apellido, correo o documento
        "
        value={busqueda}
        onChange={(e) =>
          setBusqueda(e.target.value)
        }
        className="
          w-full
          p-3
          border
          rounded-md
          shadow-sm
        "
      />

    </div>
  );
}

export default SearchInput;