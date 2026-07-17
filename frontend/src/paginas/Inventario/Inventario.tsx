import { Plus, Package, AlertTriangle } from "lucide-react";


function Inventario(){


    const insumos = [
        {
            id:1,
            nombre:"Carne de hamburguesa",
            categoria:"Carnes",
            stock:15,
            unidad:"Kg",
            minimo:5,
            estado:"Activo"
        },
        {
            id:2,
            nombre:"Pan hamburguesa",
            categoria:"Panadería",
            stock:50,
            unidad:"Unidad",
            minimo:20,
            estado:"Activo"
        },
        {
            id:3,
            nombre:"Queso",
            categoria:"Lácteos",
            stock:3,
            unidad:"Kg",
            minimo:5,
            estado:"Bajo"
        }
    ];



    return(

        <div>


            <div className="flex justify-between items-center mb-6">


                <h1 className="text-3xl font-bold flex items-center gap-2">

                    <Package/>
                    Inventario

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
                gap-2"
                >

                    <Plus size={20}/>
                    Nuevo insumo

                </button>


            </div>



            <div className="bg-white rounded-xl shadow overflow-hidden">


                <table className="w-full">


                    <thead className="bg-gray-100">


                        <tr>

                            <th className="p-4 text-left">
                                Insumo
                            </th>

                            <th className="p-4 text-left">
                                Categoría
                            </th>

                            <th className="p-4 text-left">
                                Stock
                            </th>

                            <th className="p-4 text-left">
                                Unidad
                            </th>

                            <th className="p-4 text-left">
                                Estado
                            </th>


                        </tr>


                    </thead>



                    <tbody>


                    {
                        insumos.map(insumo=>(

                            <tr 
                            key={insumo.id}
                            className="border-t"
                            >


                                <td className="p-4">
                                    {insumo.nombre}
                                </td>


                                <td className="p-4">
                                    {insumo.categoria}
                                </td>


                                <td className="p-4">

                                    {insumo.stock}

                                </td>


                                <td className="p-4">

                                    {insumo.unidad}

                                </td>


                                <td className="p-4">


                                    {
                                        insumo.estado === "Bajo" ?

                                        <span
                                        className="
                                        bg-red-100
                                        text-red-700
                                        px-3
                                        py-1
                                        rounded-full
                                        flex
                                        items-center
                                        gap-1
                                        w-fit"
                                        >

                                            <AlertTriangle size={15}/>
                                            Stock bajo

                                        </span>

                                        :

                                        <span
                                        className="
                                        bg-green-100
                                        text-green-700
                                        px-3
                                        py-1
                                        rounded-full"
                                        >

                                            Activo

                                        </span>
                                    }


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


export default Inventario;