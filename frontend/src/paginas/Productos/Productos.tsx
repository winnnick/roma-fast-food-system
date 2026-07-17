import { Plus, Pencil, Trash2 } from "lucide-react";


function Productos(){

    const productos = [
        {
            id:1,
            nombre:"Hamburguesa Clásica",
            precio:25,
            estado:"Activo"
        },
        {
            id:2,
            nombre:"Salchipapa Especial",
            precio:20,
            estado:"Activo"
        },
        {
            id:3,
            nombre:"Refresco",
            precio:8,
            estado:"Activo"
        }
    ];


    return(

        <div>


            <div className="flex justify-between items-center mb-6">

                <h1 className="text-3xl font-bold">
                    Productos
                </h1>


                <button
                className="
                bg-red-700
                text-white
                px-4
                py-2
                rounded-lg
                flex
                items-center
                gap-2
                hover:bg-red-800"
                >

                    <Plus size={20}/>
                    Nuevo producto

                </button>


            </div>



            <div className="bg-white rounded-xl shadow overflow-hidden">


                <table className="w-full">


                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-4 text-left">
                                Nombre
                            </th>

                            <th className="p-4 text-left">
                                Precio
                            </th>

                            <th className="p-4 text-left">
                                Estado
                            </th>

                            <th className="p-4 text-left">
                                Acciones
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                        {
                            productos.map(producto=>(

                                <tr 
                                key={producto.id}
                                className="border-t"
                                >

                                    <td className="p-4">
                                        {producto.nombre}
                                    </td>


                                    <td className="p-4">
                                        Bs. {producto.precio}
                                    </td>


                                    <td className="p-4">

                                        <span
                                        className="
                                        bg-green-100
                                        text-green-700
                                        px-3
                                        py-1
                                        rounded-full
                                        text-sm"
                                        >

                                            {producto.estado}

                                        </span>

                                    </td>


                                    <td className="p-4 flex gap-3">


                                        <button
                                        className="text-blue-600"
                                        >

                                            <Pencil size={20}/>

                                        </button>


                                        <button
                                        className="text-red-600"
                                        >

                                            <Trash2 size={20}/>

                                        </button>


                                    </td>


                                </tr>

                            ))
                        }


                    </tbody>


                </table>


            </div>


        </div>

    )

}


export default Productos;