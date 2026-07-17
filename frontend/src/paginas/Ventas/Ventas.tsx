import { ShoppingCart, Plus } from "lucide-react";


function Ventas(){


    const productos = [
        {
            id:1,
            nombre:"Hamburguesa Clásica",
            precio:25
        },
        {
            id:2,
            nombre:"Salchipapa Especial",
            precio:20
        },
        {
            id:3,
            nombre:"Refresco",
            precio:8
        }
    ];


    const detalle = [
        {
            producto:"Hamburguesa Clásica",
            cantidad:2,
            subtotal:50
        },
        {
            producto:"Refresco",
            cantidad:1,
            subtotal:8
        }
    ];


    return(

        <div>


            <h1 className="text-3xl font-bold mb-6">
                Nueva Venta
            </h1>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


                {/* Productos */}

                <div className="bg-white rounded-xl shadow p-5">


                    <h2 className="text-xl font-semibold mb-4">
                        Productos
                    </h2>



                    <div className="space-y-3">


                    {
                        productos.map(producto=>(

                            <div
                            key={producto.id}
                            className="
                            border
                            rounded-lg
                            p-4
                            flex
                            justify-between
                            items-center"
                            >

                                <div>

                                    <h3 className="font-medium">
                                        {producto.nombre}
                                    </h3>

                                    <p className="text-gray-500">
                                        Bs. {producto.precio}
                                    </p>

                                </div>


                                <button
                                className="
                                bg-red-700
                                text-white
                                p-2
                                rounded-full"
                                >

                                    <Plus size={18}/>

                                </button>


                            </div>


                        ))
                    }


                    </div>


                </div>




                {/* Detalle venta */}

                <div className="bg-white rounded-xl shadow p-5">


                    <h2 className="text-xl font-semibold mb-4 flex gap-2">

                        <ShoppingCart/>
                        Detalle venta

                    </h2>



                    <table className="w-full">


                        <thead className="bg-gray-100">

                            <tr>

                                <th className="p-3 text-left">
                                    Producto
                                </th>

                                <th className="p-3">
                                    Cantidad
                                </th>

                                <th className="p-3">
                                    Subtotal
                                </th>

                            </tr>

                        </thead>


                        <tbody>


                        {
                            detalle.map((item,index)=>(

                                <tr
                                key={index}
                                className="border-t"
                                >

                                    <td className="p-3">
                                        {item.producto}
                                    </td>

                                    <td className="p-3 text-center">
                                        {item.cantidad}
                                    </td>

                                    <td className="p-3 text-center">
                                        Bs. {item.subtotal}
                                    </td>


                                </tr>

                            ))
                        }


                        </tbody>


                    </table>



                    <div className="mt-6 border-t pt-4">


                        <h3 className="text-2xl font-bold">

                            Total: Bs. 58

                        </h3>



                        <button
                        className="
                        mt-4
                        w-full
                        bg-green-600
                        text-white
                        py-3
                        rounded-lg"
                        >

                            Registrar venta

                        </button>


                    </div>


                </div>



            </div>


        </div>

    )

}


export default Ventas;